from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import UserOut, UserUpdate, ChangePasswordRequest
from app.core.security import verify_password, get_password_hash

router = APIRouter()


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pets_count = len(current_user.pets)
    result = UserOut.model_validate(current_user)
    result.pets_count = pets_count
    return result


@router.put("/me", response_model=UserOut)
def update_me(data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    result = UserOut.model_validate(current_user)
    result.pets_count = len(current_user.pets)
    return result


@router.post("/me/change-password")
def change_password(data: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Новый пароль должен содержать не менее 6 символов")
    current_user.password_hash = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Пароль успешно изменён"}
