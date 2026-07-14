from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from fastapi.staticfiles import StaticFiles
from pathlib import Path  # thêm

from .api.api import api_router
from .core.config import settings
from .db.session import create_db_and_tables


def create_application() -> FastAPI:
    application = FastAPI(
        title="LecVidGen API",
        description="API cho ứng dụng học máy trong xây dựng bài giảng số",
        version="1.0.0",
    )
    
    # Thêm CORS middleware
    if settings.BACKEND_CORS_ORIGINS:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    
    # Mount static folder (backend/static) để các URL /static/... hoạt động
    BASE_DIR = Path(__file__).resolve().parents[1]
    STATIC_DIR = BASE_DIR / "static"
    if STATIC_DIR.exists():
        application.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

    # Thêm router API
    application.include_router(api_router, prefix=settings.API_V1_STR)
    
    @application.on_event("startup")
    def on_startup():
        create_db_and_tables()
    
    return application


app = create_application()


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
