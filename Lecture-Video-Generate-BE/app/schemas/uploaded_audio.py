from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UploadedAudioBase(BaseModel):
    name: str
    audio_url: str
    reference_text: str = ""

class UploadedAudioCreate(UploadedAudioBase):
    pass

class UploadedAudioResponse(UploadedAudioBase):
    id: int
    user_id: int
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

class UploadedAudioUpdate(BaseModel):
    reference_text: str