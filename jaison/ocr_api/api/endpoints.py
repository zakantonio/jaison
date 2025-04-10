"""
OCR API endpoints for image upload and processing
"""
import os
import uuid
import time
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks, Path
import httpx

from jaison.ocr_api.utils.logger import logger
from jaison.ocr_api.api.models import (
    DocumentType,
    ProcessingStatus,
    UploadResponse,
    ProcessingRequest,
    ProcessingResponse,
    ErrorResponse,
    HealthCheckResponse
)
from jaison.ocr_api.api.dependencies import get_api_key, rate_limiter, APIKeyInfo
from jaison.ocr_api.services.admin_client import admin_client
from jaison.ocr_api.services.openrouter_client import openrouter_client
from jaison.ocr_api.services.prompt_service import PromptService
from jaison.ocr_api.services.storage_service import StorageService
from jaison.ocr_api.config.settings import settings

# Create router
router = APIRouter(
    prefix="/api/v1",
    tags=["OCR"],
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)

# Initialize services
storage_service = StorageService()
prompt_service = PromptService()

# Start time for uptime calculation
START_TIME = time.time()

@router.get("/health", response_model=HealthCheckResponse, dependencies=[])
async def health_check():
    """
    Health check endpoint

    Returns the status of the OCR API and its dependencies
    """
    # Check Admin API connection
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(f"{settings.ADMIN_API_URL}/api/v1/health")
            admin_api_status = "up" if response.status_code == 200 else "down"
    except Exception:
        admin_api_status = "down"

    return HealthCheckResponse(
        status="ok",
        version="1.0.0",
        admin_api_status=admin_api_status,
        uptime_seconds=time.time() - START_TIME
    )

@router.post("/upload", response_model=UploadResponse, status_code=201)
async def upload_image(
    file: UploadFile = File(...),
    api_key_info: APIKeyInfo = Depends(get_api_key),
    _: None = Depends(rate_limiter),
):
    """
    Upload an image for OCR processing

    - **file**: Image file to upload (JPG, PNG, or PDF)
    """
    # Start timing the request
    start_time = time.time()

    try:
        # Validate file type
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in [".jpg", ".jpeg", ".png", ".pdf"]:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file_ext}. Supported types: JPG, PNG, PDF"
            )

        # Check file size
        file_size = 0
        file_content = await file.read()
        file_size = len(file_content)

        if file_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large: {file_size} bytes. Maximum size: {settings.MAX_UPLOAD_SIZE} bytes"
            )

        # Reset file position after reading
        await file.seek(0)

        # Generate unique file ID
        file_id = str(uuid.uuid4())

        # Save file
        await storage_service.save_file(file_id, file)

        # Create response
        response = UploadResponse(
            file_id=file_id,
            filename=file.filename,
            content_type=file.content_type,
            size=file_size,
            upload_time=datetime.now(timezone.utc),
        )

        logger.info(f"File uploaded: {file_id}, size: {file_size} bytes, type: {file.content_type}")

        # Record API usage with Admin API
        try:
            await admin_client.record_usage(
                user_id=api_key_info.user_id,
                api_key_id=api_key_info.key_id,
                endpoint="/upload",
                status_code=201,
                processing_time_ms=int((time.time() - start_time) * 1000),
                request_size_bytes=file_size,
                document_type=file.content_type,
                credits_used=0.1  # Upload costs 0.1 credits
            )
        except Exception as e:
            logger.error(f"Error recording API usage: {e}")
            # Don't fail the request if usage tracking fails

        return response

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading file: {str(e)}"
        )

    finally:
        # Close the file
        await file.close()


@router.post("/process", response_model=ProcessingResponse)
async def process_document(
    request: ProcessingRequest,
    background_tasks: BackgroundTasks,
    api_key_info: APIKeyInfo = Depends(get_api_key),
    _: None = Depends(rate_limiter),
):
    """
    Process an uploaded document with OCR

    - **file_id**: ID of the previously uploaded file
    - **document_type**: Type of document (receipt, invoice, etc.)
    - **extraction_prompt**: What information to extract from the document
    - **model**: Optional model to use (defaults to system default)
    - **output_schema**: Optional JSON schema for structuring the output
    """
    # Start timing the request
    start_time = time.time()

    try:
        # Check if file exists
        file_path = storage_service.get_file_path(request.file_id)
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404,
                detail=f"File not found: {request.file_id}"
            )

        # Generate request ID
        request_id = str(uuid.uuid4())

        # Create initial response
        response = ProcessingResponse(
            request_id=request_id,
            status=ProcessingStatus.PENDING,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        # Store the response for later retrieval
        await storage_service.save_processing_response(request_id, response.model_dump())

        # Record API usage with Admin API
        try:
            await admin_client.record_usage(
                user_id=api_key_info.user_id,
                api_key_id=api_key_info.key_id,
                endpoint="/process",
                status_code=200,
                processing_time_ms=int((time.time() - start_time) * 1000),
                document_type=request.document_type.value if request.document_type else None,
                model_used=request.model or "default",
                credits_used=1.0  # Base cost for processing
            )
        except Exception as e:
            logger.error(f"Error recording API usage: {e}")
            # Don't fail the request if usage tracking fails

        # Process in background
        background_tasks.add_task(
            process_document_task,
            request_id=request_id,
            file_id=request.file_id,
            document_type=request.document_type,
            extraction_prompt=request.extraction_prompt,
            model=request.model,
            output_schema=request.output_schema,
            user_id=api_key_info.user_id,
            api_key_id=api_key_info.key_id,
        )

        logger.info(f"Document processing started: {request_id}, file: {request.file_id}")

        return response

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing document: {str(e)}"
        )


