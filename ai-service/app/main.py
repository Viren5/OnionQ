import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.config import settings
from app.services.yolo_service import yolo_service

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("onionq-ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown hooks."""
    logger.info("Starting OnionQ AI Service on %s:%d...", settings.HOST, settings.PORT)
    logger.info("Configured YOLO model path: %s", settings.YOLO_MODEL_PATH)
    logger.info("Configured device: %s", settings.YOLO_DEVICE)

    # Attempt to load model on startup
    loaded = yolo_service.load_model()
    if loaded:
        logger.info("Model loaded successfully. Ready for inference.")
    else:
        logger.warning(
            "Service started without a loaded YOLO model. "
            "/health will report model_loaded=false and /api/v1/analyze will return 503."
        )

    yield

    logger.info("Shutting down OnionQ AI Service.")


app = FastAPI(
    title="OnionQ AI Service",
    description=(
        "Production AI/CV Service for Onion Quality Grading & Defect Detection (Smart India Hackathon). "
        "Processes genuine images and executes actual YOLO inference without mocks or synthetic results."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(api_router)


@app.get("/", tags=["System"])
async def root():
    """Service landing endpoint with operational information."""
    return {
        "service": "OnionQ AI Service",
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/health",
        "model_loaded": yolo_service.is_loaded,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
    )
