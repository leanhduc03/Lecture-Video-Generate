from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UploadedImageBase(BaseModel):
    name: str
    image_url: str

class UploadedImageCreate(UploadedImageBase):
    pass

class UploadedImageResponse(UploadedImageBase):
    id: int
    user_id: int
    uploaded_at: datetime
    
    class Config:
        from_attributes = True