#!/usr/bin/env python3
"""
OnionQ YOLO Training Script
==========================
Trains an Ultralytics YOLO model on the genuine OnionQ dataset once annotated images
are populated and real classes are finalized in data.yaml.

Safety Guardrails:
- Refuses to run if data.yaml still contains 'TO_BE_DEFINED' placeholders.
- Refuses to run if training image folders are empty.
- Never generates synthetic weights or fake metrics.
"""

import argparse
import logging
import os
import sys
from pathlib import Path

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [onionq-train]: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("onionq-train")

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def parse_arguments() -> argparse.Namespace:
    """Parse CLI arguments with environment variable fallbacks."""
    parser = argparse.ArgumentParser(
        description="Train Ultralytics YOLO model on genuine OnionQ dataset."
    )
    parser.add_argument(
        "--data",
        type=str,
        default=os.getenv("YOLO_DATA_YAML", "dataset/data.yaml"),
        help="Path to dataset configuration YAML (default: dataset/data.yaml)",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=os.getenv("YOLO_BASE_MODEL", "yolov8n.pt"),
        help="Base YOLO architecture or pretrained checkpoint to fine-tune (e.g. yolov8n.pt, yolov8s.pt)",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=int(os.getenv("YOLO_EPOCHS", "100")),
        help="Number of training epochs (default: 100)",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=int(os.getenv("YOLO_IMAGE_SIZE", "640")),
        help="Image size for training (default: 640)",
    )
    parser.add_argument(
        "--batch",
        type=int,
        default=int(os.getenv("YOLO_BATCH_SIZE", "16")),
        help="Batch size (default: 16)",
    )
    parser.add_argument(
        "--device",
        type=str,
        default=os.getenv("YOLO_DEVICE", "cpu"),
        help="Computation device: 'cpu', 'cuda', '0', '0,1', etc. (default: cpu)",
    )
    parser.add_argument(
        "--project",
        type=str,
        default=os.getenv("YOLO_PROJECT_DIR", "runs/train"),
        help="Directory to save training outputs (default: runs/train)",
    )
    parser.add_argument(
        "--name",
        type=str,
        default=os.getenv("YOLO_EXP_NAME", "onionq_model"),
        help="Experiment name (default: onionq_model)",
    )
    return parser.parse_args()


def validate_prerequisites(data_path: Path) -> None:
    """
    Verify that dataset configuration and genuine data files exist
    before initiating any training run.
    """
    if not data_path.exists():
        logger.error("Dataset config file not found: %s", data_path)
        sys.exit(1)

    # Read config to check for unresolved placeholders
    content = data_path.read_text(encoding="utf-8")
    if "TO_BE_DEFINED" in content:
        logger.error(
            "Training blocked: '%s' contains 'TO_BE_DEFINED' placeholders.\n"
            "Final class names must be explicitly decided from genuine annotations "
            "before training can begin.",
            data_path,
        )
        sys.exit(1)

    # Check for actual images in train split
    dataset_dir = data_path.parent
    train_images_dir = dataset_dir / "images" / "train"

    if not train_images_dir.exists():
        logger.error("Training images directory does not exist: %s", train_images_dir)
        sys.exit(1)

    image_files = [
        f for f in train_images_dir.iterdir()
        if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS
    ]

    if not image_files:
        logger.error(
            "Training blocked: No images found in '%s'.\n"
            "Please collect and populate real onion images and labels before training.",
            train_images_dir,
        )
        sys.exit(1)

    logger.info("Prerequisite checks passed. Found %d training images in '%s'.", len(image_files), train_images_dir)


def main() -> None:
    """Main training routine."""
    args = parse_arguments()
    data_path = Path(args.data).resolve()

    logger.info("Initializing OnionQ YOLO training preparation...")
    logger.info("Dataset config: %s", data_path)
    logger.info("Base model:     %s", args.model)
    logger.info("Epochs:         %d", args.epochs)
    logger.info("Image size:     %d", args.imgsz)
    logger.info("Batch size:     %d", args.batch)
    logger.info("Device:         %s", args.device)

    # Safety check
    validate_prerequisites(data_path)

    # Lazy import of ultralytics to avoid hard dependency at parse time
    try:
        from ultralytics import YOLO
    except ImportError:
        logger.error(
            "Ultralytics is not installed in the current environment.\n"
            "Please activate your Python 3.11/3.12 virtual environment and install requirements."
        )
        sys.exit(1)

    logger.info("Loading base YOLO model: %s", args.model)
    model = YOLO(args.model)

    logger.info("Starting model training on genuine dataset...")
    results = model.train(
        data=str(data_path),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        project=args.project,
        name=args.name,
        save=True,
        plots=True,
    )

    logger.info("Training complete.")
    logger.info("Outputs and evaluation metrics saved in: %s/%s", args.project, args.name)
    logger.info("Best model weights: %s/%s/weights/best.pt", args.project, args.name)


if __name__ == "__main__":
    main()
