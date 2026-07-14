from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import cloudinary
import cloudinary.uploader
import os
from typing import Optional, Dict
import uuid
import requests
import logging
import time
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cấu hình Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# API endpoints
DEEPFAKE_API_URL = os.getenv("DEEPFAKE_API_URL")
TTS_API_URL = os.getenv("TTS_API_URL")
FAKELIP_API_URL = os.getenv("FAKELIP_API_URL")

@router.post("/upload-audio")
async def upload_audio_file(file: UploadFile = File(...)):
    """
    Upload file âm thanh lên Cloudinary và trả về URL
    """
    if not file:
        raise HTTPException(status_code=400, detail="Không có file nào được tải lên")
    
    # Kiểm tra định dạng file
    if not file.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=400, 
            detail="Định dạng file không hợp lệ. Vui lòng tải lên file âm thanh."
        )
    
    try:
        # Tạo tên file duy nhất
        unique_filename = f"voice_sample_{uuid.uuid4().hex}"
        
        # Lưu file tạm thời
        temp_file_path = f"temp_{unique_filename}"
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Upload file lên Cloudinary
        upload_result = cloudinary.uploader.upload(
            temp_file_path, 
            resource_type="auto",
            folder="voice_samples",
            public_id=unique_filename
        )
        
        # Xóa file tạm
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            
        # Trả về URL của file đã upload
        if 'secure_url' in upload_result:
            return {"success": True, "audio_url": upload_result['secure_url']}
        else:
            raise HTTPException(status_code=500, detail="Không nhận được URL từ Cloudinary")
            
    except Exception as e:
        # Đảm bảo xóa file tạm nếu có lỗi
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Lỗi khi upload file: {str(e)}")

@router.post("/upload-image")
async def upload_image_file(file: UploadFile = File(...)):
    """
    Upload file hình ảnh lên Cloudinary và trả về URL
    """
    if not file:
        raise HTTPException(status_code=400, detail="Không có file nào được tải lên")
    
    # Kiểm tra định dạng file
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400, 
            detail="Định dạng file không hợp lệ. Vui lòng tải lên file hình ảnh."
        )
    
    try:
        # Tạo tên file duy nhất
        unique_filename = f"deepfake_source_{uuid.uuid4().hex}"
        
        # Lưu file tạm thời
        temp_file_path = f"temp_{unique_filename}"
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Upload file lên Cloudinary
        upload_result = cloudinary.uploader.upload(
            temp_file_path, 
            resource_type="image",
            folder="deepfake_sources",
            public_id=unique_filename
        )
        
        # Xóa file tạm
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            
        # Trả về URL của file đã upload
        if 'secure_url' in upload_result:
            return {"success": True, "image_url": upload_result['secure_url']}
        else:
            raise HTTPException(status_code=500, detail="Không nhận được URL từ Cloudinary")
            
    except Exception as e:
        # Đảm bảo xóa file tạm nếu có lỗi
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Lỗi khi upload file: {str(e)}")

@router.post("/upload-video")
async def upload_video_file(file: UploadFile = File(...)):
    """
    Upload file video lên Cloudinary và trả về URL
    """
    if not file:
        raise HTTPException(status_code=400, detail="Không có file nào được tải lên")
    
    # Kiểm tra định dạng file
    if not file.content_type.startswith("video/"):
        raise HTTPException(
            status_code=400, 
            detail="Định dạng file không hợp lệ. Vui lòng tải lên file video."
        )
    
    try:
        # Tạo tên file duy nhất
        unique_filename = f"deepfake_target_{uuid.uuid4().hex}"
        
        # Lưu file tạm thời
        temp_file_path = f"temp_{unique_filename}"
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Upload file lên Cloudinary
        upload_result = cloudinary.uploader.upload(
            temp_file_path, 
            resource_type="video",
            folder="deepfake_targets",
            public_id=unique_filename
        )
        
        # Xóa file tạm
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            
        # Trả về URL của file đã upload
        if 'secure_url' in upload_result:
            return {"success": True, "video_url": upload_result['secure_url']}
        else:
            raise HTTPException(status_code=500, detail="Không nhận được URL từ Cloudinary")
            
    except Exception as e:
        # Đảm bảo xóa file tạm nếu có lỗi
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Lỗi khi upload file: {str(e)}")

