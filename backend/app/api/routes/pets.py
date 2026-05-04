from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.api.deps import get_current_user
from app.models.models import Pet, User
from app.schemas.schemas import PetCreate, PetUpdate, PetOut

router = APIRouter()


@router.get("/", response_model=List[PetOut])
def get_my_pets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Pet).filter(Pet.owner_id == current_user.id).all()


@router.post("/", response_model=PetOut, status_code=status.HTTP_201_CREATED)
def create_pet(data: PetCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pet = Pet(**data.model_dump(), owner_id=current_user.id)
    db.add(pet)
    db.commit()
    db.refresh(pet)
    return pet


@router.get("/{pet_id}", response_model=PetOut)
def get_pet(pet_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pet = db.query(Pet).filter(Pet.id == pet_id, Pet.owner_id == current_user.id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец не найден")
    return pet


@router.put("/{pet_id}", response_model=PetOut)
def update_pet(pet_id: int, data: PetUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pet = db.query(Pet).filter(Pet.id == pet_id, Pet.owner_id == current_user.id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец не найден")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(pet, field, value)
    db.commit()
    db.refresh(pet)
    return pet


@router.delete("/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pet(pet_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pet = db.query(Pet).filter(Pet.id == pet_id, Pet.owner_id == current_user.id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец не найден")
    db.delete(pet)
    db.commit()
