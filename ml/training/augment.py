"""Landmark-level augmentation, applied to clean (frames, 21, 3) hand tracks.

Single-frame samples (from images) are expanded into synthetic "held still"
sequences, so static pictures and real webcam sequences train the same model.
"""
from __future__ import annotations

import numpy as np

from common import pp

EVAL_STATIC_FRAMES = 30


def _palm(track: np.ndarray) -> float:
    return float(np.linalg.norm(track[:, pp.MIDDLE_MCP] - track[:, pp.WRIST], axis=1).mean()) + 1e-6


def static_to_sequence(track: np.ndarray, rng: np.random.Generator | None) -> np.ndarray:
    """Repeat a single frame; with rng, add slow drift and per-frame jitter."""
    if rng is None:
        return np.repeat(track[:1], EVAL_STATIC_FRAMES, axis=0)
    n = int(rng.integers(20, 46))
    palm = _palm(track)
    seq = np.repeat(track[:1], n, axis=0)
    drift = np.cumsum(rng.normal(0, 0.01 * palm, (n, 1, 3)), axis=0)
    return seq + drift + rng.normal(0, 0.012 * palm, seq.shape)


def _rotation(rng: np.random.Generator, max_roll=15.0, max_yaw=20.0, max_pitch=15.0) -> np.ndarray:
    r, y, p = np.radians(rng.uniform(-1, 1, 3) * [max_roll, max_yaw, max_pitch])
    rz = np.array([[np.cos(r), -np.sin(r), 0], [np.sin(r), np.cos(r), 0], [0, 0, 1]])
    ry = np.array([[np.cos(y), 0, np.sin(y)], [0, 1, 0], [-np.sin(y), 0, np.cos(y)]])
    rx = np.array([[1, 0, 0], [0, np.cos(p), -np.sin(p)], [0, np.sin(p), np.cos(p)]])
    return rz @ ry @ rx


def augment(track: np.ndarray, rng: np.random.Generator, mirror: bool = True) -> np.ndarray:
    """Random, label-preserving variation of one sample."""
    if len(track) == 1:
        track = static_to_sequence(track, rng)
    else:
        n = max(8, int(len(track) * rng.uniform(0.75, 1.3)))  # speed variation
        track = pp.resample(track, n)
        track = track + rng.normal(0, 0.008 * _palm(track), track.shape)

    center = track.reshape(-1, 3).mean(axis=0)
    track = (track - center) @ _rotation(rng).T
    track = track * rng.uniform(0.9, 1.1, 3)  # mild anisotropic stretch (camera/aspect)
    if mirror and rng.random() < 0.5:
        track[..., 0] *= -1  # left-handed signer
    return track + center


def eval_track(track: np.ndarray) -> np.ndarray:
    """Deterministic version for validation/test."""
    return static_to_sequence(track, None) if len(track) == 1 else track
