from fastapi import APIRouter
from app.api.endpoints import (
    auth, 
    users, 
    video,
    media, 
    media_videos,  
    upload,
    slides,
    uploaded_images,
    uploaded_audios
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(upload.router, prefix="/media", tags=["upload"])
api_router.include_router(media.router, prefix="/media", tags=["media"])  
api_router.include_router(video.router, prefix="/videos", tags=["video"])  
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(slides.router, prefix="/slides", tags=["Slides Generation"])
api_router.include_router(media_videos.router, prefix="/media-videos", tags=["media-videos"])
api_router.include_router(uploaded_images.router, prefix="/uploaded-images", tags=["uploaded-images"])
api_router.include_router(uploaded_audios.router, prefix="/uploaded-audios", tags=["uploaded-audios"])