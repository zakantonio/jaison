"""
Test script for the API with multiple document types and custom schemas
"""
import os
import sys
import requests
import json
import time
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Base URL for API
BASE_URL = "http://localhost:8421"

# Test API key - get from environment variable or use default
API_KEY = os.environ.get("TEST_API_KEY", "test-api-key")

def test_health():
    """Test health check endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    print("✅ Health check endpoint working")

def create_test_image(image_type):
    """Create a test image based on the specified type"""
    if image_type == "research_paper":
        test_image_path = Path("tests/test_research_paper.jpg")
        if test_image_path.exists():
            return test_image_path

        from PIL import Image, ImageDraw, ImageFont
        img = Image.new('RGB', (800, 1200), color='white')
        d = ImageDraw.Draw(img)

        # Try to load a font, fall back to default if not available
        try:
            font = ImageFont.truetype("Arial", 20)
            small_font = ImageFont.truetype("Arial", 16)
        except IOError:
            font = ImageFont.load_default()
            small_font = ImageFont.load_default()

        # Create a mock research paper
        d.text((50, 50), "Climate Change Impacts on Global Agriculture:", fill='black', font=font)
        d.text((50, 80), "A Systematic Review", fill='black', font=font)
        d.text((50, 130), "Authors: Jane Smith¹, John Doe²", fill='black', font=small_font)
        d.text((50, 160), "¹University of Climate Science, ²Agricultural Research Institute", fill='black', font=small_font)
        d.text((50, 200), "Publication Date: February 15, 2023", fill='black', font=small_font)

        # Add abstract and other content...
        d.text((50, 250), "Abstract", fill='black', font=font)
        d.text((50, 280), "This paper reviews climate change impacts on agriculture.", fill='black', font=small_font)

    elif image_type == "product_catalog":
        test_image_path = Path("tests/test_product_catalog.jpg")
        if test_image_path.exists():
            return test_image_path

        from PIL import Image, ImageDraw, ImageFont
        img = Image.new('RGB', (800, 1000), color='white')
        d = ImageDraw.Draw(img)

        # Try to load a font, fall back to default if not available
        try:
            font = ImageFont.truetype("Arial", 20)
            small_font = ImageFont.truetype("Arial", 16)
        except IOError:
            font = ImageFont.load_default()
            small_font = ImageFont.load_default()

        # Create a mock product catalog
        d.text((50, 50), "ACME Electronics - Product Catalog 2023", fill='black', font=font)

        # Product 1
        d.text((50, 100), "Product ID: EL-1001", fill='black', font=small_font)
        d.text((50, 130), "Name: Premium Wireless Headphones", fill='black', font=small_font)
        d.text((50, 160), "Category: Audio", fill='black', font=small_font)
        d.text((50, 190), "Price: $129.99", fill='black', font=small_font)
        d.text((50, 220), "In Stock: Yes", fill='black', font=small_font)
        d.text((50, 250), "Description: High-quality wireless headphones with noise cancellation", fill='black', font=small_font)

        # Product 2
        d.text((50, 300), "Product ID: EL-2002", fill='black', font=small_font)
        d.text((50, 330), "Name: Smart Watch Pro", fill='black', font=small_font)
        d.text((50, 360), "Category: Wearables", fill='black', font=small_font)
        d.text((50, 390), "Price: $249.99", fill='black', font=small_font)
        d.text((50, 420), "In Stock: Yes", fill='black', font=small_font)
        d.text((50, 450), "Description: Advanced smartwatch with health monitoring features", fill='black', font=small_font)

    elif image_type == "medical_report":
        test_image_path = Path("tests/test_medical_report.jpg")
        if test_image_path.exists():
            return test_image_path

        from PIL import Image, ImageDraw, ImageFont
        img = Image.new('RGB', (800, 1100), color='white')
        d = ImageDraw.Draw(img)

        # Try to load a font, fall back to default if not available
        try:
            font = ImageFont.truetype("Arial", 20)
            small_font = ImageFont.truetype("Arial", 16)
        except IOError:
            font = ImageFont.load_default()
            small_font = ImageFont.load_default()

        # Create a mock medical report
        d.text((50, 50), "MEDICAL REPORT", fill='black', font=font)
        d.text((50, 100), "Patient ID: P-12345", fill='black', font=small_font)
        d.text((50, 130), "Date: 2023-06-15", fill='black', font=small_font)
        d.text((50, 160), "Physician: Dr. Sarah Johnson", fill='black', font=small_font)

        d.text((50, 210), "Diagnosis:", fill='black', font=font)
        d.text((50, 240), "Type 2 Diabetes Mellitus (E11.9)", fill='black', font=small_font)

        d.text((50, 290), "Vital Signs:", fill='black', font=small_font)
        d.text((70, 320), "Blood Pressure: 138/85 mmHg", fill='black', font=small_font)
        d.text((70, 350), "Heart Rate: 78 bpm", fill='black', font=small_font)
        d.text((70, 380), "Temperature: 98.6°F", fill='black', font=small_font)
        d.text((70, 410), "Weight: 185 lbs", fill='black', font=small_font)

        d.text((50, 460), "Lab Results:", fill='black', font=small_font)
        d.text((70, 490), "HbA1c: 7.2%", fill='black', font=small_font)
        d.text((70, 520), "Fasting Blood Glucose: 142 mg/dL", fill='black', font=small_font)
        d.text((70, 550), "Cholesterol (Total): 195 mg/dL", fill='black', font=small_font)

    else:
        raise ValueError(f"Unknown image type: {image_type}")

    # Save the image
    os.makedirs(test_image_path.parent, exist_ok=True)
    img.save(test_image_path)
    return test_image_path

def upload_image(image_type):
    """Upload a test image and return the file_id"""
    test_image_path = create_test_image(image_type)

    with open(test_image_path, "rb") as f:
        files = {"file": (test_image_path.name, f, "image/jpeg")}
        headers = {"X-API-Key": API_KEY}
        response = requests.post(f"{BASE_URL}/api/v1/ocr/upload", files=files, headers=headers)

    assert response.status_code == 201
    data = response.json()
    assert "file_id" in data
    print(f"✅ Uploaded {image_type} image, file_id: {data['file_id']}")

    return data["file_id"]

def get_schema_for_type(doc_type):
    """Return a custom schema based on document type"""
    if doc_type == "research_paper":
        return {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "authors": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "affiliation": {"type": "string"}
                        }
                    }
                },
                "publication_date": {"type": "string"},
                "abstract": {"type": "string"}
            }
        }
    elif doc_type == "product_catalog":
        return {
            "type": "object",
            "properties": {
                "catalog_name": {"type": "string"},
                "products": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string"},
                            "name": {"type": "string"},
                            "category": {"type": "string"},
                            "price": {"type": "number"},
                            "in_stock": {"type": "boolean"},
                            "description": {"type": "string"}
                        }
                    }
                }
            }
        }
    elif doc_type == "medical_report":
        return {
            "type": "object",
            "properties": {
                "patient_id": {"type": "string"},
                "date": {"type": "string"},
                "physician": {"type": "string"},
                "diagnosis": {"type": "string"},
                "vital_signs": {
                    "type": "object",
                    "properties": {
                        "blood_pressure": {"type": "string"},
                        "heart_rate": {"type": "string"},
                        "temperature": {"type": "string"},
                        "weight": {"type": "string"}
                    }
                },
                "lab_results": {
                    "type": "object",
                    "properties": {
                        "hba1c": {"type": "string"},
                        "blood_glucose": {"type": "string"},
                        "cholesterol": {"type": "string"}
                    }
                }
            }
        }
    else:
        raise ValueError(f"Unknown document type: {doc_type}")

def get_prompt_for_type(doc_type):
    """Return an extraction prompt based on document type"""
    if doc_type == "research_paper":
        return "This is a research paper. Extract the title, authors with their affiliations, publication date, and abstract."
    elif doc_type == "product_catalog":
        return "This is a product catalog. Extract the catalog name and details of all products including ID, name, category, price, stock status, and description."
    elif doc_type == "medical_report":
        return "This is a medical report. Extract the patient ID, date, physician name, diagnosis, vital signs, and lab results."
    else:
        raise ValueError(f"Unknown document type: {doc_type}")

def process_document(file_id, doc_type):
    """Process a document with a custom schema"""
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }

    schema = get_schema_for_type(doc_type)
    prompt = get_prompt_for_type(doc_type)

    payload = {
        "file_id": file_id,
        "document_type": "generic",
        "extraction_prompt": prompt,
        "output_schema": schema
    }

    response = requests.post(f"{BASE_URL}/api/v1/ocr/process", json=payload, headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert "request_id" in data
    assert data["status"] == "pending"
    print(f"✅ Processing {doc_type} with custom schema, request_id: {data['request_id']}")

    return data["request_id"]

def poll_status(request_id, doc_type, max_attempts=30):
    """Poll the status endpoint until processing is complete"""
    headers = {"X-API-Key": API_KEY}

    for attempt in range(max_attempts):
        time.sleep(1)
        response = requests.get(f"{BASE_URL}/api/v1/ocr/status/{request_id}", headers=headers)

        assert response.status_code == 200
        data = response.json()

        if data["status"] in ["completed", "failed"]:
            print(f"✅ {doc_type} processing {data['status']} after {attempt+1} seconds")
            return data

    print(f"⚠️ {doc_type} processing still in progress after {max_attempts} seconds")
    return None

def validate_result(result, doc_type):
    """Validate that the result matches the expected schema"""
    # Check if the result is in the raw_content format
    if "raw_content" in result:
        # Extract the JSON from the markdown code block
        raw_content = result["raw_content"]
        # Remove markdown code block formatting if present
        if raw_content.startswith("```json\n") and raw_content.endswith("\n```"):
            raw_content = raw_content[8:-4]  # Remove ```json\n and \n```

        try:
            # Parse the JSON string into a Python object
            parsed_result = json.loads(raw_content)
            print(f"✅ Successfully parsed nested JSON from raw_content for {doc_type}")
            # Continue validation with the parsed result
            result = parsed_result
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse JSON from raw_content for {doc_type}: {e}")
            print(f"Raw content: {raw_content}")
            raise

    if doc_type == "research_paper":
        assert "title" in result, "Missing title"
        assert "authors" in result, "Missing authors"
        assert isinstance(result["authors"], list), "Authors should be a list"
        assert "publication_date" in result, "Missing publication date"
        assert "abstract" in result, "Missing abstract"

    elif doc_type == "product_catalog":
        assert "catalog_name" in result, "Missing catalog name"
        assert "products" in result, "Missing products"
        assert isinstance(result["products"], list), "Products should be a list"
        assert len(result["products"]) > 0, "Should have at least one product"

        for product in result["products"]:
            assert "id" in product, "Product missing ID"
            assert "name" in product, "Product missing name"
            assert "price" in product, "Product missing price"

    elif doc_type == "medical_report":
        assert "patient_id" in result, "Missing patient ID"
        assert "date" in result, "Missing date"
        assert "physician" in result, "Missing physician"
        assert "diagnosis" in result, "Missing diagnosis"
        assert "vital_signs" in result, "Missing vital signs"
        assert "lab_results" in result, "Missing lab results"

    print(f"✅ {doc_type} result validated successfully")
    return True

def process_document_type(doc_type):
    """Process a single document type from upload to validation"""
    try:
        file_id = upload_image(doc_type)
        request_id = process_document(file_id, doc_type)
        status_data = poll_status(request_id, doc_type)

        if status_data and status_data["status"] == "completed":
            print(f"\n{doc_type.upper()} RESULT:")
            print(json.dumps(status_data["result"], indent=2))
            validate_result(status_data["result"], doc_type)
            return True
        else:
            print(f"❌ {doc_type} processing failed or timed out")
            return False

    except Exception as e:
        print(f"❌ Error processing {doc_type}: {str(e)}")
        return False

def main():
    """Run tests for multiple document types with custom schemas"""
    print("Testing API with multiple document types and custom schemas...")

    try:
        test_health()

        # Define document types to test
        doc_types = ["research_paper", "product_catalog", "medical_report"]

        # Process each document type
        results = {}
        for doc_type in doc_types:
            print(f"\n=== Testing {doc_type} document type ===")
            results[doc_type] = process_document_type(doc_type)

        # Print summary
        print("\n=== TEST SUMMARY ===")
        all_passed = True
        for doc_type, passed in results.items():
            status = "PASSED" if passed else "FAILED"
            print(f"{doc_type}: {status}")
            if not passed:
                all_passed = False

        return all_passed

    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
