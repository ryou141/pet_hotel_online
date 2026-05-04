from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.api.deps import get_current_user, get_current_admin
from app.models.models import StaffNote, Pet, User
from app.schemas.schemas import StaffNoteCreate, StaffNoteUpdate, StaffNoteOut

router = APIRouter()


@router.get("/pet/{pet_id}", response_model=List[StaffNoteOut])
def get_pet_notes(pet_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "client":
        pet = db.query(Pet).filter(Pet.id == pet_id, Pet.owner_id == current_user.id).first()
        if not pet:
            raise HTTPException(status_code=404, detail="Питомец не найден")
        return (
            db.query(StaffNote)
            .options(joinedload(StaffNote.staff_member))
            .filter(StaffNote.pet_id == pet_id, StaffNote.is_public == True)
            .order_by(StaffNote.created_at.desc())
            .all()
        )
    return (
        db.query(StaffNote)
        .options(joinedload(StaffNote.staff_member))
        .filter(StaffNote.pet_id == pet_id)
        .order_by(StaffNote.created_at.desc())
        .all()
    )


@router.post("/", response_model=StaffNoteOut, status_code=status.HTTP_201_CREATED)
def create_note(data: StaffNoteCreate, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    from app.models.models import Staff
    staff = db.query(Staff).filter(Staff.user_id == current_user.id).first()
    note = StaffNote(
        pet_id=data.pet_id,
        staff_id=staff.id if staff else None,
        content=data.content,
        is_public=data.is_public,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return db.query(StaffNote).options(joinedload(StaffNote.staff_member)).filter(StaffNote.id == note.id).first()


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: int, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    note = db.query(StaffNote).filter(StaffNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Заметка не найдена")
    db.delete(note)
    db.commit()
