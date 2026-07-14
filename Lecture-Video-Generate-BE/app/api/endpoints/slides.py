from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional
import os
import json
import logging
from pathlib import Path
from datetime import datetime  # Đảm bảo import datetime
from ...services.gen_slides import SlideGeneratorService
from ...core.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Đường dẫn tới thư mục output (ngoài app)
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent  # Lên 4 cấp từ file này
OUTPUT_DIR = BASE_DIR / "output" / "presentations"

class GenerateSlideRequest(BaseModel):
    content: str = Field(..., description="Nội dung cần tạo slide", min_length=10)
    num_slides: Optional[int] = Field(None, description="Số lượng slide mong muốn (None = tự động)", ge=1, le=50)
    pptx_filename: Optional[str] = Field(None, description="Tên file PowerPoint output")
    json_filename: Optional[str] = Field(None, description="Tên file JSON output")
    
    class Config:
        schema_extra = {
            "example": {
                "content": "Python là một ngôn ngữ lập trình bậc cao, thông dịch, đa mục đích. Python có cú pháp đơn giản, dễ học và dễ đọc.",
                "num_slides": 5,
                "pptx_filename": "python_presentation.pptx",
                "json_filename": "python_data.json"
            }
        }

class GenerateSlideResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None
    error: Optional[str] = None


@router.post("/generate", response_model=GenerateSlideResponse, status_code=status.HTTP_201_CREATED)
async def generate_slides(request: GenerateSlideRequest):
    """
    Tạo slide presentation từ nội dung văn bản
    
    - **content**: Nội dung cần tạo slide (bắt buộc)
    - **num_slides**: Số lượng slide mong muốn (optional, mặc định 5-10 slides)
    - **pptx_filename**: Tên file PowerPoint (optional, tự động generate nếu không có)
    - **json_filename**: Tên file JSON metadata (optional)
    
    Returns:
    - File PowerPoint hoàn chỉnh (.pptx)
    - File JSON chứa metadata và nội dung slides
    - Thông tin chi tiết về presentation đã tạo
    """
    try:
        logger.info(f"Received generate slides request: content_length={len(request.content)}, num_slides={request.num_slides}")
        logger.info(f"Output directory: {OUTPUT_DIR}")
        
        # Khởi tạo service
        service = SlideGeneratorService()
        
        # Generate slides
        result = service.generate_slides_complete(
            content=request.content,
            output_dir=str(OUTPUT_DIR),
            num_slides=request.num_slides,
            pptx_filename=request.pptx_filename,
            json_filename=request.json_filename
        )
        
        logger.info(f"Generate slides result: success={result.get('success')}")
        
        if not result["success"]:
            error_msg = result.get("message", "Unknown error")
            error_detail = result.get("error", "")
            logger.error(f"Generate slides failed: {error_msg} - {error_detail}")
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": error_msg,
                    "error": error_detail
                }
            )
        
        return GenerateSlideResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in generate_slides: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Lỗi server khi tạo slides",
                "error": str(e)
            }
        )


@router.get("/download/{filename}")
async def download_presentation(filename: str):
    """
    Download file PowerPoint đã tạo
    
    - **filename**: Tên file cần download
    """
    try:
        filepath = OUTPUT_DIR / filename
        
        logger.info(f"Attempting to download file: {filepath}")
        
        if not filepath.exists():
            logger.error(f"File not found: {filepath}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File không tồn tại"
            )
        
        # Kiểm tra extension
        if not filename.endswith('.pptx'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Chỉ hỗ trợ download file .pptx"
            )
        
        return FileResponse(
            path=str(filepath),
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            filename=filename
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi download file: {str(e)}"
        )


