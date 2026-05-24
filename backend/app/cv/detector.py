"""
Animal state detector — WebSocket endpoint.

Accepts base64-encoded JPEG frames from the frontend, runs YOLOv8-pose
inference, and returns the detected dog state back over the same socket.

Place your trained weights at: backend/app/cv/dog_pose.pt
If the file is missing, the module returns state="unknown" for all requests.

States:
  lying   — питомец лежит      (YOLO class 0: Lie-Down)
  sitting — питомец сидит      (YOLO class 1: SIT)
  standing— питомец стоит      (YOLO class 2: Stand-UP)
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
        logger.warning("YOLOv8 weights not found at %s — using heuristic fallback", WEIGHTS_PATH)
        return None
    try:
        from ultralytics import YOLO
        _model = YOLO(str(WEIGHTS_PATH))
        logger.info("YOLOv8 model loaded from %s", WEIGHTS_PATH)
        return _model
    except Exception as exc:
        logger.error("Failed to load YOLO model: %s", exc)
        return None


# ─── YOLO class → state mapping ───────────────────────────────────────────────

_CLASS_STATE = {
    0: ("lying",    "Лежит"),
    1: ("sitting",  "Сидит"),
    2: ("standing", "Стоит"),
}

# ─── Keypoint-based pose classifier (from Colab) ─────────────────────────────

def _get_angle(p1, p2, p3):
    if any(p is None for p in [p1, p2, p3]):
        return None
    v1 = np.array(p1) - np.array(p2)
    v2 = np.array(p3) - np.array(p2)
    cos_a = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
    return float(np.degrees(np.arccos(np.clip(cos_a, -1, 1))))


def _classify_by_keypoints(kps, conf_threshold: float = 0.3):
    """
    Refines YOLO class using keypoint geometry.
    Returns (state, confidence).
    kps: np.ndarray of shape (N, 3) — x, y, visibility
    """
    def get_kp(idx):
        if idx < len(kps) and kps[idx][2] > conf_threshold:
            return (float(kps[idx][0]), float(kps[idx][1]))
        return None

    # 24-keypoint layout from Colab
    # 0=nose, 5=throat, 6=tail_base, 7=l_shoulder, 8=l_elbow, 9=l_wrist
    # 10=r_shoulder, 11=r_elbow, 12=r_wrist, 13=l_hip, 14=l_knee, 15=l_ankle
    # 16=r_hip, 17=r_knee, 18=r_ankle

    l_shoulder = get_kp(7)
    r_shoulder = get_kp(10)
    l_hip      = get_kp(13)
    r_hip      = get_kp(16)
    l_knee     = get_kp(14)
    r_knee     = get_kp(17)
    l_ankle    = get_kp(15)
    r_ankle    = get_kp(18)
    l_elbow    = get_kp(8)
    nose       = get_kp(0)

    shoulder_y = l_shoulder[1] if l_shoulder else (r_shoulder[1] if r_shoulder else None)
    hip_y      = l_hip[1]      if l_hip      else (r_hip[1]      if r_hip      else None)

    # Horizontal body → lying
    if shoulder_y and hip_y and abs(shoulder_y - hip_y) < 30:
        return "lying", 0.88

    # Bent rear legs + straight front → sitting
    back_angle  = _get_angle(l_hip, l_knee, l_ankle)
    front_angle = _get_angle(l_shoulder, l_elbow, get_kp(9))
    if back_angle and 60 < back_angle < 120:
        if front_angle is None or front_angle > 140:
            return "sitting", 0.82

    # Wide leg spread + nose above knees → moving/running
    if l_ankle and r_ankle and l_knee and r_knee and nose:
        leg_spread = abs(l_ankle[0] - r_ankle[0])
        knee_y_avg = (l_knee[1] + r_knee[1]) / 2
        if leg_spread > 80 and nose[1] < knee_y_avg:
            return "moving", 0.75

    return "standing", 0.72


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

        # Pick box with highest confidence among valid classes
        best_conf, best_cls, best_kps = 0.0, None, None
        has_keypoints = result.keypoints is not None

        for i, box in enumerate(result.boxes):
            cls  = int(box.cls[0])
            conf = float(box.conf[0])
            if cls in _CLASS_STATE and conf > best_conf:
                best_conf = conf
                best_cls  = cls
                if has_keypoints:
                    best_kps = result.keypoints.data.cpu().numpy()[i]

        if best_cls is None:
            return {"state": "unknown", "confidence": 0.0, "label": "Не определено"}

        # Refine with keypoints if available
        if best_kps is not None and len(best_kps) >= 17:
            state, confidence = _classify_by_keypoints(best_kps)
        else:
            state, _ = _CLASS_STATE[best_cls]
            confidence = best_conf

        label = {"lying": "Лежит", "sitting": "Сидит", "standing": "Стоит",
                 "moving": "Активен", "unknown": "Не определено"}.get(state, "Не определено")

        return {"state": state, "confidence": round(confidence, 2), "label": label}

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
    # Pre-load model on first connection
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
