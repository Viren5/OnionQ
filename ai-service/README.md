# OnionQ AI Computer Vision Service

The `ai-service` is the dedicated, production-oriented Computer Vision microservice for the **OnionQ** platform (developed for the Smart India Hackathon). It accepts real onion sample images from the Node.js backend, performs image validation and OpenCV decoding, runs inference using an actual **Ultralytics YOLO** object detection model, and returns genuine detections (bounding boxes, class labels, and confidence scores).

> **IMPORTANT**: This service adheres strictly to the rule of **zero fake/mock AI predictions**. It does not generate synthetic bounding boxes or invent defect classes. If a trained model is not provided, the service clearly reports model unavailability via `/health` and returns `503 Service Unavailable` on `/api/v1/analyze`.

---

## Current Project & Development Status

| Component | Status | Details |
|---|---|---|
| **AI Service API** | **READY** | FastAPI architecture, OpenCV decoding, validation, inference lifecycle complete. |
| **Trained OnionQ Model** | **NOT AVAILABLE** | No weights exist yet at `models/onion_best.pt`. Zero mock models used. |
| **Dataset** | **NOT AVAILABLE YET** | Directory structure initialized (`images/` and `labels/` with train/val/test splits). Awaiting collection & annotation. |
| **Training Pipeline** | **NOT STARTED** | Training scripts prepared in `training/train.py`. Training will start once real images are collected and classes finalized. |

> **Next Step**: Collect genuine onion photographs across target varieties and defects, annotate bounding boxes in YOLO format, finalize classes in `dataset/data.yaml`, and execute `training/train.py`.

---

## 1. Directory Structure

```text
ai-service/
├── app/
│   ├── __init__.py           # Package marker
│   ├── main.py               # FastAPI application entrypoint and lifespan hooks
│   ├── config.py             # Pydantic environment configuration
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py         # /health and /api/v1/analyze endpoints
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py        # Pydantic request/response schemas
│   ├── services/
│   │   ├── __init__.py
│   │   └── yolo_service.py   # YOLO model lifecycle, loading, and inference logic
│   └── utils/
│       ├── __init__.py
│       └── image_utils.py    # OpenCV decoding, MIME validation, bounding box renderer
├── dataset/
│   ├── data.yaml             # Ultralytics dataset configuration (classes TO_BE_DEFINED)
│   ├── README.md             # Dataset collection & annotation specification
│   ├── images/
│   │   ├── train/            # Genuine training onion images (.gitkeep)
│   │   ├── val/              # Genuine validation onion images (.gitkeep)
│   │   └── test/             # Genuine test onion images (.gitkeep)
│   └── labels/
│       ├── train/            # YOLO format label files (.txt) (.gitkeep)
│       ├── val/              # YOLO format label files (.txt) (.gitkeep)
│       └── test/             # YOLO format label files (.txt) (.gitkeep)
├── models/
│   └── .gitkeep              # Target directory for trained weights (models/onion_best.pt)
├── training/
│   ├── __init__.py
│   ├── train.py              # Ultralytics YOLO training script (with prerequisite guards)
│   └── validate.py           # Model validation & benchmark evaluation script
├── tests/
│   ├── __init__.py
│   ├── test_health.py        # Health endpoint tests
│   └── test_analyze.py       # Validation and missing-model error handling tests
├── requirements.txt          # Python dependencies
├── Dockerfile                # Production Docker container definition
├── .dockerignore             # Docker build ignores
├── .env.example              # Sample environment configuration
└── README.md                 # Documentation
```

---

## 2. Model Placement

Place your genuine trained OnionQ YOLO weights inside the `models/` directory:

```bash
ai-service/models/onion_best.pt
```

### Critical Notice on Weights:
* The weights file **must be a genuine trained OnionQ model**.
* **Do NOT** place arbitrary pre-trained models (such as generic COCO `yolov8n.pt`) and label them as an onion model.
* The service dynamically uses the exact class names embedded within the loaded model (e.g., `["onion", "sprouting", "black_mold", ...]` if trained on those classes). It does not invent or assume defect categories.
* If `models/onion_best.pt` does not exist, the service will start normally, `/health` will report `"model_loaded": false`, and `/api/v1/analyze` will return a clear `503 Service Unavailable` error explaining that model weights must be supplied.

---

## 3. Environment Variables

Configure via a `.env` file in `ai-service/` or via container environment variables:

