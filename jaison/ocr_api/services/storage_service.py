"""
Service for managing file storage and processing results
"""
import os
import json
import shutil
from typing import Dict, Any, Optional
from fastapi import UploadFile
import aiofiles
from loguru import logger

from jaison.ocr_api.config.settings import settings


class StorageService:
    """Service for managing file storage and processing results"""
    
    def __init__(self):
        """Initialize storage service"""
        self.upload_dir = os.path.join(os.getcwd(), "uploads")
        self.results_dir = os.path.join(os.getcwd(), "results")
        
        # Create directories if they don't exist
        os.makedirs(self.upload_dir, exist_ok=True)
        os.makedirs(self.results_dir, exist_ok=True)
    
    async def save_file(self, file_id: str, file: UploadFile) -> str:
        """
        Save an uploaded file
        
        Args:
            file_id: Unique identifier for the file
            file: Uploaded file
            
        Returns:
            Path to the saved file
        """
        # Create file path
        file_path = os.path.join(self.upload_dir, file_id)
        
        # Save file
        async with aiofiles.open(file_path, "wb") as f:
            # Read and write in chunks to handle large files
            chunk_size = 1024 * 1024  # 1MB chunks
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                await f.write(chunk)
        
        logger.debug(f"Saved file {file_id} to {file_path}")
        
        return file_path
    
    def get_file_path(self, file_id: str) -> str:
        """
        Get the path to a saved file
        
        Args:
            file_id: File ID
            
        Returns:
            Path to the file
        """
        return os.path.join(self.upload_dir, file_id)
    
    async def delete_file(self, file_id: str) -> bool:
        """
        Delete a saved file
        
        Args:
            file_id: File ID
            
        Returns:
            True if file was deleted, False otherwise
        """
        file_path = self.get_file_path(file_id)
        
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.debug(f"Deleted file {file_id}")
            return True
        
        return False
    
    async def save_processing_response(self, request_id: str, response: Dict[str, Any]) -> str:
        """
        Save a processing response
        
        Args:
            request_id: Request ID
            response: Response data
            
        Returns:
            Path to the saved response
        """
        # Create file path
        file_path = os.path.join(self.results_dir, f"{request_id}.json")
        
        # Save response
        async with aiofiles.open(file_path, "w") as f:
            await f.write(json.dumps(response, default=str))
        
        logger.debug(f"Saved processing response {request_id} to {file_path}")
        
        return file_path
    
    async def get_processing_response(self, request_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a processing response
        
        Args:
            request_id: Request ID
            
        Returns:
            Response data if found, None otherwise
        """
        file_path = os.path.join(self.results_dir, f"{request_id}.json")
        
        if not os.path.exists(file_path):
            return None
        
        # Load response
        async with aiofiles.open(file_path, "r") as f:
            content = await f.read()
            return json.loads(content)
    
    async def delete_processing_response(self, request_id: str) -> bool:
        """
        Delete a processing response
        
        Args:
            request_id: Request ID
            
        Returns:
            True if response was deleted, False otherwise
        """
        file_path = os.path.join(self.results_dir, f"{request_id}.json")
        
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.debug(f"Deleted processing response {request_id}")
            return True
        
        return False
    
    async def cleanup_old_files(self, max_age_days: int = 7) -> int:
        """
        Clean up old files and responses
        
        Args:
            max_age_days: Maximum age of files in days
            
        Returns:
            Number of files deleted
        """
        # TODO: Implement cleanup logic
        # This would scan the upload and results directories for files older than max_age_days
        # and delete them
        return 0
