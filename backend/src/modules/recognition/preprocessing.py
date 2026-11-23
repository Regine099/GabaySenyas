"""Landmark preprocessing for the recognition model.

This is the ONE implementation shared by training (ml/), reference recording,
and backend inference. ml/ imports it; never copy it (docs/DEVELOPMENT_RULES.md §4).
Any change here must bump PREPROCESSING_VERSION and requires re-training.

Input: a landmark sequence (docs/TECHNICAL_ARCHITECTURE.md §5):

    {
      "frame_size": {"width": 640, "height": 480},   # optional, see below
      "frames": [{"t_ms": 0, "hands": [{"handedness": "right",
                                        "landmarks": [{"x":..,"y":..,"z":..} x 21]}],
                  "pose": [...]}]
    }

MediaPipe normalizes x by the image width and y by the image height. When
"frame_size" is given, x and z are rescaled so all axes share one unit;
without it the frame is assumed square.

Version 1 features (alphabet / fingerspelling, one dominant hand), per frame:
    63  hand shape: 21 landmarks relative to the wrist, divided by palm size
    15  finger joint angles (3 per finger), divided by pi
     9  velocity of wrist, index tip, pinky tip (palm units per sequence)
    --
    87  = FEAT

Only hand landmarks are used, so cropped hand images and webcam recordings
produce the same features. Pose (shoulders/elbows) is for scoring/feedback,
not recognition.
"""
from __future__ import annotations

import numpy as np

PREPROCESSING_VERSION = "1"

T = 32  # fixed sequence length fed to the classifier
N_LANDMARKS = 21

WRIST = 0
MIDDLE_MCP = 9
INDEX_TIP = 8
PINKY_TIP = 20
FINGER_CHAINS = (
    (0, 1, 2, 3, 4),      # thumb
    (0, 5, 6, 7, 8),      # index
    (0, 9, 10, 11, 12),   # middle
    (0, 13, 14, 15, 16),  # ring
    (0, 17, 18, 19, 20),  # pinky
)
VELOCITY_POINTS = (WRIST, INDEX_TIP, PINKY_TIP)  # J traces with the pinky, Z with the index

N_SHAPE = N_LANDMARKS * 3
N_ANGLES = len(FINGER_CHAINS) * 3
N_VELOCITY = len(VELOCITY_POINTS) * 3
FEAT = N_SHAPE + N_ANGLES + N_VELOCITY  # 87

_EPS = 1e-6


class NoHandsDetected(ValueError):
    """No frame of the sequence contains a usable hand."""


def _aspect(seq: dict) -> float:
    size = seq.get("frame_size") or {}
    try:
        w, h = float(size.get("width", 1)), float(size.get("height", 1))
    except (TypeError, ValueError):
        return 1.0
    return w / h if w > 0 and h > 0 else 1.0


def extract_hand_track(seq: dict) -> np.ndarray:
    """Return the dominant hand per frame as (frames, 21, 3); NaN where no hand.

    The dominant hand is the largest one in the frame (one-handed letters).
    """
    frames = seq.get("frames")
    if not isinstance(frames, list):
        raise ValueError("sequence must contain a 'frames' list")
    sx = _aspect(seq)
    track = np.full((len(frames), N_LANDMARKS, 3), np.nan)
    for i, frame in enumerate(frames):
        best, best_area = None, -1.0
        for hand in (frame or {}).get("hands") or []:
            pts = hand.get("landmarks") or []
            if len(pts) != N_LANDMARKS:
                continue
            try:
                a = np.array(
                    [[p["x"] * sx, p["y"], p.get("z", 0.0) * sx] for p in pts], dtype=float
                )
            except (KeyError, TypeError):
                continue
            if not np.all(np.isfinite(a)):
                continue
            area = float(np.ptp(a[:, 0]) * np.ptp(a[:, 1]))
            if area > best_area:
                best, best_area = a, area
        if best is not None:
            track[i] = best
    return track


def clean_track(track: np.ndarray) -> np.ndarray:
    """Trim leading/trailing frames without a hand and interpolate interior gaps."""
    present = ~np.isnan(track).any(axis=(1, 2))
    if not present.any():
        raise NoHandsDetected("no hand detected in any frame")
    idx = np.flatnonzero(present)
    track = track[idx[0] : idx[-1] + 1].copy()
    present = present[idx[0] : idx[-1] + 1]
    if not present.all():
        x = np.arange(len(track))
        good = np.flatnonzero(present)
        flat = track.reshape(len(track), -1)
        for j in range(flat.shape[1]):
            flat[~present, j] = np.interp(x[~present], good, flat[good, j])
        track = flat.reshape(track.shape)
    return track


def resample(track: np.ndarray, n: int = T) -> np.ndarray:
    """Linearly resample a (frames, 21, 3) track to n frames."""
    f = len(track)
    if f == 0:
        raise NoHandsDetected("empty track")
    if f == 1:
        return np.repeat(track, n, axis=0)
    src = np.linspace(0.0, f - 1, n)
    i0 = np.floor(src).astype(int)
    i1 = np.minimum(i0 + 1, f - 1)
    w = (src - i0)[:, None, None]
    return track[i0] * (1.0 - w) + track[i1] * w


def _joint_angles(track: np.ndarray) -> np.ndarray:
    out = []
    for chain in FINGER_CHAINS:
        for k in range(1, 4):
            a = track[:, chain[k - 1]] - track[:, chain[k]]
            b = track[:, chain[k + 1]] - track[:, chain[k]]
            cos = (a * b).sum(axis=1) / (
                np.linalg.norm(a, axis=1) * np.linalg.norm(b, axis=1) + _EPS
            )
            out.append(np.arccos(np.clip(cos, -1.0, 1.0)) / np.pi)
    return np.stack(out, axis=1)


def features(track: np.ndarray) -> np.ndarray:
    """Per-frame feature matrix (frames, FEAT) from a clean, resampled track."""
    n = len(track)
    palm = np.maximum(np.linalg.norm(track[:, MIDDLE_MCP] - track[:, WRIST], axis=1), _EPS)
    local = (track - track[:, WRIST : WRIST + 1]) / palm[:, None, None]
    shape = local.reshape(n, -1)
    angles = _joint_angles(local)  # on the normalized hand, so exactly scale-invariant
    pts = track[:, VELOCITY_POINTS]
    vel = np.zeros_like(pts)
    vel[1:] = np.diff(pts, axis=0)
    # Scale by n so the value means "palm lengths over the whole sign",
    # independent of the resampling length.
    vel = vel.reshape(n, -1) * n / float(palm.mean())
    return np.concatenate([shape, angles, vel], axis=1).astype(np.float32)


def preprocess_for_model(seq: dict, n: int = T) -> np.ndarray:
    """Sequence dict -> (n, FEAT) float32 classifier input."""
    return features(resample(clean_track(extract_hand_track(seq)), n))
