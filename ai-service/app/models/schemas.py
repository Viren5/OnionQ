from typing import List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Response schema for GET /health endpoint."""
    status: str = Field(..., example="ok")
    service: str = Field(..., example="onionq-ai")
    model_loaded: bool = Field(..., example=False)
    model_path: Optional[str] = Field(None, example="models/onion_best.pt")
    device: Optional[str] = Field(None, example="cpu")
    available_classes: Optional[List[str]] = Field(None, description="Class names detected by the model if loaded")


class BoundingBox(BaseModel):
    """Normalized or pixel coordinates of detection bounding box."""
    x1: float = Field(..., description="Top-left X coordinate")
    y1: float = Field(..., description="Top-left Y coordinate")
    x2: float = Field(..., description="Bottom-right X coordinate")
    y2: float = Field(..., description="Bottom-right Y coordinate")


class Detection(BaseModel):
    """Individual detection output produced directly by the YOLO model."""
    detection_id: int = Field(..., description="1-indexed sequence ID")
    class_id: int = Field(..., description="YOLO class index")
    class_name: str = Field(..., description="Dynamic class label loaded from model definition")
    confidence: float = Field(..., description="Detection confidence score (0.0 to 1.0)")
    bounding_box: BoundingBox


class ImageMeta(BaseModel):
    """Image metadata."""
    width: int
    height: int


class ModelInfo(BaseModel):
    """Metadata describing the active model and inference configuration."""
    model_path: str
    device: str
    confidence_threshold: float
    image_size: int


class AnalysisResponse(BaseModel):
    """Structured inference response returned by POST /api/v1/analyze."""
    success: bool = True
    image: ImageMeta
    detections: List[Detection]
    detection_count: int
    model_info: ModelInfo
    inference_time_ms: float