@router.post("/process-deepfake")
async def process_deepfake(data: Dict):
    """
    Gửi yêu cầu deepfake đến API và trả về job_id
    """
    source_url = data.get("source_url")
    target_url = data.get("target_url")
    
    if not source_url or not target_url:
        raise HTTPException(status_code=400, detail="Thiếu source_url hoặc target_url")
    
    # Log để debug
    logger.info(f"Processing deepfake: source={source_url}, target={target_url}")
    
    try:
        # ✅ API yêu cầu field tên "source" và "target"
        payload = {
            "source": source_url,
            "target": target_url
        }
        
        logger.info(f"Sending payload: {payload}")
        
        response = requests.post(
            f"{DEEPFAKE_API_URL}/deepfake",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            timeout=60
        )
        
        # Log response để debug
        logger.info(f"Response status: {response.status_code}")
        logger.info(f"Response body: {response.text}")
        
        if response.status_code in [200, 201, 202]:
            result = response.json()
            job_id = result.get("job_id")
            
            if job_id:
                logger.info(f"Deepfake job created successfully: {job_id}")
                return {"job_id": job_id}
            else:
                raise HTTPException(
                    status_code=500,
                    detail="API không trả về job_id"
                )
        else:
            # Lỗi từ API deepfake
            error_detail = response.json().get("error", response.text)
            raise HTTPException(
                status_code=response.status_code,
                detail=f"API Deepfake trả về lỗi: {error_detail}"
            )
        
    except requests.RequestException as e:
        logger.error(f"Request error: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Không thể kết nối API Deepfake: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi không xác định: {str(e)}")

@router.get("/deepfake-status/{job_id}")
async def check_deepfake_status(job_id: str):
    """
    Kiểm tra trạng thái của quá trình deepfake
    """
    try:
        response = requests.get(
            f"{DEEPFAKE_API_URL}/status/{job_id}",
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            status = result.get("status", "processing")
            
            # Nếu status là "done", gọi endpoint /result để lấy URL
            if status == "done":
                try:
                    result_response = requests.get(
                        f"{DEEPFAKE_API_URL}/result/{job_id}",
                        timeout=10
                    )
                    
                    if result_response.status_code == 200:
                        result_data = result_response.json()
                        return {
                            "success": True,
                            "status": "completed",  # Đổi "done" thành "completed" cho frontend
                            "result_url": result_data.get("result_url"),
                            "message": "Deepfake hoàn tất"
                        }
                    elif result_response.status_code == 202:
                        # Still processing
                        return {
                            "success": True,
                            "status": status,
                            "result_url": None,
                            "message": f"Trạng thái: {status}"
                        }
                except Exception as e:
                    # Nếu lỗi khi lấy result, vẫn trả về status
                    return {
                        "success": True,
                        "status": status,
                        "result_url": None,
                        "message": f"Không lấy được URL: {str(e)}"
                    }
            
            # Các status khác: queued, processing, error, etc.
            return {
                "success": True,
                "status": status,
                "result_url": result.get("result_url"),  # Có thể null
                "stderr": result.get("stderr"),  # Error message nếu có
                "message": f"Trạng thái: {status}"
            }
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"API Deepfake trả về lỗi khi check status: {response.text}"
            )
        
    except requests.RequestException as e:
        raise HTTPException(
            status_code=503,
            detail=f"Không thể kết nối đến API Deepfake: {str(e)}"
        )

