# Jaison - OCR Service powered by LLM.

Extract structured data from document images using multimodal LLMs.

## Overview

Jaison is a platform that leverages multimodal Large Language Models (LLMs) to extract structured information from document images. Unlike traditional OCR services that only convert text from images, Jaison uses advanced visual understanding capabilities of multimodal models to extract specific data requested by the user.

Users can upload images of documents (like receipts, invoices, tickets), specify what information they want to extract using natural language prompts, and receive structured JSON data in response.

### Architecture

Jaison uses a microservices architecture with two separate services:

1. **OCR API Service (Port 8420)**: Handles document processing and OCR functionality
2. **Admin API Service (Port 8421)**: Handles user authentication, API key management, and database access

## Features

- Upload document images via API
- Extract structured data using natural language prompts
- Receive standardized JSON responses
- Dashboard for API key management and usage tracking
- User authentication and account management
- Support for various document types (receipts, invoices, IDs, etc.)

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 16+ and npm (for frontend)
- Supabase account
- OpenRouter API key

### Backend Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/zakantonio/jaison.git
   cd jaison
   ```

2. Set up the environment:

   ```bash
   # Create and activate virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate

   # Install dependencies
   pip install -e ".[dev]"
   ```

3. Configure environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. Set up the database:

   - Create a new project in Supabase
   - Update your `.env` file with the Supabase URL and keys
   - Run the database migrations:
     ```bash
     python scripts/run_migrations.py
     ```
   - This will automatically bootstrap the database and create all necessary tables and indexes
   - If you encounter any issues, you can run the bootstrap script manually:
     ```bash
     python scripts/bootstrap_database.py
     ```

5. Create required directories:
   ```bash
   mkdir -p uploads results
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend/jaison-dashboard
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Running the Application

You can use the provided Makefile commands to run the application:

```bash
# Run the OCR API service
make ocr-api

# Run the Admin API service
make admin-api

# Run the frontend server
make frontend
```

The OCR API will be available at http://localhost:8420
The Admin API will be available at http://localhost:8421
The frontend will be available at http://localhost:3000

### Using the Makefile

The project includes a Makefile with various helpful commands:

```bash
make help  # Show all available commands
```

## Development

### Running Tests

```bash
# Run all tests
make test

# Run tests with coverage report
make test-cov
```

### Code Formatting and Linting

```bash
# Format code
make format

# Lint code
make lint
```

### Project Structure

- `jaison/ocr_api/` - OCR API Service
  - `jaison/ocr_api/api/` - OCR API endpoints and models
  - `jaison/ocr_api/services/` - OCR business logic and external services
  - `jaison/ocr_api/config/` - OCR API configuration settings
  - `jaison/ocr_api/utils/` - OCR API utility functions
- `jaison/admin_api/` - Admin API Service
  - `jaison/admin_api/api/` - Admin API endpoints and models
  - `jaison/admin_api/database/` - Database models and repository
  - `jaison/admin_api/services/` - Admin business logic
  - `jaison/admin_api/config/` - Admin API configuration settings
  - `jaison/admin_api/utils/` - Admin API utility functions
- `frontend/jaison-dashboard/` - React frontend application
- `tests/` - Test suite
- `docs/` - Documentation files
  - `docs/api.md` - API documentation
  - `docs/architecture.md` - Architecture documentation
  - `docs/setup.md` - Setup guide

## API Documentation

Once the services are running, you can access the API documentation at:

- OCR API Swagger UI: http://localhost:8420/docs
- Admin API Swagger UI: http://localhost:8421/docs

Detailed API documentation is also available in the `docs/api.md` file.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
