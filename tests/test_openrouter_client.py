"""
Tests for OpenRouter client
run with venv/bin/activate && python -m pytest
"""
import pytest
import os
from unittest.mock import patch, MagicMock
import base64
import json
from io import BytesIO
from PIL import Image
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from jaison.ocr_api.services.openrouter_client import OpenRouterClient

# Create a simple test image
def create_test_image():
    """Create a simple test image"""
    img = Image.new('RGB', (100, 100), color='red')
    buffer = BytesIO()
    img.save(buffer, format="JPEG")
    return buffer.getvalue()

@pytest.fixture
def mock_response():
    """Mock response from OpenRouter API"""
    return {
        "id": "chatcmpl-123",
        "object": "chat.completion",
        "created": 1677858242,
        "model": "meta-llama/llama-4-maverick:free",
        "usage": {
            "prompt_tokens": 50,
            "completion_tokens": 100,
            "total_tokens": 150
        },
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": json.dumps({
                        "extracted_data": {
                            "date": "2023-04-15",
                            "total_amount": 42.99,
                            "items": [
                                {"name": "Product 1", "price": 19.99},
                                {"name": "Product 2", "price": 23.00}
                            ]
                        }
                    })
                },
                "finish_reason": "stop",
                "index": 0
            }
        ]
    }

@pytest.mark.asyncio
async def test_process_image(mock_response):
    """Test processing an image"""
    # Create a test image
    test_image = create_test_image()

    # Create client instance
    client = OpenRouterClient()

    # Mock the _make_request method
    with patch.object(client, '_make_request', return_value=mock_response):
        # Call the method
        result = await client.process_image(
            image_data=test_image,
            prompt="Extract all information from this receipt",
            model="meta-llama/llama-4-maverick:free"
        )

        # Check the result
        assert "extracted_data" in result
        assert "date" in result["extracted_data"]
        assert "total_amount" in result["extracted_data"]
        assert "items" in result["extracted_data"]
        assert len(result["extracted_data"]["items"]) == 2

@pytest.mark.asyncio
async def test_make_request_timeout():
    """Test timeout handling"""
    # Create client instance
    client = OpenRouterClient()
    client.timeout = 0.1  # Very short timeout for testing

    # Mock httpx.AsyncClient to raise TimeoutException
    with patch('httpx.AsyncClient') as mock_client:
        mock_instance = MagicMock()
        mock_client.return_value.__aenter__.return_value = mock_instance
        mock_instance.post.side_effect = TimeoutError("Request timed out")

        # Call the method and check for exception
        with pytest.raises(TimeoutError):
            await client._make_request("chat/completions", {"test": "payload"})

@pytest.mark.asyncio
async def test_invalid_image():
    """Test handling of invalid image data"""
    # Create client instance
    client = OpenRouterClient()

    # Call with invalid image data
    with pytest.raises(ValueError):
        await client.process_image(
            image_data=b"not an image",
            prompt="Extract information",
            model="meta-llama/llama-4-maverick:free"
        )
