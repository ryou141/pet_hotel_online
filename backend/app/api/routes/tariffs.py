from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.api.deps import get_strict_admin
from app.models.models import Tariff, User
from app.schemas.schemas import TariffCreate, TariffUpdate, TariffOut

router = APIRouter()


@router.get("/", response_model=List[TariffOut])
def get_tariffs(db: Session = Depends(get_db)):
    return db.query(Tariff).filter(Tariff.is_active == True).order_by(Tariff.sort_order).all()


@router.post("/", response_model=TariffOut, status_code=status.HTTP_201_CREATED)
def create_tariff(data: TariffCreate, _: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    tariff = Tariff(**data.model_dump())
    db.add(tariff)
    db.commit()
    db.refresh(tariff)
    return tariff


@router.put("/{tariff_id}", response_model=TariffOut)
def update_tariff(tariff_id: int, data: TariffUpdate, _: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    tariff = db.query(Tariff).filter(Tariff.id == tariff_id).first()
    if not tariff:
        raise HTTPException(status_code=404, detail="Тариф не найден")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tariff, field, value)
    db.commit()
    db.refresh(tariff)
    return tariff


@router.delete("/{tariff_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tariff(tariff_id: int, _: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    tariff = db.query(Tariff).filter(Tariff.id == tariff_id).first()
    if not tariff:
        raise HTTPException(status_code=404, detail="Тариф не найден")
    db.delete(tariff)
    db.commit()
