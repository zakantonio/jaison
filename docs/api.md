# Jaison API Documentation

This document describes the API endpoints for the Jaison application after the refactoring.

## OCR API Service

The OCR API Service provides endpoints for document processing and OCR functionality.

Base URL: `http://localhost:8420/api/v1`

### Authentication

All OCR API endpoints require an API key to be provided in the `X-API-Key` header:

```
X-API-Key: sk_your_api_key_here
```

API keys can be created and managed through the Dashboard.

### Endpoints

#### Health Check

```
GET /health
```

Returns the health status of the OCR API service.

**Response**:

```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2023-06-01T12:00:00Z",
  "admin_api_status": "up",
  "uptime_seconds": 3600
}
```

#### Upload Document

```
POST /upload
```

Uploads a document for OCR processing.

**Request**:

- Content-Type: multipart/form-data
- Body:
  - file: The document file (JPG, PNG, or PDF)

**Response**:

```json
{
  "file_id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "receipt.jpg",
  "content_type": "image/jpeg",
  "size": 12345,
  "upload_time": "2023-06-01T12:00:00Z"
}
```

#### Process Document

```
POST /process
```

Processes an uploaded document with OCR.

**Request**:

```json
{
  "file_id": "550e8400-e29b-41d4-a716-446655440000",
  "document_type": "receipt",
  "extraction_prompt": "Extract the total amount, date, and vendor name",
  "model": "meta-llama/llama-4-maverick:free",
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

**Response**:

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "pending",
  "created_at": "2023-06-01T12:01:00Z",
  "updated_at": "2023-06-01T12:01:00Z"
}
```

#### Get Processing Status

```
GET /status/{request_id}
```

Gets the status of a document processing request.

**Response**:

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "completed",
  "created_at": "2023-06-01T12:01:00Z",
  "updated_at": "2023-06-01T12:02:00Z",
  "completed_at": "2023-06-01T12:02:00Z",
  "result": {
    "total_amount": 42.99,
    "date": "2023-05-30",
    "vendor_name": "Acme Corp"
  },
  "model_used": "meta-llama/llama-4-maverick:free",
  "processing_time": 5.2,
  "credits_used": 1.0
}
```

## Admin API Service

The Admin API Service provides endpoints for user authentication, API key management, and usage statistics.

Base URL: `http://localhost:8421/api/v1`

### Authentication

Most Admin API endpoints require a JWT token to be provided in the `Authorization` header:

```
Authorization: Bearer your_jwt_token_here
```

JWT tokens can be obtained by logging in through the `/auth/login` endpoint.

### Endpoints

#### Health Check

```
GET /health
```

Returns the health status of the Admin API service.

**Response**:

```json
{
  "status": "ok",
  "version": "1.0.0",
  "database": {
    "database_ready": true,
    "applied_migrations": 5,
    "pending_migrations": 0
  }
}
```

#### User Registration

```
POST /auth/register
```

Registers a new user.

**Request**:

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2023-06-01T12:00:00Z"
}
```

#### User Login

```
POST /auth/login
```

Logs in a user and returns a JWT token.

**Request**:

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "remember_me": true
}
```

**Response**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_at": "2023-07-01T12:00:00Z",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2023-06-01T12:00:00Z"
  }
}
```

#### Get Current User

```
GET /auth/me
```

Gets the current user's information.

**Response**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2023-06-01T12:00:00Z"
}
```

#### Create API Key

```
POST /api-keys
```

Creates a new API key.

**Request**:

```json
{
  "name": "My API Key",
  "expires_in_days": 30
}
```

**Response**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "key": "sk_abcdef1234567890abcdef1234567890",
  "name": "My API Key",
  "created_at": "2023-06-01T12:00:00Z",
  "expires_at": "2023-07-01T12:00:00Z",
  "is_active": true,
  "last_used": null
}
```

#### Get API Keys

```
GET /api-keys
```

Gets all API keys for the current user.

**Query Parameters**:

- `active_only`: If true, only returns active API keys (default: false)

**Response**:

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "key": null,
    "name": "My API Key",
    "created_at": "2023-06-01T12:00:00Z",
    "expires_at": "2023-07-01T12:00:00Z",
    "is_active": true,
    "last_used": "2023-06-01T13:00:00Z"
  }
]
```

#### Deactivate API Key

```
PATCH /api-keys/{api_key_id}/deactivate
```

Deactivates an API key.

**Response**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "key": null,
  "name": "My API Key",
  "created_at": "2023-06-01T12:00:00Z",
  "expires_at": "2023-07-01T12:00:00Z",
  "is_active": false,
  "last_used": "2023-06-01T13:00:00Z"
}
```

#### Activate API Key

```
PATCH /api-keys/{api_key_id}/activate
```

Activates an API key.

**Response**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "key": null,
  "name": "My API Key",
  "created_at": "2023-06-01T12:00:00Z",
  "expires_at": "2023-07-01T12:00:00Z",
  "is_active": true,
  "last_used": "2023-06-01T13:00:00Z"
}
```

#### Delete API Key

```
DELETE /api-keys/{api_key_id}
```

Deletes an API key.

**Response**:

- Status: 204 No Content
