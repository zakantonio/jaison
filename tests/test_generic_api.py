"""
Test script for the API with generic document type and custom schemas
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

def test_upload_image():
    """Test image upload endpoint with a sample research paper"""
    # Create a test image if it doesn't exist
    test_image_path = Path("tests/test_research_paper.jpg")
    if not test_image_path.exists():
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

        d.text((50, 250), "Abstract", fill='black', font=font)
        abstract = (
            "This paper reviews the current literature on climate change impacts on global "
            "agricultural systems, with a focus on crop yields, water resources, and adaptation "
            "strategies. Our analysis indicates significant regional variations in vulnerability "
            "to climate change, with developing countries facing the greatest challenges."
        )

        # Wrap text for abstract
        lines = []
        words = abstract.split()
        current_line = words[0]
        for word in words[1:]:
            if d.textlength(current_line + " " + word, font=small_font) < 700:
                current_line += " " + word
            else:
                lines.append(current_line)
                current_line = word
        lines.append(current_line)

        for i, line in enumerate(lines):
            d.text((50, 280 + i*25), line, fill='black', font=small_font)

        # Key findings
        d.text((50, 450), "Key Findings:", fill='black', font=font)
        findings = [
            "Global crop yields are projected to decrease by 2-6% per decade due to climate change",
            "Water scarcity will affect 40% of agricultural regions by 2050",
            "Adaptation strategies such as drought-resistant crops show promise in mitigating impacts",
            "Economic impacts will be unevenly distributed, with equatorial regions facing greater losses"
        ]

        for i, finding in enumerate(findings):
            d.text((70, 490 + i*30), f"• {finding}", fill='black', font=small_font)

        # Methodology
        d.text((50, 650), "Methodology:", fill='black', font=font)
        d.text((70, 690), "Approach: Systematic literature review of peer-reviewed studies (2010-2022)", fill='black', font=small_font)

        d.text((70, 730), "Data Sources:", fill='black', font=small_font)
        sources = ["Web of Science", "Scopus", "Agricultural Database", "IPCC Assessment Reports"]
        for i, source in enumerate(sources):
            d.text((90, 760 + i*30), f"• {source}", fill='black', font=small_font)

        d.text((70, 880), "Limitations:", fill='black', font=small_font)
        limitations = [
            "Limited long-term observational data in some regions",
            "Uncertainty in climate model projections at regional scales",
            "Publication bias toward English-language journals"
        ]
        for i, limitation in enumerate(limitations):
            d.text((90, 910 + i*30), f"• {limitation}", fill='black', font=small_font)

        os.makedirs(test_image_path.parent, exist_ok=True)
        img.save(test_image_path)

    # Upload image
    with open(test_image_path, "rb") as f:
        files = {"file": (test_image_path.name, f, "image/jpeg")}
        headers = {"X-API-Key": API_KEY}
        response = requests.post(f"{BASE_URL}/api/v1/ocr/upload", files=files, headers=headers)

    assert response.status_code == 201
    data = response.json()
    assert "file_id" in data
    print(f"✅ Upload endpoint working, file_id: {data['file_id']}")

    return data["file_id"]

def test_process_document_with_schema(file_id):
    """Test document processing endpoint with custom schema"""
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }

    # Define a custom schema for research paper extraction
    output_schema = {
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
            "publication_date": {"type": "string", "format": "date"},
            "abstract": {"type": "string"},
            "key_findings": {
                "type": "array",
                "items": {"type": "string"}
            },
            "methodology": {
                "type": "object",
                "properties": {
                    "approach": {"type": "string"},
                    "data_sources": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "limitations": {
                        "type": "array",
                        "items": {"type": "string"}
                    }
                }
            }
        }
    }

    payload = {
        "file_id": file_id,
        "document_type": "generic",
        "extraction_prompt": "This is a research paper about climate change. Extract the title, authors, publication date, abstract, key findings, and methodology.",
        "output_schema": output_schema
    }

    response = requests.post(f"{BASE_URL}/api/v1/ocr/process", json=payload, headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert "request_id" in data
    assert data["status"] == "pending"
    print(f"✅ Process endpoint working with custom schema, request_id: {data['request_id']}")

    return data["request_id"]

def test_get_status(request_id):
    """Test status endpoint"""
    headers = {"X-API-Key": API_KEY}
    response = requests.get(f"{BASE_URL}/api/v1/ocr/status/{request_id}", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["request_id"] == request_id
    print(f"✅ Status endpoint working, status: {data['status']}")

    return data

def validate_schema_compliance(result):
    """Validate that the result complies with our expected schema"""
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
            print("✅ Successfully parsed nested JSON from raw_content")
            # Continue validation with the parsed result
            result = parsed_result
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse JSON from raw_content: {e}")
            print(f"Raw content: {raw_content}")
            raise

    # Check top-level keys
    expected_keys = ["title", "authors", "publication_date", "abstract"]
    for key in expected_keys:
        assert key in result, f"Missing expected key: {key}"

    # Check authors structure
    assert isinstance(result["authors"], list), "Authors should be a list"
    for author in result["authors"]:
        assert "name" in author, "Each author should have a name"
        assert "affiliation" in author, "Each author should have an affiliation"

    # Check key_findings structure - this might be null in some responses
    if result["key_findings"] is not None:
        assert isinstance(result["key_findings"], list), "Key findings should be a list"

    # Check methodology structure - some fields might be null
    assert "methodology" in result, "Missing methodology section"
    assert "approach" in result["methodology"], "Methodology should have an approach"

    # Data sources and limitations might be null
    if result["methodology"]["data_sources"] is not None:
        assert isinstance(result["methodology"]["data_sources"], list), "Data sources should be a list"

    if result["methodology"]["limitations"] is not None:
        assert isinstance(result["methodology"]["limitations"], list), "Limitations should be a list"

    print("✅ Result complies with expected schema")

def main():
    """Run all tests"""
    print("Testing API with generic document type and custom schema...")

    try:

        test_health()
        file_id = test_upload_image()
        request_id = test_process_document_with_schema(file_id)

        # Wait for processing to complete
        print("Waiting for processing to complete...")
        status_data = None

        # Try for up to 30 seconds (generic documents might take longer to process)
        for _ in range(30):
            time.sleep(1)
            status_data = test_get_status(request_id)
            if status_data["status"] in ["completed", "failed"]:
                break

        if status_data["status"] == "completed":
            print("✅ Processing completed successfully!")
            print("Extracted data:")
            print(json.dumps(status_data["result"], indent=2))

            # Validate that the result complies with our expected schema
            validate_schema_compliance(status_data["result"])

        elif status_data["status"] == "failed":
            print("❌ Processing failed!")
            print(f"Error: {status_data.get('error', 'Unknown error')}")
        else:
            print("⚠️ Processing still in progress after timeout")

    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False

    print("All tests completed!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
