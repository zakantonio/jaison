"""
Helper functions for OCR API
"""
import os
import uuid
from typing import List, Optional
from pathlib import Path

def generate_unique_id() -> str:
    """
    Generate a unique ID
    
    Returns:
        Unique ID
    """
    return str(uuid.uuid4())

def is_allowed_file(filename: str, allowed_extensions: Optional[List[str]] = None) -> bool:
    """
    Check if a file has an allowed extension
    
    Args:
        filename: Filename to check
        allowed_extensions: List of allowed extensions
        
    Returns:
        True if the file has an allowed extension, False otherwise
    """
    if not allowed_extensions:
        from jaison.ocr_api.config.settings import settings
        allowed_extensions = settings.ALLOWED_EXTENSIONS
    
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def ensure_directory_exists(directory: str) -> None:
    """
    Ensure a directory exists
    
    Args:
        directory: Directory to check
    """
    Path(directory).mkdir(parents=True, exist_ok=True)

def get_file_extension(filename: str) -> str:
    """
    Get the extension of a file
    
    Args:
        filename: Filename to check
        
    Returns:
        File extension
    """
    return os.path.splitext(filename)[1].lower()
