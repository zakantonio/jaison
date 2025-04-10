.PHONY: setup install test run clean lint format frontend ocr-api admin-api dev db-setup help

# Default target
all: help

# Setup the project
setup: venv install db-setup

# Create virtual environment
venv:
	python3 -m venv venv

# Install dependencies
install:
	. venv/bin/activate && pip install -e ".[dev]"

# Run tests
test:
	. venv/bin/activate && python -m pytest

# Run tests with coverage
test-cov:
	. venv/bin/activate && python -m pytest --cov=jaison

# Format code
format:
	. venv/bin/activate && black jaison tests scripts

# Lint code
lint:
	. venv/bin/activate && flake8 jaison tests scripts

# Clean up
clean:
	rm -rf __pycache__
	rm -rf .pytest_cache
	rm -rf .coverage
	rm -rf htmlcov
	rm -rf dist
	rm -rf build
	rm -rf *.egg-info

# Run the OCR API service
ocr-api:
	. venv/bin/activate && uvicorn jaison.ocr_api.main:app --reload --host 0.0.0.0 --port 8420

# Run the Admin API service
admin-api:
	. venv/bin/activate && uvicorn jaison.admin_api.main:app --reload --host 0.0.0.0 --port 8421

# Run the frontend
frontend:
	cd frontend/jaison-dashboard && npm start

# Run all services (requires tmux)
dev:
	tmux new-session -d -s jaison-dev "make ocr-api"
	tmux split-window -h -t jaison-dev "make admin-api"
	tmux split-window -v -t jaison-dev "make frontend"
	tmux -2 attach-session -t jaison-dev

# Set up the database
db-setup:
	. venv/bin/activate && python scripts/bootstrap_database.py
	. venv/bin/activate && python scripts/run_migrations.py

# Show help
help:
	@echo "Available targets:"
	@echo "  setup      - Set up the project (create venv, install dependencies, set up database)"
	@echo "  install    - Install dependencies"
	@echo "  test       - Run tests"
	@echo "  test-cov   - Run tests with coverage"
	@echo "  format     - Format code"
	@echo "  lint       - Lint code"
	@echo "  clean      - Clean up"
	@echo "  ocr-api    - Run the OCR API service"
	@echo "  admin-api  - Run the Admin API service"
	@echo "  frontend   - Run the frontend"
	@echo "  dev        - Run all services (requires tmux)"
	@echo "  db-setup   - Set up the database"
	@echo "  help       - Show this help"
