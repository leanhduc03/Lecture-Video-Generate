from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Video(SQLModel, table=True):
    __tablename__ = "lecture_videos"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    video_url: str = Field(index=True)
    username: str = Field(index=True)
    user_id: int = Field(index=True)  
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "video_url": "http://localhost:8000/static/outputs/final_video.mp4",
                "username": "user123",
                "user_id": 1
            }
        }