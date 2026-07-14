from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
from typing import Optional

class UploadedImage(SQLModel, table=True):
    __tablename__ = "uploaded_images"

    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    user_id: int = Field(foreign_key="user.id", nullable=False)
    name: str = Field(max_length=255)
    image_url: str = Field(max_length=500)
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    