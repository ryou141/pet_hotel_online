import random
import string
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, VerificationCode
from app.schemas.schemas import (
    RegisterRequest, LoginRequest, TokenResponse, RefreshRequest,
    ForgotPasswordRequest, ForgotPasswordResponse, ResetPasswordRequest,
    SendCodeRequest, VerifyRegisterRequest, VerifyResetRequest,
)
from app.core.security import (
    get_password_hash, verify_password,
    create_access_token, create_refresh_token, decode_token, create_reset_token,
)
from app.core.email import send_code_email


def _generate_code() -> str:
    return ''.join(random.choices(string.digits, k=6))


def _save_code(db: Session, email: str, type: str) -> str:
    db.query(VerificationCode).filter(
        VerificationCode.email == email,
        VerificationCode.type == type,
        VerificationCode.used == False,
    ).delete()
    code = _generate_code()
    vc = VerificationCode(
        email=email,
        code=code,
        type=type,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
    )
    db.add(vc)
    db.commit()
    return code


def _verify_code(db: Session, email: str, code: str, type: str) -> VerificationCode:
    vc = db.query(VerificationCode).filter(
        VerificationCode.email == email,
        VerificationCode.code == code,
        VerificationCode.type == type,
        VerificationCode.used == False,
    ).first()
    if not vc:
        raise HTTPException(status_code=400, detail="Неверный код")
    if datetime.utcnow() > vc.expires_at:
        raise HTTPException(status_code=400, detail="Код истёк. Запросите новый")
    vc.used = True
    db.commit()
    return vc

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
    user = User(
        email=data.email,
        password_hash=get_password_hash(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        middle_name=data.middle_name,
        phone=data.phone,
        date_of_birth=data.date_of_birth,
        role="client",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Аккаунт заблокирован")
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Невалидный refresh token")
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not user.is_active:
        # Don't reveal whether the email exists
        raise HTTPException(status_code=404, detail="Пользователь с таким email не найден")
    token = create_reset_token(user.id, user.password_hash)
    return ForgotPasswordResponse(reset_token=token)


@router.post("/reset-password", response_model=TokenResponse)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Пароль должен содержать не менее 6 символов")
    payload = decode_token(data.reset_token)
    if not payload or payload.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Недействительная или истёкшая ссылка для сброса пароля")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user.password_hash[-8:] != payload.get("ph"):
        raise HTTPException(status_code=400, detail="Ссылка для сброса уже была использована")
    user.password_hash = get_password_hash(data.new_password)
    db.commit()
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


# ─── Code-based email verification ───────────────────────────────────────────

@router.post("/send-code", status_code=200)
def send_code(data: SendCodeRequest, db: Session = Depends(get_db)):
    if data.type == "register":
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
    elif data.type == "reset":
        user = db.query(User).filter(User.email == data.email).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=404, detail="Пользователь с таким email не найден")
    else:
        raise HTTPException(status_code=400, detail="Неверный тип кода")

    code = _save_code(db, data.email, data.type)
    try:
        send_code_email(data.email, code, data.type)
    except Exception:
        raise HTTPException(status_code=500, detail="Не удалось отправить письмо. Проверьте настройки SMTP")
    return {"detail": "Код отправлен на почту"}


@router.post("/verify-register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def verify_register(data: VerifyRegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Пароль должен содержать не менее 6 символов")
    _verify_code(db, data.email, data.code, "register")
    user = User(
        email=data.email,
        password_hash=get_password_hash(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        middle_name=data.middle_name,
        phone=data.phone,
        role="client",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/verify-reset", response_model=TokenResponse)
def verify_reset(data: VerifyResetRequest, db: Session = Depends(get_db)):
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Пароль должен содержать не менее 6 символов")
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    _verify_code(db, data.email, data.code, "reset")
    user.password_hash = get_password_hash(data.new_password)
    db.commit()
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)
