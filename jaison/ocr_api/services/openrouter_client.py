"""
OpenRouter API client for multimodal LLM access
"""
import base64
import httpx
from typing import Dict, Any, List, Optional
from loguru import logger
import json
import asyncio
from io import BytesIO
from PIL import Image

from jaison.ocr_api.config.settings import settings

class OpenRouterClient:
    """Client for OpenRouter API"""

    API_URL = "https://openrouter.ai/api/v1"

    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.default_model = settings.OPENROUTER_MODEL
        self.timeout = settings.API_TIMEOUT

    async def _make_request(self, endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Make a request to OpenRouter API"""
        url = f"{self.API_URL}/{endpoint}"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://jaison.app",  # Replace with your actual domain
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                return response.json()
        except httpx.TimeoutException:
            logger.error(f"Request to OpenRouter timed out after {self.timeout} seconds")
            raise TimeoutError(f"Request to OpenRouter timed out after {self.timeout} seconds")
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error from OpenRouter: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error making request to OpenRouter: {e}")
            raise

    async def process_image(
        self,
        image_data: bytes,
        prompt: str,
        model: Optional[str] = None,
        max_tokens: int = 1000,
    ) -> Dict[str, Any]:
        """
        Process an image with a multimodal LLM

        Args:
            image_data: Raw image bytes
            prompt: Text prompt describing what to extract from the image
            model: Model to use (defaults to settings.OPENROUTER_MODEL)
            max_tokens: Maximum tokens to generate

        Returns:
            Dictionary with the model's response
        """
        # Encode image to base64
        try:
            # Validate and potentially resize the image
            img = Image.open(BytesIO(image_data))

            # Convert to RGB if needed (e.g., for PNG with transparency)
            if img.mode != "RGB":
                img = img.convert("RGB")

            # Resize if too large (many models have size limits)
            max_dimension = 2000  # Example limit
            if max(img.size) > max_dimension:
                ratio = max_dimension / max(img.size)
                new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
                img = img.resize(new_size, Image.LANCZOS)

            # Convert back to bytes in memory
            buffer = BytesIO()
            img.save(buffer, format="JPEG", quality=85)
            processed_image_data = buffer.getvalue()

            # Encode to base64
            base64_image = base64.b64encode(processed_image_data).decode("utf-8")
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            raise ValueError(f"Invalid image data: {e}")

        # Prepare the message with the image
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                ]
            }
        ]

        # Prepare the payload
        payload = {
            #"model": model or self.default_model,
            "model": self.default_model,
            "messages": messages,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"}
        }

        # Make the request
        try:
            logger.info(f"Sending request to OpenRouter with model: {model or self.default_model}")
            response = await self._make_request("chat/completions", payload)

            # Extract the content from the response
            if "choices" in response and len(response["choices"]) > 0:
                content = response["choices"][0]["message"]["content"]

                # Try to parse as JSON
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    # Check if content is wrapped in markdown code block
                    if content.startswith("```json\n") and content.endswith("\n```"):
                        # Extract JSON from markdown code block
                        json_content = content[8:-4]  # Remove ```json\n and \n```
                        try:
                            logger.info("Extracting JSON from markdown code block")
                            return json.loads(json_content)
                        except json.JSONDecodeError:
                            logger.warning("Failed to parse JSON from markdown code block")

                    # If we reach here, either it's not a markdown code block or parsing failed
                    logger.warning("Response is not valid JSON, returning raw content")
                    return {"raw_content": content}

            logger.error(f"Unexpected response format from OpenRouter: {response}")
            raise ValueError("Unexpected response format from OpenRouter")
        except Exception as e:
            logger.error(f"Error processing image with OpenRouter: {e}")
            raise

# Create a singleton instance
openrouter_client = OpenRouterClient()
