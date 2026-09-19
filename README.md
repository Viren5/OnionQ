# 🧅 OnionQ

## AI-Powered Onion Quality Assessment & Digital Inspection Platform

OnionQ is an AI-assisted onion quality assessment platform developed for **Smart India Hackathon 2026**. It uses computer vision to analyze onion images, detect visible quality conditions, store inspection results, and support human verification through a digital inspection workflow.

---

## 🎯 Problem Statement

**SIH Problem Statement ID:** SIH26031

Traditional onion quality assessment can be subjective and may vary between procurement centres and inspectors.

OnionQ aims to make the inspection process more consistent, traceable, and digital by using AI-assisted image analysis.

The platform is designed to:

- Analyze onion images using computer vision
- Detect visible onion conditions
- Identify individual onions in an image
- Store detection results
- Provide confidence scores and bounding boxes
- Support human verification
- Maintain digital inspection records
- Generate digital quality-report data

The system is designed to **assist human inspectors rather than replace human verification**.

---

## 🚀 Current MVP

The current MVP implements the following workflow:

```text
Capture / Upload Image
        ↓
Create Inspection
        ↓
Upload Onion Image
        ↓
AI Analysis
        ↓
YOLO Object Detection
        ↓
Store Individual Detections
        ↓
Display Results
        ↓
Human Verification

| Class      | Description                            |
| ---------- | -------------------------------------- |
| `healthy`  | Onion detected as healthy by the model |
| `mold`     | Visible mold condition detected        |
| `rotten`   | Visible rotting condition detected     |
| `sprouted` | Sprouting condition detected           |

Each detection can contain:

Onion sequence ID
Detection class
Confidence score
Bounding box
Verification status
Source inspection

AI Model

OnionQ currently uses a custom-trained YOLOv8n object detection model.

Model Details
Architecture: YOLOv8n
Task: Object Detection
Input Size: 640 × 640
Training Epochs: 50
Framework: Ultralytics YOLO

| Metric    | Result |
| --------- | -----: |
| Precision |  64.3% |
| Recall    |  49.1% |
| mAP@50    |  52.9% |
| mAP@50-95 |  40.1% |

🏗️ System Architecture

                    ┌─────────────────────┐
                    │      Frontend       │
                    │   React + Vite      │
                    │      :5173          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Backend        │
                    │ Node.js + Express   │
                    │      :3001          │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
        ┌─────────────────┐       ┌─────────────────┐
        │    MongoDB      │       │   AI Service    │
        │     Atlas       │       │ FastAPI + YOLO  │
        └─────────────────┘       │      :8001      │
                                  └────────┬────────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │ onion_best.pt   │
                                  │ YOLOv8 Model    │
                                  └─────────────────┘


🛠️ Technology Stack
Frontend
React
TypeScript
Vite
CSS
REST API

Backend
Node.js
Express.js
TypeScript
MongoDB
Mongoose
Axios
Multer

AI Service
Python
FastAPI
Ultralytics YOLO
PyTorch
OpenCV
NumPy

Database
MongoDB
MongoDB Atlas

Development Tools
Git
GitHub
VS Code
PowerShell

OnionQ/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   ├── package.json
│   └── ...
│
├── ai-service/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── services/
│   │   └── utils/
│   ├── models/
│   │   └── onion_best.pt
│   ├── tests/
│   ├── training/
│   ├── Dockerfile
│   └── requirements.txt
│
├── .gitignore
└── README.md

Local Development Setup
Prerequisites

Install the following:

Node.js
npm
Python 3.10+
MongoDB / MongoDB Atlas
Git
