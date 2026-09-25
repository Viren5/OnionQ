# Production-oriented Dockerfile for OnionQ AI Service
FROM python:3.11-slim

# Avoid writing .pyc files and buffer stdout/stderr for real-time logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install minimal OS dependencies required by OpenCV and network healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY app/ ./app/

# Copy trained YOLO model
COPY models/ ./models/

# Default environment configuration
ENV HOST=0.0.0.0 \
    PORT=8000 \
    YOLO_MODEL_PATH=/app/models/onion_best.pt \
    YOLO_CONFIDENCE_THRESHOLD=0.25 \
    YOLO_IMAGE_SIZE=640 \
    YOLO_DEVICE=cpu \
    CORS_ORIGINS="*"

EXPOSE 8000

# Health check using the /health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Launch FastAPI via Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]