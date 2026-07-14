from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import cloudinary
import cloudinary.uploader
import uuid
import os
import logging

from app.db.session import get_session as get_db
from app.models.user import User
from app.models.uploaded_audio import UploadedAudio
from app.schemas.uploaded_audio import UploadedAudioResponse, UploadedAudioUpdate
from app.core.security import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

# Cấu hình Cloudinary
cloudinary.config(
    cloud_name="diqes2eof",
    api_key="454186622222465",
    api_secret="0dnKpLhJ_cTaBJb4OQ5aFx8bgX0"
)

@router.post("/upload-reference-audio", response_model=UploadedAudioResponse)
async def upload_reference_audio(
    file: UploadFile = File(...),
    reference_text: str = Form(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload audio reference và lưu vào database kèm reference text
    """
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File phải là audio")
    
    temp_file_path = None
    try:
        logger.info(f"User {current_user.id} uploading audio: {file.filename}")
        
        # Tạo tên file duy nhất
        unique_filename = f"audio_{current_user.id}_{uuid.uuid4().hex}"
        
        # Lưu file tạm
        temp_file_path = f"temp_{unique_filename}"
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        logger.info(f"Saved temp file: {temp_file_path}")
        
        # Upload lên Cloudinary
        upload_result = cloudinary.uploader.upload(
            temp_file_path,
            resource_type="video",  # Cloudinary sử dụng "video" cho cả audio
            folder="reference_audios",
            public_id=unique_filename
        )
        
        logger.info(f"Uploaded to Cloudinary: {upload_result['secure_url']}")
        
        # Xóa file tạm
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        
        # Lưu vào database
        db_audio = UploadedAudio(
            user_id=current_user.id,
            name=file.filename,
            audio_url=upload_result['secure_url'],
            reference_text=reference_text
        )
        db.add(db_audio)
        db.commit()
        db.refresh(db_audio)
        
        logger.info(f"Saved to database: {db_audio.id}")
        
        return db_audio
        
    except Exception as e:
        logger.error(f"Error uploading audio: {str(e)}", exc_info=True)
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Lỗi upload: {str(e)}")

@router.get("/my-audios", response_model=List[UploadedAudioResponse])
async def get_my_audios(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách audio đã upload của user
    """
    try:
        audios = db.query(UploadedAudio).filter(
            UploadedAudio.user_id == current_user.id
        ).order_by(UploadedAudio.uploaded_at.desc()).all()
        
        logger.info(f"User {current_user.id} fetched {len(audios)} audios")
        return audios
    except Exception as e:
        logger.error(f"Error fetching audios: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Lỗi lấy danh sách audio: {str(e)}")

@router.put("/audios/{audio_id}/reference-text", response_model=UploadedAudioResponse)
async def update_reference_text(
    audio_id: int,
    data: UploadedAudioUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cập nhật reference text cho audio
    """
    audio = db.query(UploadedAudio).filter(
        UploadedAudio.id == audio_id,
        UploadedAudio.user_id == current_user.id
    ).first()
    
    if not audio:
        raise HTTPException(status_code=404, detail="Không tìm thấy audio")
    
    audio.reference_text = data.reference_text
    db.commit()
    db.refresh(audio)
    
    return audio

@router.delete("/audios/{audio_id}")
async def delete_audio(
    audio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa audio đã upload
    """
    audio = db.query(UploadedAudio).filter(
        UploadedAudio.id == audio_id,
        UploadedAudio.user_id == current_user.id
    ).first()
    
    if not audio:
        raise HTTPException(status_code=404, detail="Không tìm thấy audio")
    
    db.delete(audio)
    db.commit()
    
    return {"success": True, "message": "Đã xóa audio"}