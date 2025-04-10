# Using the Jaison OCR API Postman Collection

This guide explains how to use the Postman collection to interact with the Jaison OCR API.

## Prerequisites

- [Postman](https://www.postman.com/downloads/) installed on your computer
- A valid API key for the Jaison OCR API

## Importing the Collection and Environment

1. Open Postman
2. Click on "Import" in the top left corner
3. Select the `jaison_ocr_api_collection.json` and `jaison_ocr_api_environment.json` files
4. Click "Import"

## Setting Up the Environment

1. In the top right corner of Postman, click on the environment dropdown and select "Jaison OCR API Environment"
2. Click on the "eye" icon next to the environment dropdown
3. Update the following variables:
   - `base_url`: The base URL of the OCR API (default: `http://localhost:8420`)
   - `api_key`: Your API key for authentication
4. Click "Save"

## Using the Collection

The collection includes the following requests:

### 1. Health Check

This request checks if the OCR API service is running properly.

1. Select the "Health Check" request
2. Click "Send"
3. You should receive a `200 OK` response with the service status

### 2. Upload Document

This request uploads a document for OCR processing.

1. Select the "Upload Document" request
2. In the "Body" tab, click on "Select File" next to the "file" parameter
3. Choose a document file (JPG, PNG, or PDF)
4. Click "Send"
5. You should receive a `200 OK` response with a `file_id`
6. The response will include a `file_id` that you'll need for the next step
7. Click on the "eye" icon next to the environment dropdown
8. Add the `file_id` from the response to the `file_id` variable
9. Click "Save"

### 3. Process Document

This request processes an uploaded document with OCR.

1. Select the "Process Document" request
2. In the "Body" tab, update the JSON payload:
   - Make sure the `file_id` matches the one from the previous step (it should automatically use the environment variable)
   - Set the `document_type` to match your document (e.g., "receipt", "invoice", "id_card")
   - Customize the `extraction_prompt` and `output_schema` as needed
3. Click "Send"
4. You should receive a `200 OK` response with a `request_id`
5. The response will include a `request_id` that you'll need for the next step
6. Click on the "eye" icon next to the environment dropdown
7. Add the `request_id` from the response to the `request_id` variable
8. Click "Save"

### 4. Get Processing Status

This request gets the status of a document processing request.

1. Select the "Get Processing Status" request
2. Make sure the URL includes the correct `request_id` (it should automatically use the environment variable)
3. Click "Send"
4. You should receive a `200 OK` response with the processing status
5. If the status is "pending", wait a few seconds and try again
6. If the status is "completed", the response will include the extracted data in the `result` field

## Example Workflow

Here's a complete workflow for processing a receipt:

1. **Health Check**: Verify that the API is running
2. **Upload Document**: Upload a receipt image
   - Save the `file_id` from the response
3. **Process Document**: Process the receipt with the following payload:
   ```json
   {
     "file_id": "{{file_id}}",
     "document_type": "receipt",
     "extraction_prompt": "Extract the total amount, date, and vendor name",
     "output_schema": {
       "type": "object",
       "properties": {
         "total_amount": { "type": "number" },
         "date": { "type": "string", "format": "date" },
         "vendor_name": { "type": "string" }
       }
     }
   }
   ```
   - Save the `request_id` from the response
4. **Get Processing Status**: Check the status of the processing request
   - If status is "pending", wait and try again
   - If status is "completed", view the extracted data in the `result` field

## Troubleshooting

- **401 Unauthorized**: Make sure your API key is correct and properly set in the environment
- **404 Not Found**: Check that the base URL is correct and the API service is running
- **422 Unprocessable Entity**: Check your request payload for errors
- **500 Internal Server Error**: There may be an issue with the API service; check the logs

## Next Steps

Once you're familiar with the API, you can integrate it into your application using the language and framework of your choice. See the [Flutter examples](../flutter/ocr_api_examples.md) for code snippets to help you get started.
