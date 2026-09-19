import logging
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import numpy as np

from app.config import settings
from app.models.schemas import BoundingBox, Detection

logger = logging.getLogger("onionq-ai.service")


class YOLOService:
    """
    Manages the lifecycle, loading, and inference of the YOLO detection model.
    Never generates synthetic, mock, or hardcoded predictions.
    """

    def __init__(self) -> None:
        self._model = None
        self._model_loaded: bool = False
        self._model_path: str = settings.YOLO_MODEL_PATH
        self._classes: Dict[int, str] = {}
        self._load_error: Optional[str] = None
        self._device: str = settings.YOLO_DEVICE

    @property
    def is_loaded(self) -> bool:
        """Check whether a real trained model is actively loaded in memory."""
        return self._model_loaded and self._model is not None

    @property
    def load_error(self) -> Optional[str]:
        """Return the error message encountered during model loading, if any."""
        return self._load_error

    @property
    def available_classes(self) -> List[str]:
        """Return the dynamic class names defined in the model, or empty list if unloaded."""
        if isinstance(self._classes, dict):
            return list(self._classes.values())
        if isinstance(self._classes, (list, tuple)):
            return list(self._classes)
        return []

    def get_status(self) -> dict:
        """Return comprehensive status of the model loader."""
        resolved = settings.resolved_model_path
        return {
            "model_loaded": self.is_loaded,
            "configured_path": self._model_path,
            "resolved_path": str(resolved),
            "file_exists": resolved.exists() and resolved.is_file(),
            "device": self._device,
            "available_classes": self.available_classes if self.is_loaded else [],
            "error": self._load_error,
        }

    def load_model(self) -> bool:
        """
        Attempt to load the YOLO model weights from YOLO_MODEL_PATH.
        If the file does not exist, the service remains operational with model_loaded=False.
        """
        resolved_path = settings.resolved_model_path

        if not resolved_path.exists() or not resolved_path.is_file():
            self._model_loaded = False
            self._model = None
            self._classes = {}
            self._load_error = (
                f"Trained model file not found at '{resolved_path}'. "
                f"Please provide the trained OnionQ YOLO weights file at {self._model_path}."
            )
            logger.warning("YOLO model not loaded: %s", self._load_error)
            return False

        logger.info("Loading YOLO model from %s on device '%s'...", resolved_path, self._device)
        try:
            from ultralytics import YOLO

            # Load actual YOLO model
            model = YOLO(str(resolved_path))

            # Retrieve class mapping directly from the loaded model
            classes = getattr(model, "names", {})
            if not classes and hasattr(model, "model") and hasattr(model.model, "names"):
                classes = model.model.names

            self._model = model
            self._classes = classes or {}
            self._model_loaded = True
            self._load_error = None

            logger.info(
                "YOLO model successfully loaded. Classes detected (%d): %s",
                len(self._classes),
                self.available_classes,
            )
            return True

        except Exception as exc:
            self._model_loaded = False
            self._model = None
            self._classes = {}
            self._load_error = f"Failed to load YOLO model: {str(exc)}"
            logger.error("Exception loading YOLO model from %s: %s", resolved_path, exc, exc_info=True)
            return False

    def run_inference(self, image_bgr: np.ndarray) -> Tuple[List[Detection], float]:
        """
        Run real YOLO object detection on the provided OpenCV BGR image.

        Args:
            image_bgr: Decoded numpy array representing the input image in BGR format.

        Returns:
            Tuple of (detections_list, inference_duration_ms).

        Raises:
            RuntimeError: If model is not loaded or inference fails.
        """
        if not self.is_loaded:
            raise RuntimeError(
                self._load_error
                or "Trained OnionQ model is not available. Please ensure trained YOLO weights exist at YOLO_MODEL_PATH."
            )

        logger.info("Starting inference on image with shape %s...", image_bgr.shape)
        start_time = time.perf_counter()

        try:
            # Perform inference using configured confidence, image size, and device
            results = self._model.predict(
                source=image_bgr,
                conf=settings.YOLO_CONFIDENCE_THRESHOLD,
                imgsz=settings.YOLO_IMAGE_SIZE,
                device=settings.YOLO_DEVICE,
                verbose=False,
            )
        except Exception as exc:
            logger.error("YOLO inference failed: %s", exc, exc_info=True)
            raise RuntimeError(f"YOLO inference execution failed: {str(exc)}") from exc

        inference_time_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        detections: List[Detection] = []
        detection_idx = 1

        for result in results:
            boxes = getattr(result, "boxes", None)
            if boxes is None or len(boxes) == 0:
                continue

            names = getattr(result, "names", self._classes)

            for box in boxes:
                # Extract coordinates [x1, y1, x2, y2]
                xyxy = box.xyxy[0].tolist()
                cls_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())

                # Dynamically determine class name from model dictionary
                if isinstance(names, dict):
                    class_name = names.get(cls_id, f"class_{cls_id}")
                elif isinstance(names, (list, tuple)) and 0 <= cls_id < len(names):
                    class_name = names[cls_id]
                else:
                    class_name = f"class_{cls_id}"

                detections.append(
                    Detection(
                        detection_id=detection_idx,
                        class_id=cls_id,
                        class_name=class_name,
                        confidence=round(confidence, 4),
                        bounding_box=BoundingBox(
                            x1=round(float(xyxy[0]), 2),
                            y1=round(float(xyxy[1]), 2),
                            x2=round(float(xyxy[2]), 2),
                            y2=round(float(xyxy[3]), 2),
                        ),
                    )
                )
                detection_idx += 1

        logger.info(
            "Inference completed in %.2f ms. Detections found: %d",
            inference_time_ms,
            len(detections),
        )

        return detections, inference_time_ms


# Global singleton instance
yolo_service = YOLOService()
