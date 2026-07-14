from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from app.db.session import get_session
from app.models.video import Video
from app.models.user import User
from app.schemas.video import VideoCreate, VideoResponse, VideoListResponse
from app.core.security import get_current_user

router = APIRouter()

@router.post("/", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
async def create_video(
    video_data: VideoCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Tạo bản ghi video mới. Chỉ user đã đăng nhập mới được tạo.
    """
    # Kiểm tra user_id khớp với user hiện tại (hoặc là admin)
    if video_data.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn chỉ có thể tạo video cho chính mình"
        )
    
    # Kiểm tra username có khớp với user_id không
    if video_data.username != current_user.username and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Username không khớp với user hiện tại"
        )
    
    video = Video(
        video_url=video_data.video_url,
        username=video_data.username,
        user_id=video_data.user_id  
    )
    
    session.add(video)
    session.commit()
    session.refresh(video)
    
    return video

@router.get("/my-videos", response_model=VideoListResponse)
async def get_my_videos(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Lấy danh sách video của user hiện tại
    """
    # Dùng user_id 
    statement = select(Video).where(Video.user_id == current_user.id).order_by(Video.created_at.desc())
    videos = session.exec(statement).all()
    
    return VideoListResponse(
        videos=videos,
        total=len(videos)
    )

@router.get("/all", response_model=VideoListResponse)
async def get_all_videos(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Lấy tất cả video (chỉ admin). User thường sẽ bị từ chối.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ admin mới có quyền xem tất cả video"
        )
    
    statement = select(Video).order_by(Video.created_at.desc())
    videos = session.exec(statement).all()
    
    return VideoListResponse(
        videos=videos,
        total=len(videos)
    )

@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_video(
    video_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Xóa video. User chỉ xóa được video của mình, admin xóa được tất cả.
    """
    video = session.get(Video, video_id)
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video không tồn tại"
        )
    
    # Kiểm tra quyền bằng user_id
    if video.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền xóa video này"
        )
    
    session.delete(video)
    session.commit()
    
    return None
