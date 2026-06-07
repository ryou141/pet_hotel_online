"""
Animal state detector — WebSocket endpoint.

Accepts base64-encoded JPEG frames from the frontend, runs YOLO26-pose
inference, and returns the detected dog state back over the same socket.

Place your trained weights at: backend/app/cv/dog_pose.pt
If the file is missing, the module returns state="unknown" for all requests.

States:
  lying   — питомец лежит      (YOLO class: Lie-Down)
  sitting — питомец сидит      (YOLO class: SIT)
  standing— питомец стоит      (YOLO class: Stand-UP)
  moving  — питомец активен    (определяется по скелету)
  unknown — не удалось определить
"""

import base64
import json
import logging
import os
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()
logger = logging.getLogger("cv.detector")

# ─── Model loading ────────────────────────────────────────────────────────────

WEIGHTS_PATH = Path(__file__).parent / "dog_pose.pt"
_model = None


def _load_model():
    global _model
    if _model is not None:
        return _model
    if not WEIGHTS_PATH.exists():
        logger.warning("YOLO weights not found at %s — returning unknown for all requests", WEIGHTS_PATH)
        return None
    try:
        from ultralytics import YOLO
        _model = YOLO(str(WEIGHTS_PATH))
        logger.info("YOLO model loaded from %s", WEIGHTS_PATH)
        return _model
    except Exception as exc:
        logger.error("Failed to load YOLO model: %s", exc)
        return None


# ─── Class name → state mapping ───────────────────────────────────────────────

_NAME_STATE = {
    "lie-down": ("lying",    "Лежит"),
    "sit":      ("sitting",  "Сидит"),
    "stand-up": ("standing", "Стоит"),
}


# ─── Frame helpers ────────────────────────────────────────────────────────────

def _decode_frame(b64_data: str) -> Optional[np.ndarray]:
    try:
        if "," in b64_data:
            b64_data = b64_data.split(",", 1)[1]
        raw = base64.b64decode(b64_data)
        arr = np.frombuffer(raw, dtype=np.uint8)
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)
    except Exception as exc:
        logger.warning("Frame decode error: %s", exc)
        return None


# ─── Inference ────────────────────────────────────────────────────────────────

def _run_yolo(frame: np.ndarray) -> dict:
    model = _load_model()
    if model is None:
        return {"state": "unknown", "confidence": 0.0, "label": "Модель недоступна"}

    try:
        results = model(frame, conf=0.4, iou=0.45, verbose=False)
        result = results[0]

        if result.boxes is None or len(result.boxes) == 0:
            return {"state": "unknown", "confidence": 0.0, "label": "Не определено"}

        # Pick detection with highest confidence
        best_conf, best_state, best_label = 0.0, None, None
        for box in result.boxes:
            conf = float(box.conf[0])
            cls  = int(box.cls[0])
            class_name = model.names.get(cls, "").lower()
            if conf > best_conf and class_name in _NAME_STATE:
                best_conf  = conf
                best_state, best_label = _NAME_STATE[class_name]

        if best_state is None:
            return {"state": "unknown", "confidence": 0.0, "label": "Не определено"}

        return {"state": best_state, "confidence": round(best_conf, 2), "label": best_label}

    except Exception as exc:
        logger.error("YOLO inference error: %s", exc)
        return {"state": "unknown", "confidence": 0.0, "label": "Ошибка инференса"}


# ─── WebSocket endpoint ───────────────────────────────────────────────────────

@router.websocket("/ws/detect")
async def detect_animal_state(websocket: WebSocket):
    """
    Client sends JSON: {"frame": "<base64 JPEG>", "pet_id": 42}
    Server responds:   {"pet_id": 42, "state": "lying", "confidence": 0.87, "label": "Лежит"}
    """
    await websocket.accept()
    logger.info("CV WebSocket connected")
    _load_model()

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid JSON"})
                continue

            b64    = payload.get("frame")
            pet_id = payload.get("pet_id")

            if not b64:
                await websocket.send_json({"error": "No frame provided"})
                continue

            frame = _decode_frame(b64)
            if frame is None:
                await websocket.send_json({"pet_id": pet_id, "state": "unknown",
                                           "confidence": 0.0, "label": "Ошибка кадра"})
                continue

            result = _run_yolo(frame)
            result["pet_id"] = pet_id
            await websocket.send_json(result)

    except WebSocketDisconnect:
        logger.info("CV WebSocket disconnected")
    except Exception as exc:
        logger.error("CV WebSocket error: %s", exc)
        await websocket.close()
