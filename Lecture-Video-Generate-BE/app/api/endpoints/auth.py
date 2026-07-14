from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import Any

from ...core.config import settings
from ...core.security import create_access_token, get_current_active_user
from ...db.session import get_session
from ...models.user import User, UserRole
from ...schemas.user import (
    UserCreate,
    UserLogin,
    Token,
    VerifyEmail,
    RequestPasswordReset,
    ResetPassword,
)
from ...services.auth import (
    hash_password,
    verify_password,
    create_verification_code,
    verify_code,
    get_user_by_email,
    get_user_by_username,
)
from ...services.email import (
    send_verification_email,
    send_password_reset_email,
)

router = APIRouter()


@router.post("/register", response_model=dict)
def register(user_in: UserCreate, session: Session = Depends(get_session)) -> Any:
    """
    Đăng ký tài khoản mới.
    """
    # Kiểm tra username đã tồn tại chưa
    user = get_user_by_username(session, user_in.username)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên đăng nhập đã tồn tại",
        )
    
    # Kiểm tra email đã tồn tại chưa
    user = get_user_by_email(session, user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email đã được sử dụng",
        )
    
    # Tạo tài khoản mới - tự động kích hoạt, không cần xác thực email
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        is_active=True,
        role=UserRole.USER,
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    
    return {"message": "Đăng ký thành công. Bạn có thể đăng nhập."}


@router.post("/verify-email", response_model=dict)
def verify_email(data: VerifyEmail, session: Session = Depends(get_session)) -> Any:
    """
    Xác thực email người dùng.
    """
    user = get_user_by_username(session, data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Người dùng không tồn tại",
        )
    
    if user.is_active:
        return {"message": "Tài khoản đã được kích hoạt trước đó"}
    
    if verify_code(session, user.id, data.code, "email_verification"):
        user.is_active = True
        session.add(user)
        session.commit()
        return {"message": "Xác thực email thành công"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã xác thực không hợp lệ hoặc đã hết hạn",
        )


@router.post("/login", response_model=Token)
def login(data: UserLogin, session: Session = Depends(get_session)) -> Any:
    """
    Đăng nhập và lấy token.
    """
    user = get_user_by_username(session, data.username)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không đúng",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role
    }


@router.post("/request-password-reset", response_model=dict)
def request_password_reset(data: RequestPasswordReset, session: Session = Depends(get_session)) -> Any:
    """
    Yêu cầu đặt lại mật khẩu.
    """
    user = get_user_by_email(session, data.email)
    if not user:
        # Không tiết lộ liệu email có tồn tại hay không
        return {"message": "Nếu email tồn tại, mã đặt lại mật khẩu sẽ được gửi"}
    
    # Tạo mã xác thực và gửi email
    reset_code = create_verification_code(
        session=session,
        user_id=user.id,
        purpose="password_reset"
    )
    
    # Gửi email đặt lại mật khẩu và kiểm tra kết quả
    email_sent = send_password_reset_email(user.email, user.username, reset_code)
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Không thể gửi email. Hệ thống đang bị giới hạn gửi email. Vui lòng thử lại sau ít phút.",
        )
    
    return {"message": "Nếu email tồn tại, mã đặt lại mật khẩu sẽ được gửi"}


@router.post("/reset-password", response_model=dict)
def reset_password(data: ResetPassword, session: Session = Depends(get_session)) -> Any:
    """
    Đặt lại mật khẩu với mã xác thực.
    """
    user = get_user_by_email(session, data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email không tồn tại",
        )
    
    if verify_code(session, user.id, data.code, "password_reset"):
        user.hashed_password = hash_password(data.new_password)
        session.add(user)
        session.commit()
        return {"message": "Đặt lại mật khẩu thành công"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã xác thực không hợp lệ hoặc đã hết hạn",
        )


@router.post("/refresh-verification", response_model=dict)
def refresh_verification_code(data: RequestPasswordReset, session: Session = Depends(get_session)) -> Any:
    """
    Yêu cầu gửi lại mã xác thực email.
    """
    user = get_user_by_email(session, data.email)
    if not user:
        # Không tiết lộ liệu email có tồn tại hay không
        return {"message": "Nếu email tồn tại, mã xác thực mới sẽ được gửi"}
    
    if user.is_active:
        return {"message": "Tài khoản đã được kích hoạt"}
    
    # Tạo mã xác thực mới và gửi email
    verification_code = create_verification_code(
        session=session,
        user_id=user.id,
        purpose="email_verification"
    )
    
    # Gửi email xác thực và kiểm tra kết quả
    email_sent = send_verification_email(user.email, user.username, verification_code)
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Không thể gửi email. Hệ thống đang bị giới hạn gửi email. Vui lòng thử lại sau ít phút.",
        )
    
    return {"message": "Mã xác thực mới đã được gửi đến email của bạn"}
