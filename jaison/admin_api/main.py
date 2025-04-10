"""
Admin API Service Main Entry Point
"""
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from jaison.admin_api.api.router import router
from jaison.admin_api.utils.logger import logger
from jaison.admin_api.config.settings import settings

# Create FastAPI app
app = FastAPI(
    title="Jaison Admin API",
    description="Admin API for user management and API keys",
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

# Health check endpoint
@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    
    return {
        "status": "ok",
        "version": "1.0.0"
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    logger.info("Starting Admin API service")
    
    # Check database status
    # db_status = await check_database_status()
    # if not db_status.get("database_ready", False):
    #     logger.warning("Database is not ready. Some features may not work correctly.")
    #     if db_status.get("bootstrap_required", False):
    #         logger.warning("Database bootstrap is required. Please run bootstrap_database.py")
    #     elif db_status.get("pending_migrations", 0) > 0:
    #         logger.warning(f"Database has {db_status.get('pending_migrations')} pending migrations. Please run migrations")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    logger.info("Shutting down Admin API service")

if __name__ == "__main__":
    # Run the application
    uvicorn.run(
        "jaison.admin_api.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
