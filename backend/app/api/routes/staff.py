from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.api.deps import get_strict_admin
from app.models.models import Staff, User
from app.schemas.schemas import StaffCreate, StaffUpdate, StaffOut

router = APIRouter()


@router.get("/", response_model=List[StaffOut])
def get_staff(db: Session = Depends(get_db)):
    return db.query(Staff).filter(Staff.is_active == True).all()


@router.post("/", response_model=StaffOut, status_code=status.HTTP_201_CREATED)
def create_staff(data: StaffCreate, _: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    member = Staff(**data.model_dump())
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.put("/{staff_id}", response_model=StaffOut)
def update_staff(staff_id: int, data: StaffUpdate, _: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    member = db.query(Staff).filter(Staff.id == staff_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(member, field, value)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_staff(staff_id: int, _: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    member = db.query(Staff).filter(Staff.id == staff_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    db.delete(member)
    db.commit()
