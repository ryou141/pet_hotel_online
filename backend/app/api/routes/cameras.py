from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.api.deps import get_current_user, get_strict_admin
from app.models.models import Camera, Booking, User
from app.schemas.schemas import CameraCreate, CameraUpdate, CameraOut

router = APIRouter()


@router.get("/public", response_model=List[CameraOut])
def get_public_cameras(db: Session = Depends(get_db)):
    return db.query(Camera).filter(Camera.zone_type == "public", Camera.is_active == True).all()


@router.get("/pet/{pet_id}", response_model=Optional[CameraOut])
def get_pet_camera(pet_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = (
        db.query(Booking)
        .filter(Booking.pet_id == pet_id, Booking.owner_id == current_user.id, Booking.status == "active")
        .first()
    )
    if not booking:
        return None
    camera = db.query(Camera).filter(Camera.room_id == booking.room_id, Camera.is_active == True).first()
    return camera


@router.get("/", response_model=List[CameraOut])
def get_all_cameras(_: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    return db.query(Camera).all()


@router.post("/", response_model=CameraOut, status_code=status.HTTP_201_CREATED)
def create_camera(data: CameraCreate, _: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    payload = data.model_dump()
    # 0 is not a valid room_id — treat it as NULL
    if not payload.get("room_id"):
        payload["room_id"] = None
    camera = Camera(**payload)
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return camera


@router.put("/{camera_id}", response_model=CameraOut)
def update_camera(camera_id: int, data: CameraUpdate, _: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Камера не найдена")
    for field, value in data.model_dump(exclude_unset=True).items():
        if field == "room_id" and not value:
            value = None
        setattr(camera, field, value)
    db.commit()
    db.refresh(camera)
    return camera


@router.delete("/{camera_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_camera(camera_id: int, _: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Камера не найдена")
    db.delete(camera)
    db.commit()
