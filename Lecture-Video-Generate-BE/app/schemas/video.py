from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class VideoCreate(BaseModel):
    video_url: str
    username: str
    user_id: int  

class VideoResponse(BaseModel):
    id: int
    video_url: str
    username: str
    user_id: int  
    created_at: datetime
    
    class Config:
        from_attributes = True

class VideoListResponse(BaseModel):
    videos: list[VideoResponse]
    total: int