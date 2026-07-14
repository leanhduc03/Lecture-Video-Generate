from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session, select
from typing import List
from datetime import datetime
import cloudinary
import cloudinary.uploader
import uuid
import os

from app.db.session import get_session
from app.models.media_video import MediaVideo
from app.models.user import User
from app.schemas.media_video import (
    MediaVideoCreate, 
    MediaVideoUpdate, 
    MediaVideoResponse, 
    MediaVideoListResponse
)
from app.core.security import get_current_user

router = APIRouter()

# Cấu hình Cloudinary
cloudinary.config(
    cloud_name="diqes2eof",
    api_key="454186622222465",
    api_secret="0dnKpLhJ_cTaBJb4OQ5aFx8bgX0"
)

@router.post("/upload-video")
async def upload_media_video_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Upload video file lên Cloudinary
    """
    if not file:
        raise HTTPException(status_code=400, detail="Không có file nào được tải lên")
    
    if not file.content_type.startswith("video/"):
        raise HTTPException(
            status_code=400, 
            detail="Định dạng file không hợp lệ. Vui lòng tải lên file video."
        )
    
    try:
        unique_filename = f"media_video_{current_user.id}_{uuid.uuid4().hex}"
        
        temp_file_path = f"temp_{unique_filename}"
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        upload_result = cloudinary.uploader.upload(
            temp_file_path, 
            resource_type="video",
            folder="media_videos",
            public_id=unique_filename
        )
        
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            
        if 'secure_url' in upload_result:
            return {
                "success": True, 
                "video_url": upload_result['secure_url'],
                "public_id": upload_result.get('public_id'),
                "duration": upload_result.get('duration'),
                "format": upload_result.get('format')
            }
        else:
            raise HTTPException(status_code=500, detail="Không nhận được URL từ Cloudinary")
            
    except Exception as e:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Lỗi khi upload file: {str(e)}")

@router.get("/", response_model=MediaVideoListResponse)
async def get_media_videos(
    video_type: str = None,  # 'sample', 'uploaded', 'deepfake' hoặc None (lấy tất cả)
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách media videos
    - Nếu video_type='sample': lấy video sample của tất cả admin
    - Nếu video_type='uploaded': lấy video đã upload của user hiện tại
    - Nếu video_type='deepfake': lấy video deepfake của user hiện tại
    - Nếu video_type=None: lấy tất cả video của user hiện tại
    """
    statement = select(MediaVideo)
    
    if video_type == 'sample':
        # Lấy tất cả video sample (không phân biệt user)
        statement = statement.where(MediaVideo.video_type == 'sample')
    elif video_type == 'uploaded':
        # Chỉ lấy video uploaded của user hiện tại
        statement = statement.where(
            MediaVideo.video_type == 'uploaded',
            MediaVideo.user_id == current_user.id
        )
    elif video_type == 'deepfake':
        # Chỉ lấy video deepfake của user hiện tại
        statement = statement.where(
            MediaVideo.video_type == 'deepfake',
            MediaVideo.user_id == current_user.id
        )
    else:
        # Lấy tất cả video của user hiện tại
        statement = statement.where(MediaVideo.user_id == current_user.id)
    
    statement = statement.order_by(MediaVideo.created_at.desc())
    
    videos = session.exec(statement).all()
    
    return MediaVideoListResponse(
        videos=videos,
        total=len(videos)
    )

@router.get("/{video_id}", response_model=MediaVideoResponse)
async def get_media_video(
    video_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy thông tin chi tiết một media video
    """
    video = session.get(MediaVideo, video_id)
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video không tồn tại"
        )
    
    # Kiểm tra quyền truy cập
    if video.video_type in ['uploaded', 'deepfake'] and video.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập video này"
        )
    
    return video

@router.post("/", response_model=MediaVideoResponse, status_code=status.HTTP_201_CREATED)
async def create_media_video(
    video_data: MediaVideoCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Tạo media video mới
    - Admin có thể tạo video type 'sample'
    - User thường chỉ có thể tạo video type 'uploaded'
    """
    if video_data.video_type == 'sample' and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ admin mới có quyền tạo video mẫu"
        )
    
    video = MediaVideo(
        **video_data.model_dump(),
        user_id=current_user.id
    )
    
    session.add(video)
    session.commit()
    session.refresh(video)
    
    return video

@router.put("/{video_id}", response_model=MediaVideoResponse)
async def update_media_video(
    video_id: int,
    video_data: MediaVideoUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Cập nhật media video
    """
    video = session.get(MediaVideo, video_id)
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video không tồn tại"
        )
    
    # Kiểm tra quyền
    if video.video_type == 'sample' and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ admin mới có quyền cập nhật video mẫu"
        )
    
    if video.video_type in ['uploaded', 'deepfake'] and video.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền cập nhật video này"
        )
    
    update_data = video_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(video, field, value)
    
    video.updated_at = datetime.utcnow()
    
    session.add(video)
    session.commit()
    session.refresh(video)
    
    return video

@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_media_video(
    video_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Xóa media video
    """
    video = session.get(MediaVideo, video_id)
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video không tồn tại"
        )
    
    # Kiểm tra quyền
    if video.video_type == 'sample' and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ admin mới có quyền xóa video mẫu"
        )
    
    if video.video_type in ['uploaded', 'deepfake'] and video.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền xóa video này"
        )
    
    session.delete(video)
    session.commit()
    
    return None

@router.post("/save-deepfake", response_model=MediaVideoResponse, status_code=status.HTTP_201_CREATED)
async def save_deepfake_video(
    video_url: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Lưu video deepfake đã tạo thành công vào database
    """
    # Tạo tên tự động cho video deepfake
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    video_name = f"Faceswap_{current_user.username}_{timestamp}"
    
    video_data = MediaVideo(
        user_id=current_user.id,
        name=video_name,
        video_url=video_url,
        video_type='deepfake'
    )
    
    session.add(video_data)
    session.commit()
    session.refresh(video_data)
    
    return video_data