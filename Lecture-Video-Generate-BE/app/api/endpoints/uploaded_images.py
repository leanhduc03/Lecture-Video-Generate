from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import cloudinary
import cloudinary.uploader
import uuid
import os

from app.db.session import get_session as get_db
from app.models.user import User
from app.models.uploaded_image import UploadedImage
from app.schemas.uploaded_image import UploadedImageResponse
from app.core.security import get_current_user

router = APIRouter()

# Cấu hình Cloudinary
cloudinary.config(
    cloud_name="diqes2eof",
    api_key="454186622222465",
    api_secret="0dnKpLhJ_cTaBJb4OQ5aFx8bgX0"
)

@router.post("/upload-source-image", response_model=UploadedImageResponse)
async def upload_source_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload ảnh nguồn và lưu vào database
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File phải là hình ảnh")
    
    try:
        # Tạo tên file duy nhất
        unique_filename = f"source_{current_user.id}_{uuid.uuid4().hex}"
        
        # Lưu file tạm
        temp_file_path = f"temp_{unique_filename}"
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Upload lên Cloudinary
        upload_result = cloudinary.uploader.upload(
            temp_file_path,
            resource_type="image",
            folder="deepfake_sources",
            public_id=unique_filename
        )
        
        # Xóa file tạm
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        
        # Lưu vào database
        db_image = UploadedImage(
            user_id=current_user.id,
            name=file.filename,
            image_url=upload_result['secure_url']
        )
        db.add(db_image)
        db.commit()
        db.refresh(db_image)
        
        return db_image
        
    except Exception as e:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Lỗi upload: {str(e)}")

@router.get("/my-images", response_model=List[UploadedImageResponse])
async def get_my_images(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách ảnh đã upload của user
    """
    images = db.query(UploadedImage).filter(
        UploadedImage.user_id == current_user.id
    ).order_by(UploadedImage.uploaded_at.desc()).all()
    
    return images

@router.delete("/images/{image_id}")
async def delete_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa ảnh đã upload
    """
    image = db.query(UploadedImage).filter(
        UploadedImage.id == image_id,
        UploadedImage.user_id == current_user.id
    ).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Không tìm thấy ảnh")
    
    db.delete(image)
    db.commit()
    
    return {"success": True, "message": "Đã xóa ảnh"}