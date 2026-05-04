from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app.api.deps import get_strict_admin, get_current_admin
from app.models.models import User, Pet, Booking, Room, Camera, Staff, Gallery, StaffNote, Tariff
from app.schemas.schemas import UserOut, PetOut, BookingOut, RoomOut, GalleryCreate, GalleryOut, StaffNoteOut

router = APIRouter()


# ─── Dashboard ───────────────────────────────────────────────────────────────

@router.get("/dashboard")
def get_dashboard(_: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    return {
        "total_users": db.query(User).filter(User.role == "client").count(),
        "total_pets": db.query(Pet).count(),
        "total_bookings": db.query(Booking).count(),
        "active_bookings": db.query(Booking).filter(Booking.status == "active").count(),
        "pending_bookings": db.query(Booking).filter(Booking.status == "pending").count(),
        "total_rooms": db.query(Room).count(),
        "available_rooms": db.query(Room).filter(Room.is_available == True).count(),
        "total_staff": db.query(Staff).filter(Staff.is_active == True).count(),
    }


# ─── Users ───────────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserOut])
def get_all_users(
    search: Optional[str] = Query(None),
    _: User = Depends(get_strict_admin),
    db: Session = Depends(get_db),
):
    q = db.query(User)
    if search:
        like = f"%{search}%"
        q = q.filter(
            User.email.ilike(like) | User.first_name.ilike(like) | User.last_name.ilike(like)
        )
    users = q.order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        out = UserOut.model_validate(u)
        out.pets_count = len(u.pets)
        result.append(out)
    return result


@router.put("/users/{user_id}/role")
def change_user_role(user_id: int, role: str, _: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if role not in ("client", "admin", "staff"):
        raise HTTPException(status_code=400, detail="Недопустимая роль")
    user.role = role
    db.commit()
    return {"ok": True}


@router.put("/users/{user_id}/toggle")
def toggle_user(user_id: int, _: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user.is_active = not user.is_active
    db.commit()
    return {"is_active": user.is_active}


# ─── Pets (admin) ────────────────────────────────────────────────────────────

@router.get("/pets")
def get_all_pets(
    search: Optional[str] = Query(None),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    q = db.query(Pet).options(joinedload(Pet.owner))
    if search:
        like = f"%{search}%"
        q = q.filter(Pet.name.ilike(like) | Pet.species.ilike(like) | Pet.breed.ilike(like))
    pets = q.order_by(Pet.created_at.desc()).all()
    result = []
    for p in pets:
        out = PetOut.model_validate(p)
        if p.owner:
            out.owner_name = f"{p.owner.last_name} {p.owner.first_name}"
        result.append(out)
    return result


# ─── Bookings (admin) ────────────────────────────────────────────────────────

@router.get("/bookings", response_model=List[BookingOut])
def get_all_bookings(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    q = db.query(Booking).options(
        joinedload(Booking.pet),
        joinedload(Booking.room),
        joinedload(Booking.owner),
    )
    if status:
        q = q.filter(Booking.status == status)
    return q.order_by(Booking.created_at.desc()).all()


@router.put("/bookings/{booking_id}/status")
def update_booking_status(
    booking_id: int,
    status: str,
    _: User = Depends(get_strict_admin),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    valid = ("pending", "confirmed", "active", "completed", "cancelled")
    if status not in valid:
        raise HTTPException(status_code=400, detail="Недопустимый статус")
    booking.status = status
    if status == "active":
        room = db.query(Room).filter(Room.id == booking.room_id).first()
        if room:
            room.is_available = False
    elif status in ("completed", "cancelled"):
        room = db.query(Room).filter(Room.id == booking.room_id).first()
        if room:
            room.is_available = True
    db.commit()
    return {"ok": True}


# ─── Gallery (admin) ─────────────────────────────────────────────────────────

@router.post("/gallery", response_model=GalleryOut)
def admin_add_gallery(data: GalleryCreate, _: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    from app.models.models import Gallery as GalleryModel
    photo = GalleryModel(**data.model_dump())
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


# ─── Notes (admin) ───────────────────────────────────────────────────────────

@router.get("/notes", response_model=List[StaffNoteOut])
def get_all_notes(
    pet_id: Optional[int] = Query(None),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    q = db.query(StaffNote).options(joinedload(StaffNote.staff_member))
    if pet_id:
        q = q.filter(StaffNote.pet_id == pet_id)
    return q.order_by(StaffNote.created_at.desc()).all()
