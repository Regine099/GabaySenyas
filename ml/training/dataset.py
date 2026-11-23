"""Load landmark samples and split them into train / validation / test.

Every data source (images, webcam recordings, videos) is first converted to
ml/data/landmarks/<LABEL>/<id>.json. This module only reads that folder, so
swapping in a new dataset never requires changing the training code.

Splitting:
  * Samples with meta.signer are split BY SIGNER (no person in two splits).
  * Samples without a signer (e.g. scraped images) are split per sample;
    the result is then NOT signer-independent and the report says so.
"""
from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from sklearn.model_selection import StratifiedGroupKFold

from common import LANDMARKS_DIR, pp


@dataclass
class Sample:
    label: str
    track: np.ndarray  # clean (frames, 21, 3)
    kind: str          # "image" | "webcam" | ...
    signer: str | None
    path: Path

    @property
    def group(self) -> str:
        return f"signer:{self.signer}" if self.signer else f"sample:{self.path}"


def load_samples(root: Path = LANDMARKS_DIR, labels: list[str] | None = None) -> list[Sample]:
    if not root.is_dir():
        raise SystemExit(f"No data in {root}. Run images_to_landmarks.py or webcam.py record first.")
    samples, skipped = [], 0
    for label_dir in sorted(p for p in root.iterdir() if p.is_dir() and not p.name.startswith("_")):
        if labels and label_dir.name not in labels:
            continue
        for f in sorted(label_dir.glob("*.json")):
            seq = json.loads(f.read_text(encoding="utf-8"))
            try:
                track = pp.clean_track(pp.extract_hand_track(seq))
            except ValueError:
                skipped += 1
                continue
            meta = seq.get("meta") or {}
            samples.append(Sample(label_dir.name, track, meta.get("kind", "unknown"), meta.get("signer"), f))
    if skipped:
        print(f"Skipped {skipped} samples without a usable hand")
    if not samples:
        raise SystemExit(f"No usable samples under {root}")
    return samples


def _fold(samples, frac, seed):
    """One stratified, group-aware hold-out of about `frac` of the samples."""
    n_splits = max(2, round(1 / frac))
    groups = [s.group for s in samples]
    if len(set(groups)) < n_splits:
        raise SystemExit(
            f"Need at least {n_splits} signers/groups to split, found {len(set(groups))}. "
            "Record more signers or pass --test-signers."
        )
    y = [s.label for s in samples]
    sgkf = StratifiedGroupKFold(n_splits=n_splits, shuffle=True, random_state=seed)
    keep, hold = next(sgkf.split(np.zeros(len(samples)), y, groups))
    return [samples[i] for i in keep], [samples[i] for i in hold]


def split_samples(samples, val_frac=0.15, test_frac=0.15, seed=42, test_signers=None):
    if test_signers:
        test = [s for s in samples if s.signer in test_signers]
        rest = [s for s in samples if s.signer not in test_signers]
        if not test:
            raise SystemExit(f"No samples from test signers {test_signers}")
    else:
        rest, test = _fold(samples, test_frac, seed)
    train, val = _fold(rest, val_frac / (1 - test_frac), seed + 1)
    return {"train": train, "val": val, "test": test}


def describe(splits) -> dict:
    out = {}
    for name, items in splits.items():
        out[name] = {
            "n": len(items),
            "per_label": dict(sorted(Counter(s.label for s in items).items())),
            "per_kind": dict(Counter(s.kind for s in items)),
            "signers": sorted({s.signer for s in items if s.signer}),
        }
    out["signer_independent"] = all(s.signer for items in splits.values() for s in items)
    return out
