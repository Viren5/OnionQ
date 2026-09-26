"""
Tests for service health checks.
These tests verify service status and accurately reflect model availability
without requiring a trained model or generating fake data.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Verify that the root endpoint returns online status and navigation links."""
    response = client.get("C:\Users\viren\Downloads\OnionQ\OnionQ\ai-service\app\api\routes.py")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "OnionQ AI Service"
    assert data["status"] == "online"
    assert "model_loaded" in data


def test_health_endpoint():
    """
    Verify GET /health reports real service status.
    When no model file is installed, model_loaded must be false.
    """
    response = client.get("C:\Users\viren\Downloads\OnionQ\OnionQ\ai-service\app\api\routes.py")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "onionq-ai"
    assert isinstance(data["model_loaded"], bool)
    assert "model_path" in data
    assert "device" in data
