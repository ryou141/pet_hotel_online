from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.api.deps import get_current_user, get_strict_admin
from app.models.models import Room, User
from app.schemas.schemas import RoomCreate, RoomUpdate, RoomOut

router = APIRouter()


def _room_query(db):
    return db.query(Room).options(joinedload(Room.tariff))


@router.get("/", response_model=List[RoomOut])
def get_rooms(db: Session = Depends(get_db)):
    return _room_query(db).all()


@router.get("/{room_id}", response_model=RoomOut)
def get_room(room_id: int, db: Session = Depends(get_db)):
    room = _room_query(db).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    return room


@router.post("/", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
def create_room(data: RoomCreate, _: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    if db.query(Room).filter(Room.number == data.number).first():
        raise HTTPException(status_code=400, detail="Комната с таким номером уже существует")
    room = Room(**data.model_dump())
    db.add(room)
    db.commit()
    return _room_query(db).filter(Room.id == room.id).first()


@router.put("/{room_id}", response_model=RoomOut)
def update_room(room_id: int, data: RoomUpdate, _: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(room, field, value)
    db.commit()
    return _room_query(db).filter(Room.id == room_id).first()


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(room_id: int, _: User = Depends(get_strict_admin), db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    db.delete(room)
    db.commit()
