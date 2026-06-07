from sqlalchemy import (
    Column, Integer, String, Boolean, Text, Date, DateTime,
    ForeignKey, Numeric, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    middle_name = Column(String(100))
    phone = Column(String(30))
    date_of_birth = Column(Date)
    role = Column(String(20), default="client")  # client | admin | staff
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    pets = relationship("Pet", back_populates="owner", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="owner")


class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    position = Column(String(100), nullable=False)
    photo_url = Column(Text)
    description = Column(Text)
    is_active = Column(Boolean, default=True)

    notes = relationship("StaffNote", back_populates="staff_member")


class Tariff(Base):
    __tablename__ = "tariffs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price_per_day = Column(Numeric(10, 2), nullable=False)
    features = Column(JSON)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    color = Column(String(20), default="#7A5230")
    is_featured = Column(Boolean, default=False)

    rooms = relationship("Room", back_populates="tariff")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String(20), unique=True, nullable=False)
    type = Column(String(50), nullable=False)  # standard | comfort | vip
    capacity = Column(Integer, default=1)
    tariff_id = Column(Integer, ForeignKey("tariffs.id"), nullable=True)
    description = Column(Text)
    is_available = Column(Boolean, default=True)
    features = Column(JSON)

    tariff = relationship("Tariff", back_populates="rooms")
    camera = relationship("Camera", back_populates="room", uselist=False)
    bookings = relationship("Booking", back_populates="room")


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    stream_url = Column(String(500), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    zone_type = Column(String(20), default="room")  # room | public
    is_active = Column(Boolean, default=True)

    room = relationship("Room", back_populates="camera")


class Pet(Base):
    __tablename__ = "pets"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    species = Column(String(50), nullable=False)  # dog | cat | rabbit | bird | other
    breed = Column(String(100))
    age = Column(Integer)
    gender = Column(String(10))  # male | female
    extra_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="pets")
    bookings = relationship("Booking", back_populates="pet", cascade="all, delete-orphan")
    staff_notes = relationship("StaffNote", back_populates="pet", cascade="all, delete-orphan")
    activity_logs = relationship("PetActivityLog", back_populates="pet", cascade="all, delete-orphan")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)
    status = Column(String(20), default="pending")  # pending | confirmed | active | completed | cancelled
    total_price = Column(Numeric(10, 2))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    extension_date = Column(Date, nullable=True)
    extension_status = Column(String(20), nullable=True)  # pending | approved | rejected

    pet = relationship("Pet", back_populates="bookings")
    room = relationship("Room", back_populates="bookings")
    owner = relationship("User", back_populates="bookings")


class Gallery(Base):
    __tablename__ = "gallery"

    id = Column(Integer, primary_key=True, index=True)
    photo_url = Column(Text, nullable=False)
    caption = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class StaffNote(Base):
    __tablename__ = "staff_notes"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    content = Column(Text, nullable=False)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    pet = relationship("Pet", back_populates="staff_notes")
    staff_member = relationship("Staff", back_populates="notes")


class VerificationCode(Base):
    __tablename__ = "verification_codes"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(6), nullable=False)
    type = Column(String(20), nullable=False)  # register | reset
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PetActivityLog(Base):
    __tablename__ = "pet_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    state = Column(String(20), nullable=False)  # lying | sitting | standing | moving | unknown
    confidence = Column(Numeric(4, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    pet = relationship("Pet", back_populates="activity_logs")
