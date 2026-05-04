"""
Background task: every day at 20:00 send each pet owner an email
with all staff notes created that day for their pets.
"""

import asyncio
import logging
from collections import defaultdict
from datetime import date, datetime, timedelta

from app.database import SessionLocal
from app.models.models import Pet, StaffNote, User

logger = logging.getLogger("cv.daily_report")


def _send_reports_sync():
    from app.core.email import send_daily_report_email

    db = SessionLocal()
    try:
        today       = date.today()
        day_start   = datetime.combine(today, datetime.min.time())
        day_end     = datetime.combine(today, datetime.max.time())

        notes = (
            db.query(StaffNote)
            .filter(
                StaffNote.created_at >= day_start,
                StaffNote.created_at <= day_end,
                StaffNote.is_public == True,
            )
            .order_by(StaffNote.created_at.asc())
            .all()
        )

        if not notes:
            logger.info("Daily report: no notes today, skipping")
            return

        # Group notes by owner email → [(pet, [notes])]
        pet_cache: dict[int, Pet] = {}
        user_data: dict[str, tuple[User, list]] = {}  # email → (user, [(pet, notes)])

        notes_by_pet: dict[int, list] = defaultdict(list)
        for n in notes:
            notes_by_pet[n.pet_id].append(n)

        for pet_id, pet_notes in notes_by_pet.items():
            if pet_id not in pet_cache:
                pet = db.query(Pet).filter(Pet.id == pet_id).first()
                if not pet:
                    continue
                pet_cache[pet_id] = pet
            else:
                pet = pet_cache[pet_id]

            owner = db.query(User).filter(User.id == pet.owner_id).first()
            if not owner or not owner.email:
                continue

            if owner.email not in user_data:
                user_data[owner.email] = (owner, [])
            user_data[owner.email][1].append((pet, pet_notes))

        sent = 0
        for email, (owner, pet_entries) in user_data.items():
            try:
                send_daily_report_email(email, owner, pet_entries, today)
                sent += 1
            except Exception as exc:
                logger.error("Failed to send daily report to %s: %s", email, exc)

        logger.info("Daily reports sent: %d", sent)
    except Exception as exc:
        logger.error("Daily report error: %s", exc)
    finally:
        db.close()


async def daily_report_loop(hour: int = 20):
    loop = asyncio.get_event_loop()
    while True:
        now    = datetime.now()
        target = now.replace(hour=hour, minute=0, second=0, microsecond=0)
        if now >= target:
            target += timedelta(days=1)

        wait = (target - now).total_seconds()
        logger.info("Daily report scheduled in %.0f min", wait / 60)
        await asyncio.sleep(wait)

        try:
            await loop.run_in_executor(None, _send_reports_sync)
        except Exception as exc:
            logger.error("Daily report loop error: %s", exc)