@router.get("/metadata/{filename}")
async def get_slide_metadata(filename: str):
    """
    Lấy metadata của presentation
    
    - **filename**: Tên file JSON metadata (không cần .json extension)
    """
    try:
        # Đảm bảo có extension .json
        if not filename.endswith('.json'):
            filename += '.json'
        
        filepath = OUTPUT_DIR / filename
        
        logger.info(f"Looking for metadata at: {filepath}")
        
        if not filepath.exists():
            logger.error(f"Metadata file not found: {filepath}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Metadata không tồn tại: {filename}"
            )
        
        with open(filepath, 'r', encoding='utf-8') as f:
            slide_data = json.load(f)
        
        # Tạo metadata structure với slide_data wrapper
        metadata = {
            "title": slide_data.get("title", "Untitled"),
            "total_slides": len(slide_data.get("slides", [])),
            "created_at": filepath.stat().st_ctime,
            "slides": [],  # Sẽ được populate từ slide images
            "slide_data": slide_data  # Wrap toàn bộ JSON vào slide_data
        }
        
        # Tìm các file slide images tương ứng
        base_name = filename.replace('.json', '')
        for slide_json in slide_data.get("slides", []):
            slide_num = slide_json.get("slide_number", 0)
            slide_type = "title" if slide_num == 0 else "content"
            
            # Tìm file image tương ứng
            image_filename = f"{base_name}_slide_{slide_num}.png"
            image_path = OUTPUT_DIR / image_filename
            
            if image_path.exists():
                metadata["slides"].append({
                    "slide_number": slide_num,
                    "type": slide_type,
                    "title": slide_json.get("title", ""),
                    "filepath": str(image_path),
                    "filename": image_filename
                })
        
        logger.info(f"Successfully loaded metadata: {filename}")
        
        return {
            "success": True,
            "data": metadata,
            "message": "Lấy metadata thành công"
        }
        
    except HTTPException:
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in metadata file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File metadata không hợp lệ: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error reading metadata: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi đọc metadata: {str(e)}"
        )


@router.get("/list")
async def list_presentations():
    """
    Lấy danh sách tất cả presentations đã tạo
    """
    try:
        logger.info(f"Listing presentations from: {OUTPUT_DIR}")
        
        if not OUTPUT_DIR.exists():
            logger.warning(f"Output directory does not exist: {OUTPUT_DIR}")
            return {
                "success": True,
                "data": {
                    "presentations": [],
                    "total": 0
                },
                "message": "Chưa có presentation nào"
            }
        
        presentations = []
        for file_path in OUTPUT_DIR.glob("*.pptx"):
            file_size = file_path.stat().st_size
            created_at = file_path.stat().st_ctime
            
            presentations.append({
                "filename": file_path.name,
                "file_size": file_size,
                "created_at": created_at
            })
        
        # Sort by created_at descending
        presentations.sort(key=lambda x: x["created_at"], reverse=True)
        
        logger.info(f"Found {len(presentations)} presentations")
        
        return {
            "success": True,
            "data": {
                "presentations": presentations,
                "total": len(presentations)
            },
            "message": f"Tìm thấy {len(presentations)} presentations"
        }
        
    except Exception as e:
        logger.error(f"Error listing presentations: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy danh sách: {str(e)}"
        )


@router.post("/save-metadata")
async def save_metadata(slide_data: dict):
    """
    Lưu metadata đã được chỉnh sửa
    """
    try:
        # Đảm bảo OUTPUT_DIR tồn tại
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        
        # Tạo filename dựa trên timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"slide_data_{timestamp}.json"
        filepath = OUTPUT_DIR / filename
        
        logger.info(f"Saving metadata to: {filepath}")
        
        # Lưu file JSON
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(slide_data, f, ensure_ascii=False, indent=2)
        
        file_size = os.path.getsize(filepath)
        
        logger.info(f"Successfully saved metadata: {filename} ({file_size} bytes)")
        
        return {
            "success": True,
            "data": {
                "filename": filename,
                "filepath": str(filepath),
                "file_size": file_size
            },
            "message": "Lưu metadata thành công"
        }
        
    except Exception as e:
        logger.error(f"Error saving metadata: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lưu metadata: {str(e)}"
        )