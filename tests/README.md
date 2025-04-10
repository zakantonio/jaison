# API Testing Scripts

This directory contains test scripts for the Jaison OCR API, with a focus on testing different document types and custom schema functionality.

## Available Test Scripts

### 1. `test_api.py`

Basic API test script that tests the standard receipt document type.

```bash
python tests/test_api.py
```

### 2. `test_generic_api.py`

Tests the API with a generic document type (research paper) and a custom output schema.

```bash
python tests/test_generic_api.py
```

### 3. `test_multi_schema_api.py`

Tests the API with multiple document types (research paper, product catalog, medical report) and custom schemas for each.

```bash
python tests/test_multi_schema_api.py
```

## Requirements

- Python 3.7+
- Pillow (for generating test images)
- Requests (for API calls)

These dependencies should already be installed in the virtual environment. If not, you can install them with:

```bash
pip install pillow requests
```

## How to Use

1. Make sure the API server is running at `http://localhost:8421`
2. Activate the virtual environment:

```bash
# On macOS/Linux
source venv/bin/activate

# On Windows
venv\Scripts\activate
```

3. Run the desired test script

## Custom Schema Testing

The test scripts demonstrate how to use the `/api/v1/ocr/process` endpoint with custom document types and schemas. Key features demonstrated:

- Processing generic document types
- Defining custom output schemas using JSON Schema
- Using specific extraction prompts to guide the model
- Validating that the results match the expected schema

## Example Custom Schema

```json
{
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "authors": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "affiliation": { "type": "string" }
        }
      }
    },
    "publication_date": { "type": "string", "format": "date" },
    "abstract": { "type": "string" },
    "key_findings": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

## Tips for Custom Schema Testing

1. Be specific in your extraction prompts to guide the model
2. Define schemas that match the expected structure of the document
3. Use appropriate data types (string, number, boolean, array, object)
4. For complex documents, break down the schema into logical sections
5. Test with different document types to ensure flexibility

## Handling the API Response Format

The API may return the extracted data in two different formats:

1. **Direct JSON Object**: The extracted data is directly available in the `result` field of the response.

2. **Nested JSON String**: The extracted data is returned as a JSON string inside a markdown code block in the `raw_content` field of the response. For example:

````json
{
  "raw_content": "```json\n{\n  \"title\": \"Document Title\",\n  \"authors\": [...]\n}\n```"
}
````

The test scripts handle both formats automatically by checking for the presence of a `raw_content` field and parsing the nested JSON if necessary.
