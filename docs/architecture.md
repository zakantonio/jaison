# Jaison Architecture

This document describes the architecture of the Jaison application after the refactoring to separate the OCR core service from the authentication and API key management.

## Overview

The Jaison application is now split into two separate services:

1. **OCR API Service (Port 8420)**: Handles document processing and OCR functionality
2. **Admin API Service (Port 8421)**: Handles user authentication, API key management, and database access

This separation allows for better scalability, security, and maintainability.

## Service Architecture

### OCR API Service

The OCR API Service is responsible for:

- Receiving and processing document images
- Extracting information from documents using OCR
- Returning structured data to clients

It runs on port 8420 and does not directly access the database. Instead, it calls the Admin API for authentication and usage tracking.

#### Key Components

- **API Endpoints**: Handles HTTP requests for document processing
- **Storage Service**: Manages file uploads and results
- **OpenRouter Client**: Communicates with the OCR model provider
- **Prompt Service**: Generates prompts for the OCR model
- **Admin Client**: Communicates with the Admin API for validation and usage tracking

### Admin API Service

The Admin API Service is responsible for:

- User authentication and management
- API key creation and validation
- Usage statistics tracking
- Database access and management

It runs on port 8421 and is the only service that directly accesses the database.

#### Key Components

- **Auth Endpoints**: Handles user registration, login, and profile management
- **API Key Endpoints**: Manages API key creation, listing, and revocation
- **Validation Endpoints**: Provides API key validation for the OCR API
- **Database Repositories**: Manages database access
- **Auth Service**: Handles authentication logic

## Communication Between Services

The OCR API communicates with the Admin API through HTTP requests:

1. **API Key Validation**: When a request comes to the OCR API, it validates the API key by calling the Admin API
2. **Usage Recording**: After processing a request, the OCR API records usage statistics by calling the Admin API

This approach ensures that the OCR API doesn't need direct database access and can focus solely on its core functionality.

## Database Access

All database access is handled by the Admin API. The database contains the following tables:

- **users**: User accounts
- **api_keys**: API keys for accessing the OCR API
- **usage_statistics**: Usage tracking for billing and analytics

## Deployment

Both services can be deployed independently, allowing for:

- Different scaling strategies for each service
- Independent updates and deployments
- Better resource allocation based on usage patterns

## Running the Services

To run the services locally:

```bash
# Run the OCR API
make ocr-api

# Run the Admin API
make admin-api

# Run both services and the frontend
make dev
```

## Environment Variables

Each service has its own set of environment variables:

### OCR API

- `OCR_HOST`: Host to bind the server (default: 0.0.0.0)
- `OCR_PORT`: Port to bind the server (default: 8000)
- `OCR_DEBUG`: Enable debug mode (default: False)
- `ADMIN_API_URL`: URL of the Admin API (default: http://localhost:8001)
- `OPENROUTER_API_KEY`: API key for OpenRouter
- `OPENROUTER_MODEL`: Model to use for OCR (default: meta-llama/llama-4-maverick:free)

### Admin API

- `ADMIN_HOST`: Host to bind the server (default: 0.0.0.0)
- `ADMIN_PORT`: Port to bind the server (default: 8001)
- `ADMIN_DEBUG`: Enable debug mode (default: False)
- `SUPABASE_URL`: URL of the Supabase instance
- `SUPABASE_KEY`: API key for Supabase
- `JWT_SECRET_KEY`: Secret key for JWT tokens
