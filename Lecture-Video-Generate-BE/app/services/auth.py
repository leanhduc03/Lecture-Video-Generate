from passlib.context import CryptContext
import random
import string
from datetime import datetime, timedelta
from sqlmodel import Session, select
from typing import Optional

from ..core.config import settings
from ..models.user import User
from ..models.verification import VerificationCode

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def generate_verification_code(length: int = 6) -> str:
    """Generate a random verification code."""
    return ''.join(random.choices(string.digits, k=length))


def create_verification_code(
    session: Session,
    user_id: int,
    purpose: str,
    expires_minutes: Optional[int] = None
) -> str:
    """Create a verification code record and return the code."""
    if expires_minutes is None:
        expires_minutes = settings.VERIFICATION_CODE_EXPIRE_MINUTES
    
    # Delete any existing codes for this user and purpose
    existing_codes = session.exec(
        select(VerificationCode)
        .where(VerificationCode.user_id == user_id)
        .where(VerificationCode.purpose == purpose)
    ).all()
    for code in existing_codes:
        session.delete(code)
    
    # Create new code
    code = generate_verification_code()
    expires_at = datetime.utcnow() + timedelta(minutes=expires_minutes)
    
    verification_code = VerificationCode(
        user_id=user_id,
        code=code,
        purpose=purpose,
        expires_at=expires_at
    )
    
    session.add(verification_code)
    session.commit()
    
    return code


def verify_code(
    session: Session,
    user_id: int,
    code: str,
    purpose: str
) -> bool:
    """Verify a code for a user and purpose."""
    verification = session.exec(
        select(VerificationCode)
        .where(VerificationCode.user_id == user_id)
        .where(VerificationCode.code == code)
        .where(VerificationCode.purpose == purpose)
    ).first()
    
    if not verification:
        return False
    
    # Check if code has expired
    if verification.expires_at < datetime.utcnow():
        session.delete(verification)
        session.commit()
        return False
    
    # Code is valid, delete it to prevent reuse
    session.delete(verification)
    session.commit()
    
    return True


def get_user_by_email(session: Session, email: str) -> Optional[User]:
    """Get a user by email."""
    return session.exec(select(User).where(User.email == email)).first()


def get_user_by_username(session: Session, username: str) -> Optional[User]:
    """Get a user by username."""
    return session.exec(select(User).where(User.username == username)).first()
