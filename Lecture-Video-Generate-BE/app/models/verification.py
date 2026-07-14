from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class VerificationCode(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    code: str = Field(index=True)
    purpose: str  # "email_verification" or "password_reset"
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
