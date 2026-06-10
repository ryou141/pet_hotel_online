"""
Background task: every N minutes capture a frame from each active room camera,
run YOLO inference, and write a StaffNote for the pet.
"""

import asyncio
import logging

import cv2

from app.database import SessionLocal
from app.models.models import Booking, Camera, StaffNote

logger = logging.getLogger("cv.auto_notes")

STATE_RU = {
    "lying":    "лежит",
    "sitting":  "сидит",
    "standing": "стоит",
    "moving":   "активен / двигается",
    "eating":   "кушает",
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


def _run_notes_sync():
    """Synchronous part: DB queries + inference (runs in thread executor)."""
    from app.cv.detector import _run_yolo
    from sqlalchemy.orm import joinedload

    db = SessionLocal()
    count = 0
    try:
        bookings = (
            db.query(Booking)
            .options(joinedload(Booking.pet), joinedload(Booking.room))
            .filter(Booking.status == "active")
            .all()
        )

        for b in bookings:
            if not b.room or not b.pet:
                continue

            camera = db.query(Camera).filter(
                Camera.room_id == b.room_id,
                Camera.is_active == True,
            ).first()

            if not camera:
                continue

            frame = _capture_frame(camera.stream_url)
            if frame is None:
                continue

            result = _run_yolo(frame)
            state = result.get("state", "unknown")
            conf  = int(result.get("confidence", 0) * 100)
            state_ru = STATE_RU.get(state, state)

            if state == "unknown":
                content = f"[CV] {b.pet.name} — не обнаружен в кадре (комната №{b.room.number})"
            else:
                content = f"[CV] {b.pet.name} {state_ru} — комната №{b.room.number} (уверенность {conf}%)"

            db.add(StaffNote(pet_id=b.pet_id, staff_id=None, content=content, is_public=False))
            count += 1

        db.commit()
        logger.info("CV auto-notes: %d notes created", count)
    except Exception as exc:
        logger.error("CV auto-notes error: %s", exc)
        db.rollback()
    finally:
        db.close()


async def cv_auto_notes_loop(interval_minutes: int = 30):
    await asyncio.sleep(60)  # let the server fully start first
    loop = asyncio.get_event_loop()
    while True:
        try:
            await loop.run_in_executor(None, _run_notes_sync)
        except Exception as exc:
            logger.error("Auto-notes loop error: %s", exc)
        await asyncio.sleep(interval_minutes * 60)
