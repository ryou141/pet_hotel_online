from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.api.deps import get_strict_admin
from app.models.models import Gallery, User
from app.schemas.schemas import GalleryCreate, GalleryUpdate, GalleryOut

router = APIRouter()


@router.get("/", response_model=List[GalleryOut])
def get_gallery(db: Session = Depends(get_db)):
    return db.query(Gallery).filter(Gallery.is_active == True).order_by(Gallery.id).all()


@router.post("/", response_model=GalleryOut, status_code=status.HTTP_201_CREATED)
def create_photo(data: GalleryCreate, _: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    photo = Gallery(**data.model_dump())
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


@router.put("/{photo_id}", response_model=GalleryOut)
def update_photo(photo_id: int, data: GalleryUpdate, _: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    photo = db.query(Gallery).filter(Gallery.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Фото не найдено")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(photo, field, value)
    db.commit()
    db.refresh(photo)
    return photo


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo(photo_id: int, _: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    photo = db.query(Gallery).filter(Gallery.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Фото не найдено")
    db.delete(photo)
    db.commit()
