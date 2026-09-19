import logging
from fastapi import APIRouter, File, HTTPException, Response, UploadFile, status

from app.config import settings
from app.models.schemas import (
    AnalysisResponse,
    HealthResponse,
    ImageMeta,
    ModelInfo,
)
from app.services.yolo_service import yolo_service
from app.utils.image_utils import (
    draw_detections,
    encode_image,
    validate_and_decode_image,
)

logger = logging.getLogger("onionq-ai.api")

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service and Model Health Status",
    description="Returns operational status of the service and confirms whether the YOLO model is loaded.",
)
async def get_health() -> HealthResponse:
    """Return actual service status and model loading state without falsehoods."""
    model_status = yolo_service.get_status()
    return HealthResponse(
        status="ok",
        service="onionq-ai",
        model_loaded=model_status["model_loaded"],
        model_path=model_status["configured_path"],
        device=model_status["device"],
        available_classes=model_status["available_classes"] if model_status["model_loaded"] else None,
    )


@router.post(
    "/api/v1/analyze",
    response_model=AnalysisResponse,
    summary="Analyze Onion Sample Image",
    description=(
        "Accepts an actual onion sample image, decodes it via OpenCV, and executes real YOLO inference. "
        "Returns 503 if the trained OnionQ model weights are not loaded."
    ),
    responses={
        200: {"description": "Real inference results with actual detections and bounding boxes."},
        400: {"description": "Invalid, corrupted, or unsupported image file."},
        413: {"description": "Uploaded image exceeds size limit."},
        503: {"description": "Trained OnionQ model is not loaded or missing."},
    },
)
async def analyze_image(file: UploadFile = File(...)) -> AnalysisResponse:
    """
    Process an uploaded image through OpenCV decoding and real YOLO detection.
    Never returns mock, hardcoded, or fabricated detections.
    """
    # 1. Validate and decode the actual image using OpenCV
    image_bgr, width, height = await validate_and_decode_image(file)

    # 2. Verify that a real model is loaded
    if not yolo_service.is_loaded:
        error_msg = (
            f"Trained OnionQ model is not available. Ensure trained YOLO weights exist at "
            f"YOLO_MODEL_PATH (configured: '{settings.YOLO_MODEL_PATH}'). "
            f"Details: {yolo_service.load_error or 'Weights file missing'}"
        )
        logger.error("Analysis requested but model is not available: %s", error_msg)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=error_msg,
        )

    # 3. Execute real YOLO inference
    try:
        detections, inference_time_ms = yolo_service.run_inference(image_bgr)
    except Exception as exc:
        logger.error("Inference execution failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference execution failed: {str(exc)}",
        )

    # 4. Construct real structured response
    return AnalysisResponse(
        success=True,
        image=ImageMeta(width=width, height=height),
        detections=detections,
        detection_count=len(detections),
        model_info=ModelInfo(
            model_path=settings.YOLO_MODEL_PATH,
            device=settings.YOLO_DEVICE,
            confidence_threshold=settings.YOLO_CONFIDENCE_THRESHOLD,
            image_size=settings.YOLO_IMAGE_SIZE,
        ),
        inference_time_ms=inference_time_ms,
    )


@router.post(
    "/api/v1/analyze/annotated",
    summary="Analyze and Return Annotated Image",
    description="Runs real YOLO inference and returns the actual image with bounding boxes drawn.",
    responses={
        200: {"content": {"image/jpeg": {}}, "description": "Annotated JPEG image with bounding boxes."},
        400: {"description": "Invalid, corrupted, or unsupported image file."},
        503: {"description": "Trained OnionQ model is not loaded or missing."},
    },
)
async def analyze_and_annotate_image(file: UploadFile = File(...)) -> Response:
    """
    Process image, execute real inference, and return an annotated JPEG image.
    Uses actual bounding boxes and class names produced by YOLO.
    """
    image_bgr, _, _ = await validate_and_decode_image(file)

    if not yolo_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Trained OnionQ model is not available: {yolo_service.load_error or 'Model unloaded'}",
        )

    detections, _ = yolo_service.run_inference(image_bgr)

    # Draw real bounding boxes onto the OpenCV image
    annotated_bgr = draw_detections(image_bgr, detections)
    annotated_bytes = encode_image(annotated_bgr, ext=".jpg")

    return Response(content=annotated_bytes, media_type="image/jpeg")
