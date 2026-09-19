import logging
from typing import Tuple, List
import cv2
import numpy as np
from fastapi import HTTPException, UploadFile, status

from app.config import settings
from app.models.schemas import Detection

logger = logging.getLogger("onionq-ai.utils")

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
}

# Dimension limits to prevent zip-bomb / out-of-memory attacks
MIN_DIMENSION = 10
MAX_DIMENSION = 10000


async def validate_and_decode_image(file: UploadFile) -> Tuple[np.ndarray, int, int]:
    """
    Validate uploaded image file and decode into an OpenCV BGR numpy array.

    Validations performed:
    1. File is provided and not empty.
    2. Content-Type header matches allowed image MIME types.
    3. File size is within MAX_UPLOAD_SIZE_MB.
    4. OpenCV decodes bytes successfully without corruption.
    5. Dimensions are within acceptable bounds [MIN_DIMENSION, MAX_DIMENSION].

    Returns:
        (image_bgr, width, height)
    """
    if not file or not file.filename:
        logger.warning("Upload validation failed: Missing file or filename.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file uploaded or filename is missing.",
        )

    # Validate MIME type
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_MIME_TYPES:
        logger.warning("Upload validation failed: Unsupported Content-Type '%s'", content_type)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{content_type}'. Allowed types are: {', '.join(sorted(ALLOWED_MIME_TYPES))}",
        )

    # Read bytes with size verification
    contents = await file.read()
    if not contents or len(contents) == 0:
        logger.warning("Upload validation failed: Empty file received.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded image file is empty.",
        )

    if len(contents) > settings.max_upload_size_bytes:
        logger.warning(
            "Upload validation failed: File size %d bytes exceeds max %d bytes.",
            len(contents),
            settings.max_upload_size_bytes,
        )
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image size exceeds the maximum limit of {settings.MAX_UPLOAD_SIZE_MB}MB.",
        )

    # Decode bytes using OpenCV
    try:
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception as exc:
        logger.error("Failed to decode image buffer: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not decode image file. File may be corrupted or invalid.",
        )

    if image is None:
        logger.warning("OpenCV imdecode returned None for file '%s'.", file.filename)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format or corrupted image payload.",
        )

    height, width = image.shape[:2]

    # Validate reasonable dimensions
    if height < MIN_DIMENSION or width < MIN_DIMENSION:
        logger.warning("Image dimensions too small: %dx%d", width, height)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image dimensions ({width}x{height}) are too small. Minimum dimension is {MIN_DIMENSION}px.",
        )

    if height > MAX_DIMENSION or width > MAX_DIMENSION:
        logger.warning("Image dimensions exceed maximum: %dx%d", width, height)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image dimensions ({width}x{height}) exceed maximum allowed size ({MAX_DIMENSION}px).",
        )

    return image, width, height


def draw_detections(image: np.ndarray, detections: List[Detection]) -> np.ndarray:
    """
    Draw actual bounding boxes, class names, and confidence scores onto an image.
    Uses clean CV styling with high-contrast labels.
    """
    annotated = image.copy()

    # Palette for class coloring (BGR)
    colors = [
        (34, 197, 94),   # Green
        (234, 179, 8),   # Amber
        (239, 68, 68),   # Red
        (59, 130, 246),  # Blue
        (168, 85, 247),  # Purple
        (236, 72, 153),  # Pink
        (20, 184, 166),  # Teal
    ]

    for det in detections:
        color = colors[det.class_id % len(colors)]
        x1 = int(round(det.bounding_box.x1))
        y1 = int(round(det.bounding_box.y1))
        x2 = int(round(det.bounding_box.x2))
        y2 = int(round(det.bounding_box.y2))

        # Draw bounding box
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

        # Label text
        label = f"{det.class_name} {det.confidence:.2f}"
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.5
        font_thickness = 1
        (label_w, label_h), baseline = cv2.getTextSize(label, font, font_scale, font_thickness)

        # Label background rectangle
        bg_y1 = max(0, y1 - label_h - baseline - 4)
        bg_y2 = y1
        cv2.rectangle(annotated, (x1, bg_y1), (x1 + label_w + 4, bg_y2), color, -1)

        # Label text in dark or light contrast
        text_y = y1 - baseline - 2 if y1 - label_h - baseline - 4 >= 0 else y1 + label_h + 2
        cv2.putText(annotated, label, (x1 + 2, text_y), font, font_scale, (10, 15, 30), font_thickness, cv2.LINE_AA)

    return annotated


def encode_image(image: np.ndarray, ext: str = ".jpg") -> bytes:
    """Encode OpenCV BGR image array into encoded image bytes."""
    success, encoded = cv2.imencode(ext, image)
    if not success:
        raise ValueError(f"Failed to encode image to format {ext}")
    return encoded.tobytes()
