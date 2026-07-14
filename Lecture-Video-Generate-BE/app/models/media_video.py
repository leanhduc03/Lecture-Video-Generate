from sqlmodel import Field, SQLModel
from datetime import datetime
from typing import Optional

class MediaVideo(SQLModel, table=True):
    __tablename__ = "media_videos"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", nullable=False)
    name: str = Field(max_length=255, index=True)
    video_url: str = Field(max_length=500)
    video_type: str = Field(max_length=50)  # 'sample' hoặc 'uploaded'
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)