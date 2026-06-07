import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine
from app.models.models import Base
from app.api.routes import auth, users, pets, rooms, bookings, staff, cameras, gallery, tariffs, notes, admin, activity
from app.cv.detector import router as cv_router
from app.cv.auto_notes import cv_auto_notes_loop
from app.cv.daily_report import daily_report_loop
from app.cv.activity_monitor import activity_monitor_loop
from app.core.security import get_password_hash
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.models import User
from app.config import settings


def create_initial_admin():
    db: Session = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == settings.FIRST_ADMIN_EMAIL).first()
        if not existing:
            admin_user = User(
                email=settings.FIRST_ADMIN_EMAIL,
                password_hash=get_password_hash(settings.FIRST_ADMIN_PASSWORD),
                first_name="Администратор",
                last_name="Системы",
                role="admin",
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    create_initial_admin()
    asyncio.create_task(cv_auto_notes_loop(interval_minutes=30))
    asyncio.create_task(daily_report_loop(hour=20))
    asyncio.create_task(activity_monitor_loop(interval_seconds=10))
    yield


app = FastAPI(
    title="PawHotel API",
    description="Backend API для отеля домашних животных «Уютные лапки»",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Авторизация"])
app.include_router(users.router, prefix="/api/users", tags=["Пользователи"])
app.include_router(pets.router, prefix="/api/pets", tags=["Питомцы"])
app.include_router(rooms.router, prefix="/api/rooms", tags=["Комнаты"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Бронирования"])
app.include_router(staff.router, prefix="/api/staff", tags=["Персонал"])
app.include_router(cameras.router, prefix="/api/cameras", tags=["Камеры"])
app.include_router(gallery.router, prefix="/api/gallery", tags=["Галерея"])
app.include_router(tariffs.router, prefix="/api/tariffs", tags=["Тарифы"])
app.include_router(notes.router, prefix="/api/notes", tags=["Заметки"])
app.include_router(admin.router, prefix="/api/admin", tags=["Админ"])
app.include_router(activity.router, prefix="/api/activity", tags=["Активность"])


app.include_router(cv_router, tags=["CV Детекция"])


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "PawHotel API"}