@router.get("/status/{request_id}", response_model=ProcessingResponse)
async def get_processing_status(
    request_id: str = Path(..., description="Processing request ID"),
    api_key_info: APIKeyInfo = Depends(get_api_key),
):
    """
    Get the status of a document processing request

    - **request_id**: ID of the processing request
    """
    # Start timing the request
    start_time = time.time()

    try:
        # Get processing response
        response_data = await storage_service.get_processing_response(request_id)

        if not response_data:
            raise HTTPException(
                status_code=404,
                detail=f"Processing request not found: {request_id}"
            )

        # Record API usage with Admin API
        try:
            await admin_client.record_usage(
                user_id=api_key_info.user_id,
                api_key_id=api_key_info.key_id,
                endpoint="/status",
                status_code=200,
                processing_time_ms=int((time.time() - start_time) * 1000),
                credits_used=0.01  # Status check costs 0.01 credits
            )
        except Exception as e:
            logger.error(f"Error recording API usage: {e}")
            # Don't fail the request if usage tracking fails

        return ProcessingResponse(**response_data)

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        logger.error(f"Error getting processing status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting processing status: {str(e)}"
        )


async def process_document_task(
    request_id: str,
    file_id: str,
    document_type: DocumentType,
    extraction_prompt: str,
    user_id: str,
    api_key_id: str,
    model: Optional[str] = None,
    output_schema: Optional[Dict[str, Any]] = None,
):
    """Background task for document processing"""
    try:
        # Update status to processing
        response_data = await storage_service.get_processing_response(request_id)
        response = ProcessingResponse(**response_data)
        response.status = ProcessingStatus.PROCESSING
        response.updated_at = datetime.now(timezone.utc)
        await storage_service.save_processing_response(request_id, response.model_dump())

        # Get file path
        file_path = storage_service.get_file_path(file_id)

        # Read file content
        with open(file_path, "rb") as f:
            file_content = f.read()

        # Generate prompt
        final_prompt = prompt_service.generate_prompt(
            document_type=document_type,
            user_prompt=extraction_prompt,
            output_schema=output_schema
        )

        # Process with OpenRouter
        start_time = time.time()

        # Use the model specified or default
        model_to_use = model or settings.OPENROUTER_MODEL

        # Process the image
        result = await openrouter_client.process_image(
            image_data=file_content,
            prompt=final_prompt,
            model=model_to_use,
        )

        # Calculate processing time
        processing_time = time.time() - start_time

        # Update response with result
        response.status = ProcessingStatus.COMPLETED
        response.updated_at = datetime.now(timezone.utc)
        response.completed_at = datetime.now(timezone.utc)
        response.result = result
        response.model_used = model_to_use
        response.processing_time = processing_time
        response.credits_used = 1.0  # Placeholder, will be calculated based on model and usage

        logger.info(f"Document processing completed: {request_id}, time: {processing_time:.2f}s")

        # Record completion with Admin API
        try:
            await admin_client.record_usage(
                user_id=user_id,
                api_key_id=api_key_id,
                endpoint="/process/complete",
                status_code=200,
                processing_time_ms=int(processing_time * 1000),
                document_type=document_type.value,
                model_used=model_to_use,
                credits_used=1.0  # Will be calculated based on model and usage
            )
        except Exception as e:
            logger.error(f"Error recording completion usage: {e}")
            # Don't fail the processing if usage tracking fails

    except Exception as e:
        # Update response with error
        response.status = ProcessingStatus.FAILED
        response.updated_at = datetime.now(timezone.utc)
        response.error = str(e)

        logger.error(f"Document processing failed: {request_id}, error: {str(e)}")

        # Record failure with Admin API
        try:
            await admin_client.record_usage(
                user_id=user_id,
                api_key_id=api_key_id,
                endpoint="/process/failed",
                status_code=500,
                processing_time_ms=0,
                document_type=document_type.value,
                credits_used=0.1  # Failed processing costs less
            )
        except Exception as e:
            logger.error(f"Error recording failure usage: {e}")

    finally:
        # Save updated response
        await storage_service.save_processing_response(request_id, response.model_dump())
