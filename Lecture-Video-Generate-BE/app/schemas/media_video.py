from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MediaVideoBase(BaseModel):
    name: str
    video_url: str
    video_type: str  # 'sample' hoặc 'uploaded'

class MediaVideoCreate(MediaVideoBase):
    pass

class MediaVideoUpdate(BaseModel):
    name: Optional[str] = None
    video_url: Optional[str] = None

class MediaVideoResponse(MediaVideoBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class MediaVideoListResponse(BaseModel):
    videos: list[MediaVideoResponse]
    total: int