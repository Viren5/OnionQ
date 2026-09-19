"""
Tests for /api/v1/analyze endpoint validation and missing-model error handling.
These tests verify that genuine image validation and error reporting work correctly,
and confirm that no fake inference or detections are returned when a model is absent.
"""
import io
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _create_dummy_image_bytes(width: int = 100, height: int = 100) -> bytes:
    """Helper to create minimal valid JPEG bytes for testing without external assets."""
    import cv2
    import numpy as np

    img = np.zeros((height, width, 3), dtype=np.uint8)
    # Paint simple pattern
    img[:, :] = (120, 150, 180)
    success, encoded = cv2.imencode(".jpg", img)
    assert success, "Failed to create test image buffer"
    return encoded.tobytes()


def test_analyze_missing_file():
    """Verify that submitting a request without a file returns 422 Unprocessable Entity."""
    response = client.post("/api/v1/analyze")
    assert response.status_code == 422


def test_analyze_empty_file():
    """Verify that uploading an empty file returns 400 Bad Request."""
    files = {"file": ("empty.jpg", b"", "image/jpeg")}
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_analyze_unsupported_mime_type():
    """Verify that non-image MIME types are rejected with 400 Bad Request."""
    files = {"file": ("document.pdf", b"%PDF-1.4 test content", "application/pdf")}
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 400
    assert "unsupported" in response.json()["detail"].lower()


def test_analyze_corrupted_image():
    """Verify that corrupted image bytes fail OpenCV decoding with 400 Bad Request."""
    files = {"file": ("corrupted.jpg", b"NOT_AN_IMAGE_HEADER_12345", "image/jpeg")}
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 400
    assert "decode" in response.json()["detail"].lower() or "invalid" in response.json()["detail"].lower()


def test_analyze_missing_model_behavior():
    """
    Verify that when a valid image is provided but no trained model exists at YOLO_MODEL_PATH,
    the endpoint returns HTTP 503 and explicitly reports model unavailability.
    Crucially: It must NEVER return fake or synthetic detections.
    """
    try:
        image_bytes = _create_dummy_image_bytes(200, 200)
    except ImportError:
        pytest.skip("OpenCV or NumPy not available in current test environment.")

    files = {"file": ("sample.jpg", image_bytes, "image/jpeg")}
    response = client.post("/api/v1/analyze", files=files)

    # When no model is loaded, the endpoint must return 503 Service Unavailable
    assert response.status_code == 503
    data = response.json()
    assert "detail" in data
    assert "model is not available" in data["detail"].lower() or "not found" in data["detail"].lower()
    # Confirm no detection payload is returned
    assert "detections" not in data


def test_analyze_annotated_missing_model_behavior():
    """Verify that the annotated image endpoint also cleanly returns 503 when model is missing."""
    try:
        image_bytes = _create_dummy_image_bytes(200, 200)
    except ImportError:
        pytest.skip("OpenCV or NumPy not available in current test environment.")

    files = {"file": ("sample.jpg", image_bytes, "image/jpeg")}
    response = client.post("/api/v1/analyze/annotated", files=files)
    assert response.status_code == 503
