from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from decimal import Decimal
from app.database import get_db
from app.api.deps import get_current_user
from app.models.models import Booking, Room, Pet, User
from app.schemas.schemas import BookingCreate, BookingUpdate, BookingOut, BookingExtendRequest

router = APIRouter()

ACTIVE_STATUSES = ("pending", "confirmed", "active")


def _with_relations(db: Session, booking_id: int):
    return (
        db.query(Booking)
        .options(joinedload(Booking.pet), joinedload(Booking.room))
        .filter(Booking.id == booking_id)
        .first()
    )


def _calc_price(room: Room, check_in, check_out) -> Decimal:
    days = (check_out - check_in).days
    price_per_day = room.tariff.price_per_day if room.tariff else Decimal("0")
    return Decimal(str(price_per_day)) * days


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

    existing = (
        db.query(Booking)
        .filter(Booking.pet_id == data.pet_id, Booking.status.in_(ACTIVE_STATUSES))
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="У этого питомца уже есть активное бронирование. Дождитесь его завершения или отмены.",
        )

    room = db.query(Room).options(joinedload(Room.tariff)).filter(Room.id == data.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    if data.check_in_date >= data.check_out_date:
        raise HTTPException(status_code=400, detail="Дата выезда должна быть позже даты заезда")

    booking = Booking(
        pet_id=data.pet_id,
        room_id=data.room_id,
        owner_id=current_user.id,
        check_in_date=data.check_in_date,
        check_out_date=data.check_out_date,
        notes=data.notes,
        total_price=_calc_price(room, data.check_in_date, data.check_out_date),
        status="pending",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return _with_relations(db, booking.id)


@router.put("/{booking_id}", response_model=BookingOut)
def update_booking(booking_id: int, data: BookingUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.owner_id == current_user.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    if booking.status != "pending":
        raise HTTPException(status_code=400, detail="Редактировать можно только бронирования в статусе «Ожидает»")

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(booking, field, value)

    # recalculate price if dates or room changed
    if "check_in_date" in updates or "check_out_date" in updates or "room_id" in updates:
        room = db.query(Room).options(joinedload(Room.tariff)).filter(Room.id == booking.room_id).first()
        if room:
            booking.total_price = _calc_price(room, booking.check_in_date, booking.check_out_date)

    db.commit()
    return _with_relations(db, booking.id)


@router.post("/{booking_id}/extend", response_model=BookingOut)
def request_extension(booking_id: int, data: BookingExtendRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.owner_id == current_user.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    if booking.status != "active":
        raise HTTPException(status_code=400, detail="Продлить можно только активное бронирование")
    if data.extension_date <= booking.check_out_date:
        raise HTTPException(status_code=400, detail="Дата продления должна быть позже текущей даты выезда")
    if booking.extension_status == "pending":
        raise HTTPException(status_code=400, detail="Заявка на продление уже отправлена")

    booking.extension_date = data.extension_date
    booking.extension_status = "pending"
    db.commit()
    return _with_relations(db, booking.id)


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_booking(booking_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.owner_id == current_user.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    booking.status = "cancelled"
    db.commit()
