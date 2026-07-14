from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import Any, List

from ...core.security import get_current_admin_user, get_current_active_user
from ...db.session import get_session
from ...models.user import User, UserRole
from ...schemas.user import UserRead, UserUpdate, UserListResponse
from ...services.auth import hash_password

router = APIRouter()


@router.get("/me", response_model=UserRead)
def read_user_me(current_user: User = Depends(get_current_active_user)) -> Any:
    """
    Lấy thông tin người dùng hiện tại.
    """
    return current_user


@router.put("/me", response_model=UserRead)
def update_user_me(
    user_in: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Cập nhật thông tin người dùng hiện tại.
    """
    if user_in.password is not None:
        current_user.hashed_password = hash_password(user_in.password)
    if user_in.email is not None:
        current_user.email = user_in.email
    
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


@router.get("", response_model=UserListResponse)
def list_users(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    Lấy danh sách người dùng (chỉ admin).
    """
    users = session.exec(select(User).offset(skip).limit(limit)).all()
    total = session.exec(select(User)).all()
    return {"items": users, "total": len(total)}


@router.get("/{user_id}", response_model=UserRead)
def read_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    Lấy thông tin người dùng theo ID (chỉ admin).
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Người dùng không tồn tại"
        )
    return user


@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    Cập nhật thông tin người dùng (chỉ admin).
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Người dùng không tồn tại"
        )
    
    user_data = user_in.dict(exclude_unset=True)
    if "password" in user_data and user_data["password"]:
        user_data["hashed_password"] = hash_password(user_data.pop("password"))
    
    for key, value in user_data.items():
        setattr(user, key, value)
    
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.delete("/{user_id}", response_model=dict)
def delete_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    Xóa người dùng (chỉ admin).
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Người dùng không tồn tại"
        )
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa tài khoản của chính mình"
        )
    
    session.delete(user)
    session.commit()
    return {"message": "Người dùng đã được xóa thành công"}
