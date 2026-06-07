from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from collections import Counter
from datetime import datetime, timedelta
from app.database import get_db
from app.api.deps import get_current_user, get_current_admin
from app.models.models import PetActivityLog, Pet, User
from app.schemas.schemas import PetActivityLogOut

router = APIRouter()


@router.get("/pet/{pet_id}", response_model=List[PetActivityLogOut])
def get_pet_activity(
    pet_id: int,
    limit: int = Query(default=100, le=1000),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец не найден")
    return (
        db.query(PetActivityLog)
        .filter(PetActivityLog.pet_id == pet_id)
        .order_by(PetActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/pet/{pet_id}/summary")
def get_pet_activity_summary(
    pet_id: int,
    hours: int = Query(default=1, le=24),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец не найден")

    since = datetime.utcnow() - timedelta(hours=hours)
    logs = (
        db.query(PetActivityLog)
        .filter(PetActivityLog.pet_id == pet_id, PetActivityLog.created_at >= since)
        .order_by(PetActivityLog.created_at.asc())
        .all()
    )

    if not logs:
        return {"pet_id": pet_id, "period_hours": hours, "total_records": 0,
                "distribution": {}, "dominant_state": None,
                "alert_inactive": False, "alert_active": False}

    valid  = [l.state for l in logs if l.state != "unknown"]
    counts = Counter(valid)
    total  = len(valid) or 1

    still  = counts.get("lying", 0) + counts.get("sitting", 0)
    moving = counts.get("moving", 0)

    return {
        "pet_id": pet_id,
        "period_hours": hours,
        "total_records": len(logs),
        "distribution": {s: round(c / total * 100) for s, c in counts.items()},
        "dominant_state": counts.most_common(1)[0][0] if counts else None,
        "alert_inactive": still / total >= 0.85 and moving == 0,
        "alert_active":   moving / total >= 0.75,
    }
