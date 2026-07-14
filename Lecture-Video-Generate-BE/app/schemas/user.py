from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

from ..models.user import UserRole


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserRead(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserListResponse(BaseModel):
    items: List[UserRead]
    total: int


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole


class VerifyEmail(BaseModel):
    username: str
    code: str


class RequestPasswordReset(BaseModel):
    email: EmailStr


class ResetPassword(BaseModel):
    email: EmailStr
    code: str
    new_password: str