@router.get("/deepfake-result/{job_id}")
async def get_deepfake_result(job_id: str):
    """
    Lấy kết quả URL của deepfake đã hoàn thành
    """
    try:
        response = requests.get(
            f"{DEEPFAKE_API_URL}/result/{job_id}",
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            return {
                "success": True,
                "result_url": result.get("result_url"),
                "message": "Lấy kết quả thành công"
            }
        elif response.status_code == 202:
            # Still processing
            result = response.json()
            return {
                "success": False,
                "status": result.get("status"),
                "message": "Job chưa hoàn thành"
            }
        elif response.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail="Job không tồn tại"
            )
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"API Deepfake trả về lỗi: {response.text}"
            )
        
    except requests.RequestException as e:
        raise HTTPException(
            status_code=503,
            detail=f"Không thể kết nối đến API Deepfake: {str(e)}"
        )

@router.post("/process-tts")
async def process_tts(data: Dict):
    """
    Gửi yêu cầu TTS đến API và trả về audio URL
    """
    try:
        logger.info(f"Processing TTS with payload: {data}")
        
        response = requests.post(
            f"{TTS_API_URL}/vietvoice",
            json=data,
            headers={
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true"
            },
            timeout=300  
            
        )
        
        logger.info(f"TTS Response status: {response.status_code}")
        logger.info(f"TTS Response body: {response.text}")
        
        if response.status_code in [200, 201]:
            result = response.json()
            return {
                "success": True,
                "audio_file_url": result.get("result_url"),
                "message": result.get("message", "TTS completed successfully")
            }
        else:
            error_detail = response.json().get("error", response.text)
            raise HTTPException(
                status_code=response.status_code,
                detail=f"TTS API error: {error_detail}"
            )
            
    except requests.RequestException as e:
        logger.error(f"TTS Request error: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Cannot connect to TTS API: {str(e)}"
        )
    except Exception as e:
        logger.error(f"TTS Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.post("/process-fakelip")
async def process_fakelip(data: Dict):
    """
    Gửi yêu cầu Fakelip đến API và trả về video URL
    """
    audio_url = data.get("audio_url")
    video_url = data.get("video_url")
    
    if not audio_url or not video_url:
        raise HTTPException(status_code=400, detail="Missing audio_url or video_url")
    
    try:
        logger.info(f"Processing Fakelip: audio={audio_url}, video={video_url}")
        
        payload = {
            "audio_url": audio_url,
            "video_url": video_url
        }
        
        session = requests.Session()
        retry = Retry(
            total=3,  
            backoff_factor=2,  
            status_forcelist=[502, 503, 504],  
            allowed_methods=["POST"]
        )
        adapter = HTTPAdapter(max_retries=retry)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        response = session.post(
            f"{FAKELIP_API_URL}/fakelip",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "Connection": "keep-alive"  
            },
            timeout=300  
        )
        
        logger.info(f"Fakelip Response status: {response.status_code}")
        logger.info(f"Fakelip Response body: {response.text}")
        
        if response.status_code in [200, 201]:
            result = response.json()
            return {
                "success": True,
                "result_url": result.get("result_url"),
                "message": "Fakelip completed successfully"
            }
        else:
            error_detail = response.json().get("error", response.text)
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Fakelip API error: {error_detail}"
            )
            
    except requests.Timeout as e:
        logger.error(f"Fakelip Timeout error: {e}")
        raise HTTPException(
            status_code=504,
            detail="Fakelip API timeout - Quá trình xử lý quá lâu. Vui lòng thử lại sau."
        )
    except requests.ConnectionError as e:
        logger.error(f"Fakelip Connection error: {e}")
        raise HTTPException(
            status_code=503,
            detail="Không thể kết nối đến Fakelip API. Vui lòng kiểm tra server Fakelip."
        )
    except requests.RequestException as e:
        logger.error(f"Fakelip Request error: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Cannot connect to Fakelip API: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Fakelip Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")