| Variable | Default | Description |
|---|---|---|
| `YOLO_MODEL_PATH` | `models/onion_best.pt` | Relative or absolute path to trained YOLO `.pt` weights |
| `YOLO_CONFIDENCE_THRESHOLD` | `0.25` | Minimum confidence score threshold for detections (0.0 to 1.0) |
| `YOLO_IMAGE_SIZE` | `640` | YOLO image input dimension (e.g. 640) |
| `YOLO_DEVICE` | `cpu` | Inference target device: `cpu` or `cuda` |
| `HOST` | `0.0.0.0` | Bind host address for Uvicorn |
| `PORT` | `8000` | Bind port for Uvicorn |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3001` | Comma-separated list of allowed CORS origins or `*` |
| `MAX_UPLOAD_SIZE_MB` | `15` | Maximum allowed image upload size in megabytes |

---

## 4. Setup & Local Execution

### Prerequisites
* Python 3.11+ (recommended: Python 3.11 or 3.12 in a virtual environment)
* Optional: NVIDIA GPU with CUDA 11.8+ / 12.1+ for hardware acceleration

### Step 1: Create Virtual Environment
From inside the `ai-service` directory:

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### Step 2: Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

> **GPU Installation Note**: To enable CUDA hardware acceleration with PyTorch, install the CUDA-enabled PyTorch build before installing requirements:
> ```bash
> pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
> pip install -r requirements.txt
> ```

### Step 3: Configure Environment
```bash
cp .env.example .env
```

### Step 4: Run the Service
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive OpenAPI documentation is available at:
* Swagger UI: `http://localhost:8000/docs`
* ReDoc: `http://localhost:8000/redoc`

---

## 5. Dataset Preparation & Training Workflow

### 1. Collect & Annotate Real Onion Images
Follow the detailed specification in [dataset/README.md](file:///d:/OnionQ/ai-service/dataset/README.md).
1. Add genuine images to `dataset/images/train/`, `dataset/images/val/`, and `dataset/images/test/`.
2. Add matching YOLO-format `.txt` label files to `dataset/labels/train/`, `dataset/labels/val/`, and `dataset/labels/test/`.
3. Update [dataset/data.yaml](file:///d:/OnionQ/ai-service/dataset/data.yaml) with the final class ontology (replacing the `TO_BE_DEFINED` placeholder).

### 2. Run Training
Once genuine data is placed, launch training using the prepared training script:
```bash
python training/train.py --model yolov8n.pt --epochs 100 --imgsz 640 --batch 16 --device cpu
```
*(The script refuses to execute if `data.yaml` contains `TO_BE_DEFINED` placeholders or if image directories are empty).*

### 3. Evaluate Model
```bash
python training/validate.py --model runs/train/onionq_model/weights/best.pt --split val
```

### 4. Deploy Weights
Copy the verified best weights to the serving path:
```bash
cp runs/train/onionq_model/weights/best.pt models/onion_best.pt
```

---

## 6. Docker Deployment

The provided [Dockerfile](file:///d:/OnionQ/ai-service/Dockerfile) builds a lean, containerized Python 3.11 runtime equipped with system libraries for OpenCV (`libgl1`, `libglib2.0-0`).

### Build Container
```bash
docker build -t onionq-ai-service .
```

### Run Container (CPU Mode)
Mount your local `models/` directory into the container volume:
```bash
docker run -d \
  --name onionq-ai \
  -p 8000:8000 \
  -v $(pwd)/models:/app/models \
  -e YOLO_MODEL_PATH=/app/models/onion_best.pt \
  -e YOLO_DEVICE=cpu \
  onionq-ai-service
```

---

## 7. API Reference

### `GET /health`
Returns actual service health and confirms whether the model weights are loaded.

**Response Example (Model Unloaded):**
```json
{
  "status": "ok",
  "service": "onionq-ai",
  "model_loaded": false,
  "model_path": "models/onion_best.pt",
  "device": "cpu",
  "available_classes": null
}
```

---

### `POST /api/v1/analyze`
Accepts an actual image via `multipart/form-data`, validates and decodes the image, runs real YOLO inference, and returns genuine detection data.

**Example `curl` Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/onion_sample.jpg"
```

**Response (Model Not Found - HTTP 503):**
```json
{
  "detail": "Trained OnionQ model is not available. Ensure trained YOLO weights exist at YOLO_MODEL_PATH (configured: 'models/onion_best.pt'). Details: Trained model file not found at '.../models/onion_best.pt'."
}
```

---

### `POST /api/v1/analyze/annotated`
Runs real YOLO inference and returns the annotated JPEG image with genuine bounding boxes and confidence labels drawn directly on the image bytes.

---

## 8. Running Unit Tests
Once testing dependencies (`pytest`, `httpx`) are installed in your virtual environment:

```bash
pytest tests/ -v
```
*(All tests in `tests/` run against genuine image validation routines and verify that missing models return 503 rather than mock results).*
