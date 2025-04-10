"""
OCR API Service Main Entry Point
"""
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from jaison.ocr_api.api.router import router
from jaison.ocr_api.utils.logger import logger
from jaison.ocr_api.config.settings import settings

# Create FastAPI app
app = FastAPI(
    title="Jaison OCR API",
    description="OCR API for document processing",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(router)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    logger.info("Starting OCR API service")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    logger.info("Shutting down OCR API service")

if __name__ == "__main__":
    # Run the application
    uvicorn.run(
        "jaison.ocr_api.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
