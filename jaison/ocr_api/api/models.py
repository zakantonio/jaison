"""
OCR API models
"""
from enum import Enum
from typing import Dict, Any, Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class DocumentType(str, Enum):
    """Document type enumeration"""
    RECEIPT = "receipt"
    INVOICE = "invoice"
    ID_CARD = "id_card"
    BUSINESS_CARD = "business_card"
    TICKET = "ticket"
    COUPON = "coupon"
    GENERIC = "generic"


class ProcessingStatus(str, Enum):
    """Processing status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class UploadResponse(BaseModel):
    """Upload response model"""
    file_id: str
    filename: str
    content_type: str
    size: int
    upload_time: datetime


class ProcessingRequest(BaseModel):
    """Processing request model"""
    file_id: str
    document_type: DocumentType
    extraction_prompt: Optional[str] = None
    model: Optional[str] = None
    output_schema: Optional[Dict[str, Any]] = None


class ProcessingResponse(BaseModel):
    """Processing response model"""
    request_id: str
    status: ProcessingStatus
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    model_used: Optional[str] = None
    processing_time: Optional[float] = None
    credits_used: Optional[float] = None


class ErrorResponse(BaseModel):
    """Error response model"""
    status_code: int = 400
    message: str
    details: Optional[Dict[str, Any]] = None
    error_code: Optional[str] = None


class PromptTemplate(BaseModel):
    """Prompt template model"""
    name: str
    document_type: DocumentType
    template: str
    description: Optional[str] = None
    is_default: bool = False
    parameters: List[str] = Field(default_factory=list)


class HealthCheckResponse(BaseModel):
    """Health check response model"""
    status: str
    version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    admin_api_status: str
    uptime_seconds: float
