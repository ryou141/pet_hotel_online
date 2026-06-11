from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


# ─── Auth ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    reset_token: str


class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class SendCodeRequest(BaseModel):
    email: EmailStr
    type: str  # register | reset


class VerifyRegisterRequest(BaseModel):
    email: EmailStr
    code: str
    password: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    phone: Optional[str] = None


class VerifyResetRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


# ─── User ────────────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None


class UserOut(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime
    pets_count: Optional[int] = 0

    class Config:
        from_attributes = True


# ─── Staff ───────────────────────────────────────────────────────────────────

class StaffBase(BaseModel):
    first_name: str
    last_name: str
    position: str
    photo_url: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True


class StaffCreate(StaffBase):
    pass


class StaffUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    position: Optional[str] = None
    photo_url: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class StaffOut(StaffBase):
    id: int

    class Config:
        from_attributes = True


# ─── Tariff ──────────────────────────────────────────────────────────────────

class TariffBase(BaseModel):
    name: str
    description: Optional[str] = None
    price_per_day: Decimal
    features: Optional[List[str]] = None
    is_active: bool = True
    sort_order: int = 0
    color: str = "#7A5230"
    is_featured: bool = False


class TariffCreate(TariffBase):
    pass


class TariffUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_per_day: Optional[Decimal] = None
    features: Optional[List[str]] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
    color: Optional[str] = None
    is_featured: Optional[bool] = None


class TariffOut(TariffBase):
    id: int

    class Config:
        from_attributes = True


# ─── Room ────────────────────────────────────────────────────────────────────

class RoomBase(BaseModel):
    number: str
    type: str
    capacity: int = 1
    tariff_id: Optional[int] = None
    description: Optional[str] = None
    is_available: bool = True
    features: Optional[List[str]] = None


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    number: Optional[str] = None
    type: Optional[str] = None
    capacity: Optional[int] = None
    tariff_id: Optional[int] = None
    description: Optional[str] = None
    is_available: Optional[bool] = None
    features: Optional[List[str]] = None


class RoomOut(RoomBase):
    id: int
    tariff: Optional[TariffOut] = None

    class Config:
        from_attributes = True


# ─── Camera ──────────────────────────────────────────────────────────────────

class CameraBase(BaseModel):
    name: str
    stream_url: str
    hls_url: Optional[str] = None
    room_id: Optional[int] = None
    zone_type: str = "room"
    is_active: bool = True


class CameraCreate(CameraBase):
    pass


class CameraUpdate(BaseModel):
    name: Optional[str] = None
    stream_url: Optional[str] = None
    hls_url: Optional[str] = None
    room_id: Optional[int] = None
    zone_type: Optional[str] = None
    is_active: Optional[bool] = None


class CameraOut(CameraBase):
    id: int

    class Config:
        from_attributes = True


# ─── Pet ─────────────────────────────────────────────────────────────────────

class PetBase(BaseModel):
    name: str
    species: str
    breed: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    extra_notes: Optional[str] = None


class PetCreate(PetBase):
    pass


class PetUpdate(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    breed: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    extra_notes: Optional[str] = None


class PetOut(PetBase):
    id: int
    owner_id: int
    owner_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Booking ─────────────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    pet_id: int
    room_id: int
    check_in_date: date
    check_out_date: date
    notes: Optional[str] = None


class BookingUpdate(BaseModel):
    room_id: Optional[int] = None
    check_in_date: Optional[date] = None
    check_out_date: Optional[date] = None
    notes: Optional[str] = None
    activity_level: Optional[int] = None


class BookingExtendRequest(BaseModel):
    extension_date: date


class OwnerBrief(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class BookingOut(BaseModel):
    id: int
    pet_id: int
    room_id: int
    owner_id: int
    check_in_date: date
    check_out_date: date
    status: str
    total_price: Optional[Decimal]
    notes: Optional[str]
    created_at: datetime
    extension_date: Optional[date] = None
    extension_status: Optional[str] = None
    activity_level: int = 1
    pet: Optional[PetOut] = None
    room: Optional[RoomOut] = None
    owner: Optional[OwnerBrief] = None

    class Config:
        from_attributes = True


# ─── Gallery ─────────────────────────────────────────────────────────────────

class GalleryBase(BaseModel):
    photo_url: str
    caption: Optional[str] = None
    is_active: bool = True


class GalleryCreate(GalleryBase):
    pass


class GalleryUpdate(BaseModel):
    photo_url: Optional[str] = None
    caption: Optional[str] = None
    is_active: Optional[bool] = None


class GalleryOut(GalleryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Staff Note ──────────────────────────────────────────────────────────────

class StaffNoteCreate(BaseModel):
    pet_id: int
    content: str
    is_public: bool = True


class StaffNoteUpdate(BaseModel):
    content: Optional[str] = None
    is_public: Optional[bool] = None


class StaffNoteOut(BaseModel):
    id: int
    pet_id: int
    staff_id: Optional[int]
    content: str
    is_public: bool
    created_at: datetime
    staff_member: Optional[StaffOut] = None

    class Config:
        from_attributes = True


# ─── Pet Activity Log ─────────────────────────────────────────────────────────

class PetActivityLogOut(BaseModel):
    id: int
    pet_id: int
    booking_id: Optional[int]
    state: str
    confidence: Optional[Decimal]
    created_at: datetime

    class Config:
        from_attributes = True
