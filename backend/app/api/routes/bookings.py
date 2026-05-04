from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from decimal import Decimal
from app.database import get_db
from app.api.deps import get_current_user, get_current_admin
from app.models.models import Booking, Room, Pet, User
from app.schemas.schemas import BookingCreate, BookingUpdate, BookingOut

router = APIRouter()


@router.get("/", response_model=List[BookingOut])
def get_my_bookings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Booking)
        .options(joinedload(Booking.pet), joinedload(Booking.room))
        .filter(Booking.owner_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )


@router.post("/", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(data: BookingCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pet = db.query(Pet).filter(Pet.id == data.pet_id, Pet.owner_id == current_user.id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец не найден")
    room = db.query(Room).filter(Room.id == data.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    if data.check_in_date >= data.check_out_date:
        raise HTTPException(status_code=400, detail="Дата выезда должна быть позже даты заезда")
    days = (data.check_out_date - data.check_in_date).days
    total_price = Decimal(str(room.price_per_day)) * days
    booking = Booking(
        pet_id=data.pet_id,
        room_id=data.room_id,
        owner_id=current_user.id,
        check_in_date=data.check_in_date,
        check_out_date=data.check_out_date,
        notes=data.notes,
        total_price=total_price,
        status="pending",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return db.query(Booking).options(joinedload(Booking.pet), joinedload(Booking.room)).filter(Booking.id == booking.id).first()


@router.put("/{booking_id}", response_model=BookingOut)
def update_booking(booking_id: int, data: BookingUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    if current_user.role == "client" and booking.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(booking, field, value)
    db.commit()
    db.refresh(booking)
    return db.query(Booking).options(joinedload(Booking.pet), joinedload(Booking.room)).filter(Booking.id == booking.id).first()


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_booking(booking_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    if current_user.role == "client" and booking.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    booking.status = "cancelled"
    db.commit()
