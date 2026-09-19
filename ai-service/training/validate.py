#!/usr/bin/env python3
"""
OnionQ Model Validation & Evaluation Script
===========================================
Evaluates a genuine trained OnionQ YOLO model on the validation or test split.

Safety Guardrails:
- Refuses to run if the specified model weights file does not exist.
- Does not generate simulated or fabricated metrics.
- Only computes authentic evaluation metrics (mAP50, mAP50-95, precision, recall)
  directly produced by Ultralytics validation routines.
"""

import argparse
import logging
import os
import sys
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [onionq-val]: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("onionq-val")


def parse_arguments() -> argparse.Namespace:
    """Parse validation arguments."""
    parser = argparse.ArgumentParser(
        description="Evaluate a genuine trained OnionQ YOLO model on validation or test sets."
    )
    parser.add_argument(
        "--model",
        type=str,
        default=os.getenv("YOLO_MODEL_PATH", "models/onion_best.pt"),
        help="Path to trained model weights (default: models/onion_best.pt)",
    )
    parser.add_argument(
        "--data",
        type=str,
        default=os.getenv("YOLO_DATA_YAML", "dataset/data.yaml"),
        help="Path to dataset configuration YAML (default: dataset/data.yaml)",
    )
    parser.add_argument(
        "--split",
        type=str,
        default="val",
        choices=["val", "test"],
        help="Dataset split to evaluate on: 'val' or 'test' (default: val)",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=int(os.getenv("YOLO_IMAGE_SIZE", "640")),
        help="Image size for evaluation (default: 640)",
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
        help="Computation device: 'cpu', 'cuda', etc. (default: cpu)",
    )
    return parser.parse_args()


def main() -> None:
    """Run model validation."""
    args = parse_arguments()
    model_path = Path(args.model).resolve()
    data_path = Path(args.data).resolve()

    logger.info("Starting OnionQ model validation checks...")
    logger.info("Target model:   %s", model_path)
    logger.info("Dataset config: %s", data_path)
    logger.info("Split:          %s", args.split)
    logger.info("Device:         %s", args.device)

    # 1. Verify that trained weights exist
    if not model_path.exists() or not model_path.is_file():
        logger.error(
            "Evaluation blocked: Trained model weights not found at '%s'.\n"
            "Real evaluation cannot be performed until a genuine OnionQ model is trained and saved.",
            model_path,
        )
        sys.exit(1)

    # 2. Verify dataset config
    if not data_path.exists():
        logger.error("Evaluation blocked: Dataset config not found at '%s'.", data_path)
        sys.exit(1)

    # 3. Import Ultralytics
    try:
        from ultralytics import YOLO
    except ImportError:
        logger.error(
            "Ultralytics is not installed in the current environment.\n"
            "Please activate your Python 3.11/3.12 virtual environment and install requirements."
        )
        sys.exit(1)

    logger.info("Loading trained OnionQ model: %s", model_path)
    model = YOLO(str(model_path))

    logger.info("Executing evaluation on split '%s'...", args.split)
    metrics = model.val(
        data=str(data_path),
        split=args.split,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        plots=True,
    )

    # Report authentic metrics directly from Ultralytics
    logger.info("Evaluation Complete. Authentic Metrics:")
    logger.info("  mAP50:    %.4f", metrics.box.map50)
    logger.info("  mAP50-95: %.4f", metrics.box.map)
    logger.info("  Precision: %.4f", metrics.box.mp)
    logger.info("  Recall:    %.4f", metrics.box.mr)


if __name__ == "__main__":
    main()
