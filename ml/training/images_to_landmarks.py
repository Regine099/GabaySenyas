"""Convert a folder/zip of labelled sign images into landmark samples.

Expected layout (any depth before the label folder is fine):
    <anything>/<LABEL>/<image>.jpg

Each detected image becomes a 1-frame sequence JSON in ml/data/landmarks/<LABEL>/.
The images themselves are never copied into the repo.

    python ml/training/images_to_landmarks.py C:/Users/me/Downloads/archive.zip --source-name fsl_kaggle

By default it skips Roboflow augmented copies (*.rf.<hash>.jpg) and exact duplicates,
because copies of one picture landing in both train and test inflate accuracy.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

import cv2
import numpy as np

from common import LANDMARKS_DIR, REPORTS_DIR, create_hand_landmarker, hands_from_result, mp_image, save_sample

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def iter_images(source: Path):
    """Yield (relative_name, label, bytes)."""
    if source.is_file() and source.suffix.lower() == ".zip":
        with zipfile.ZipFile(source) as z:
            for info in z.infolist():
                p = Path(info.filename)
                if not info.is_dir() and p.suffix.lower() in IMAGE_EXTS:
                    yield info.filename, p.parent.name, z.read(info)
    elif source.is_dir():
        for p in sorted(source.rglob("*")):
            if p.suffix.lower() in IMAGE_EXTS:
                yield p.relative_to(source).as_posix(), p.parent.name, p.read_bytes()
    else:
        raise SystemExit(f"Not a .zip or folder: {source}")


def prepare(bgr: np.ndarray, pad: float, border: int) -> np.ndarray:
    """Upscale small images and pad: tightly cropped hands often go undetected."""
    h, w = bgr.shape[:2]
    if min(h, w) < 256:
        s = 256 / min(h, w)
        bgr = cv2.resize(bgr, (round(w * s), round(h * s)), interpolation=cv2.INTER_CUBIC)
        h, w = bgr.shape[:2]
    p = round(max(h, w) * pad)
    bgr = cv2.copyMakeBorder(bgr, p, p, p, p, border, value=(127, 127, 127))
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)


ATTEMPTS = ((0.3, cv2.BORDER_REPLICATE), (0.3, cv2.BORDER_CONSTANT), (0.0, cv2.BORDER_CONSTANT))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source", type=Path, help="zip file or folder of <LABEL>/<image> files")
    ap.add_argument("--source-name", help="short name used in sample ids/metadata (default: file name)")
    ap.add_argument("--out", type=Path, default=LANDMARKS_DIR)
    ap.add_argument("--labels", help="comma-separated subset, e.g. A,B,C,L,J")
    ap.add_argument("--include-augmented", action="store_true", help="keep *.rf.* augmented copies")
    ap.add_argument("--limit-per-label", type=int, help="for quick tests")
    ap.add_argument("--min-conf", type=float, default=0.3)
    args = ap.parse_args()

    name = args.source_name or args.source.stem
    wanted = {s.strip().upper() for s in args.labels.split(",")} if args.labels else None
    landmarker = create_hand_landmarker("IMAGE", num_hands=2, min_conf=args.min_conf)

    stats = defaultdict(Counter)
    seen: dict[str, str] = {}
    for i, (rel, label, data) in enumerate(iter_images(args.source), 1):
        label = label.upper()
        st = stats[label]
        if wanted and label not in wanted:
            continue
        if not args.include_augmented and ".rf." in Path(rel).name:
            st["skipped_augmented"] += 1
            continue
        digest = hashlib.md5(data).hexdigest()
        if digest in seen:
            st["skipped_duplicate"] += 1
            if seen[digest] != label:
                st["duplicate_other_label"] += 1
            continue
        seen[digest] = label
        if args.limit_per_label and st["detected"] >= args.limit_per_label:
            continue

        bgr = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
        if bgr is None:
            st["unreadable"] += 1
            continue
        hands, size = [], None
        for pad, border in ATTEMPTS:
            rgb = prepare(bgr, pad, border)
            hands = hands_from_result(landmarker.detect(mp_image(rgb)))
            if hands:
                size = {"width": rgb.shape[1], "height": rgb.shape[0]}
                break
        if not hands:
            st["no_hand"] += 1
            continue

        seq = {
            "label": label,
            "frame_size": size,
            "frames": [{"t_ms": 0, "hands": hands, "pose": []}],
            "meta": {"kind": "image", "source": f"{name}:{rel}", "signer": None, "md5": digest},
        }
        save_sample(label, f"{name}_{digest[:12]}", seq, args.out)
        st["detected"] += 1
        if i % 500 == 0:
            print(f"  {i} files processed...", flush=True)

    landmarker.close()
    cols = ["detected", "no_hand", "skipped_duplicate", "skipped_augmented", "unreadable"]
    print(f"\n{'label':6}" + "".join(f"{c:>19}" for c in cols) + f"{'detect rate':>13}")
    total = Counter()
    for label in sorted(stats):
        st = stats[label]
        total.update(st)
        tried = st["detected"] + st["no_hand"]
        rate = f"{st['detected'] / tried:.0%}" if tried else "-"
        print(f"{label:6}" + "".join(f"{st[c]:>19}" for c in cols) + f"{rate:>13}")
    tried = total["detected"] + total["no_hand"]
    print(f"{'TOTAL':6}" + "".join(f"{total[c]:>19}" for c in cols)
          + f"{(total['detected'] / tried if tried else 0):>13.0%}")

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report = REPORTS_DIR / f"images_{name}.json"
    report.write_text(json.dumps({"source": str(args.source), "per_label": stats}, indent=2), encoding="utf-8")
    print(f"\nSamples -> {args.out}\nReport  -> {report}")


if __name__ == "__main__":
    main()
