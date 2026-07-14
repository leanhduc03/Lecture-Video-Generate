from sqlmodel import SQLModel, Field
from typing import Optional
from enum import Enum as PyEnum
from datetime import datetime


class UserRole(str, PyEnum):
    ADMIN = "admin"
    USER = "user"


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    role: UserRole = Field(default=UserRole.USER)
    is_active: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
