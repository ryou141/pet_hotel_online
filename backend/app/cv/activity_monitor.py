"""
Background task: every N seconds capture a frame from each active room camera,
run YOLO inference, and save the result to PetActivityLog.
Every ANALYZE_EVERY iterations analyze accumulated data and generate
StaffNotes when prolonged inactivity or hyperactivity is detected.
"""

import asyncio
import logging
from collections import Counter
from datetime import datetime, timedelta

import cv2

from app.database import SessionLocal
from app.models.models import Booking, Camera, PetActivityLog, StaffNote

logger = logging.getLogger("cv.activity_monitor")

INTERVAL_SECONDS = 10    # sampling interval
ANALYZE_EVERY    = 180   # run analysis every N samples (~30 min)
WINDOW_SIZE      = 180   # records to inspect per analysis (~30 min)
NOTE_COOLDOWN    = 60    # minutes between repeated notes of same type


STATE_RU = {
    "lying":    "лежит",
    "sitting":  "сидит",
    "standing": "стоит",
    "moving":   "активен / двигается",
    "unknown":  "не обнаружен в кадре",
}


def _capture_frame(stream_url: str):
    try:
        cap = cv2.VideoCapture(stream_url)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        ret, frame = cap.read()
        cap.release()
        return frame if ret else None
    except Exception as exc:
        logger.warning("Frame capture failed (%s): %s", stream_url, exc)
        return None


def _has_recent_note(db, pet_id: int, tag: str) -> bool:
    cutoff = datetime.utcnow() - timedelta(minutes=NOTE_COOLDOWN)
    return db.query(StaffNote).filter(
        StaffNote.pet_id == pet_id,
        StaffNote.content.startswith(f"[CV:{tag}]"),
        StaffNote.created_at >= cutoff,
    ).first() is not None


def _analyze(db, pet_id: int, pet_name: str, room_number: str):
    logs = (
        db.query(PetActivityLog)
        .filter(PetActivityLog.pet_id == pet_id)
        .order_by(PetActivityLog.created_at.desc())
        .limit(WINDOW_SIZE)
        .all()
    )

    valid = [l.state for l in logs if l.state != "unknown"]
    if len(valid) < WINDOW_SIZE // 3:
        return

    counts = Counter(valid)
    total  = len(valid)

    still   = counts.get("lying", 0) + counts.get("sitting", 0)
    moving  = counts.get("moving", 0)

    # Prolonged inactivity: ≥85% still, no movement at all
    if still >= total * 0.85 and moving == 0:
        if not _has_recent_note(db, pet_id, "INACTIVE"):
            dominant = "lying" if counts.get("lying", 0) >= counts.get("sitting", 0) else "sitting"
            minutes  = (WINDOW_SIZE * INTERVAL_SECONDS) // 60
            db.add(StaffNote(
                pet_id=pet_id,
                staff_id=None,
                content=(
                    f"[CV:INACTIVE] {pet_name} {STATE_RU[dominant]} без движения "
                    f"более {minutes} мин — комната №{room_number}"
                ),
                is_public=False,
            ))
            db.commit()
            logger.info("Generated INACTIVE note for pet %d", pet_id)

    # Hyperactivity: ≥75% moving
    elif moving >= total * 0.75:
        if not _has_recent_note(db, pet_id, "ACTIVE"):
            db.add(StaffNote(
                pet_id=pet_id,
                staff_id=None,
                content=(
                    f"[CV:ACTIVE] {pet_name} проявляет повышенную активность — "
                    f"комната №{room_number} ({moving} из {total} замеров)"
                ),
                is_public=False,
            ))
            db.commit()
            logger.info("Generated ACTIVE note for pet %d", pet_id)


def _run_sync(iteration: int):
    from app.cv.detector import _run_yolo
    from sqlalchemy.orm import joinedload

    db = SessionLocal()
    try:
        bookings = (
            db.query(Booking)
            .options(joinedload(Booking.pet), joinedload(Booking.room))
            .filter(Booking.status == "active")
            .all()
        )

        for b in bookings:
            if not b.pet or not b.room:
                continue

            camera = db.query(Camera).filter(
                Camera.room_id == b.room_id,
                Camera.is_active == True,
            ).first()

            if not camera:
                continue

            frame = _capture_frame(camera.stream_url)
            if frame is None:
                state, confidence = "unknown", 0.0
            else:
                res        = _run_yolo(frame)
                state      = res.get("state", "unknown")
                confidence = res.get("confidence", 0.0)

            db.add(PetActivityLog(
                pet_id=b.pet_id,
                booking_id=b.id,
                state=state,
                confidence=confidence,
            ))

        db.commit()

        # Pattern analysis every ANALYZE_EVERY iterations
        if iteration % ANALYZE_EVERY == 0 and iteration > 0:
            for b in bookings:
                if b.pet and b.room:
                    _analyze(db, b.pet_id, b.pet.name, b.room.number)

    except Exception as exc:
        logger.error("Activity monitor error: %s", exc)
        db.rollback()
    finally:
        db.close()


async def activity_monitor_loop(interval_seconds: int = INTERVAL_SECONDS):
    await asyncio.sleep(90)  # wait for server to fully start
    loop = asyncio.get_event_loop()
    iteration = 0
    while True:
        try:
            await loop.run_in_executor(None, _run_sync, iteration)
        except Exception as exc:
            logger.error("Activity monitor loop error: %s", exc)
        iteration += 1
        await asyncio.sleep(interval_seconds)
