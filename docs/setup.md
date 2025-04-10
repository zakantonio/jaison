# Jaison Setup Guide

This document describes how to set up and run the Jaison application after the refactoring.

## Prerequisites

- Python 3.9 or higher
- Node.js 16 or higher
- npm 8 or higher
- tmux (for running all services together)
- Supabase account (for database)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/jaison.git
cd jaison
```

2. Create a virtual environment and install dependencies:

```bash
make setup
```

This will:

- Create a Python virtual environment
- Install the required Python packages
- Set up the database

3. Set up environment variables:

Create a `.env` file in the root directory with the following variables:

```
# Supabase settings
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# JWT settings
JWT_SECRET_KEY=your_jwt_secret_key

# OpenRouter settings
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=meta-llama/llama-4-maverick:free

# OCR API settings
OCR_HOST=0.0.0.0
OCR_PORT=8420
OCR_DEBUG=False
OCR_CORS_ORIGINS=*

# Admin API settings
ADMIN_HOST=0.0.0.0
ADMIN_PORT=8421
ADMIN_DEBUG=False
ADMIN_CORS_ORIGINS=*

# Admin API URL (for OCR API to connect to)
ADMIN_API_URL=http://localhost:8421
ADMIN_API_TIMEOUT=5
```

## Database Setup

1. Create a new project in Supabase

2. Run the database setup script:

```bash
make db-setup
```

This will create the necessary tables and functions in your Supabase database.

## Running the Services

### Running the OCR API

```bash
make ocr-api
```

This will start the OCR API service on port 8000.

### Running the Admin API

```bash
make admin-api
```

This will start the Admin API service on port 8001.

### Running the Frontend

```bash
make frontend
```

This will start the frontend development server.

### Running All Services

```bash
make dev
```

This will start all services (OCR API, Admin API, and Frontend) in a tmux session.

## Testing

To run the tests:

```bash
make test
```

To run the tests with coverage:

```bash
make test-cov
```

## Development

### Code Formatting

```bash
make format
```

### Linting

```bash
make lint
```

### Cleaning

```bash
make clean
```

## Troubleshooting

### Database Issues

If you encounter database issues, check the following:

1. Make sure your Supabase URL and key are correct in the `.env` file
2. Run the database setup script again: `make db-setup`
3. Check the database logs in the Supabase dashboard

### API Connection Issues

If the OCR API cannot connect to the Admin API:

1. Make sure both services are running
2. Check that the `ADMIN_API_URL` environment variable is set correctly
3. Check the logs for both services

### Frontend Issues

If the frontend cannot connect to the APIs:

1. Make sure the API services are running
2. Check that the API URLs are configured correctly in the frontend
3. Check for CORS issues in the browser console
