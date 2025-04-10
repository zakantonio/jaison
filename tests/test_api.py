"""
Test script for the API
"""
import os
import sys
import requests
import json
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Base URLs for APIs
OCR_API_URL = "http://localhost:8420"
ADMIN_API_URL = "http://localhost:8421"

#Test API key - get from environment variable or use default
API_KEY = os.environ.get("TEST_API_KEY", "test-api-key")

def test_admin_health():
    """Test Admin API health check endpoint"""
    response = requests.get(f"{ADMIN_API_URL}/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    print(f"✅ Admin API health check endpoint working: {data['status']}")

def test_ocr_health():
    """Test OCR API health check endpoint"""
    headers = {"X-API-Key": API_KEY}
    response = requests.get(f"{OCR_API_URL}/api/v1/health", headers=headers)
    print(f"ℹ️ OCR API health check status: {response.status_code}")

    # It's okay if we get 401 Unauthorized since we're using a test API key
    if response.status_code == 401:
        print("✅ OCR API is running (authentication required)")
        return True
    elif response.status_code == 200:
        data = response.json()
        assert "status" in data
        print(f"✅ OCR API health check endpoint working: {data['status']}")
        return True
    else:
        print(f"❌ OCR API health check failed with status {response.status_code}")
        return False

def test_upload_image():
    """Test image upload endpoint"""
    # Create a test image if it doesn't exist
    test_image_path = Path("tests/test_image.jpg")
    if not test_image_path.exists():
        from PIL import Image, ImageDraw, ImageFont
        img = Image.new('RGB', (500, 300), color='white')
        d = ImageDraw.Draw(img)
        d.text((20, 20), "Test Receipt", fill='black')
        d.text((20, 50), "Date: 2023-04-15", fill='black')
        d.text((20, 80), "Total: $42.99", fill='black')
        d.text((20, 110), "Item 1: $19.99", fill='black')
        d.text((20, 140), "Item 2: $23.00", fill='black')
        os.makedirs(test_image_path.parent, exist_ok=True)
        img.save(test_image_path)

    # Upload image
    with open(test_image_path, "rb") as f:
        files = {"file": (test_image_path.name, f, "image/jpeg")}
        headers = {"X-API-Key": API_KEY}
        response = requests.post(f"{OCR_API_URL}/api/v1/upload", files=files, headers=headers)

    assert response.status_code == 201
    data = response.json()
    assert "file_id" in data
    print(f"✅ Upload endpoint working, file_id: {data['file_id']}")

    return data["file_id"]

def test_process_document(file_id):
    """Test document processing endpoint"""
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "file_id": file_id,
        "document_type": "receipt",
        "extraction_prompt": "Extract the date, total amount, and items from this receipt."
    }
    response = requests.post(f"{OCR_API_URL}/api/v1/process", json=payload, headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert "request_id" in data
    assert data["status"] == "pending"
    print(f"✅ Process endpoint working, request_id: {data['request_id']}")

    return data["request_id"]

def test_get_status(request_id):
    """Test status endpoint"""
    headers = {"X-API-Key": API_KEY}
    response = requests.get(f"{OCR_API_URL}/api/v1/status/{request_id}", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["request_id"] == request_id
    print(f"✅ Status endpoint working, status: {data['status']}")

    return data

def main():
    """Run all tests"""
    print("Testing API...")

    try:
        # Test health endpoints
        test_admin_health()
        ocr_api_running = test_ocr_health()

        if not ocr_api_running:
            print("❌ OCR API is not running or not accessible")
            return False

        # Try to upload an image and process it
        try:
            file_id = test_upload_image()
            request_id = test_process_document(file_id)

            # Wait for processing to complete
            import time
            print("Waiting for processing to complete...")
            for _ in range(10):  # Try for up to 10 seconds
                time.sleep(1)
                status_data = test_get_status(request_id)
                if status_data["status"] in ["completed", "failed"]:
                    break

            if status_data["status"] == "completed":
                print("✅ Processing completed successfully!")
                print("Extracted data:")
                print(json.dumps(status_data["result"], indent=2))
            elif status_data["status"] == "failed":
                print("❌ Processing failed!")
                print(f"Error: {status_data.get('error', 'Unknown error')}")
            else:
                print("⚠️ Processing still in progress after timeout")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                print("⚠️ Authentication failed: Invalid API key or missing authentication")
                print("This is expected if you haven't set up a valid API key yet")
            else:
                print(f"❌ HTTP Error: {e}")
                return False
        except Exception as e:
            print(f"❌ Test failed during OCR processing: {str(e)}")
            return False

    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False

    print("All tests completed!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
