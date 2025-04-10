"""
Setup script for the Jaison package
"""
from setuptools import setup, find_packages

setup(
    name="jaison",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.95.0",
        "uvicorn>=0.21.1",
        "pydantic>=2.0.0",
        "pydantic[email]>=2.0.0",
        "pydantic-settings>=2.0.0",
        "python-multipart>=0.0.6",
        "python-dotenv>=1.0.0",
        "aiofiles>=23.1.0",
        "supabase>=0.7.1",
        "postgrest>=0.10.6",
        "httpx>=0.24.0",
        "python-jose[cryptography]>=3.3.0",
        "passlib[bcrypt]>=1.7.4",
        "pyjwt>=2.6.0",
        "loguru>=0.6.0",
        "sentry-sdk>=1.19.1",
        "pillow>=9.5.0",
        "cachetools>=5.3.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.3.1",
            "pytest-asyncio>=0.21.0",
            "pytest-cov>=4.1.0",
            "black>=23.3.0",
            "isort>=5.12.0",
            "flake8>=6.0.0",
            "mypy>=1.2.0",
        ],
    },
    python_requires=">=3.9",
    author="Antonio Zaccaria",
    author_email="antoniozaccaria.work@gmail.com",
    description="OCR as a Service using multimodal LLMs",
    keywords="ocr, llm, multimodal, saas",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
    ],
)
