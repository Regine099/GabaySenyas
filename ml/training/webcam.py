"""Webcam tool: record your own landmark sequences, or try the trained model live.

Record (needed for moving letters like J and Z, the no_sign class, and test signers):
    python ml/training/webcam.py record --label J --signer S01
    python ml/training/webcam.py record --label no_sign --signer S01
  SPACE = start a recording (stops automatically after --seconds, or press SPACE again)
  Q / Esc = quit

Live demo of ml/models/current:
    python ml/training/webcam.py demo

Only landmarks are saved (ml/data/landmarks/<LABEL>/), never video.
Every signer must have given informed consent before recording.
"""
from __future__ import annotations

import argparse
import time
from collections import deque
from datetime import datetime

import cv2

from common import MODELS_DIR, create_hand_landmarker, hands_from_result, mp_image, pp, save_sample

CONNECTIONS = [(c[i], c[i + 1]) for c in pp.FINGER_CHAINS for i in range(4)] + [(5, 9), (9, 13), (13, 17)]


def draw_hands(frame, hands):
    h, w = frame.shape[:2]
    for hand in hands:
        pts = [(int(p["x"] * w), int(p["y"] * h)) for p in hand["landmarks"]]
        for a, b in CONNECTIONS:
            cv2.line(frame, pts[a], pts[b], (80, 200, 80), 2)
        for p in pts:
            cv2.circle(frame, p, 3, (40, 40, 230), -1)


def text(img, s, y, color=(255, 255, 255), scale=0.7):
    cv2.putText(img, s, (12, y), cv2.FONT_HERSHEY_SIMPLEX, scale, (0, 0, 0), 4, cv2.LINE_AA)
    cv2.putText(img, s, (12, y), cv2.FONT_HERSHEY_SIMPLEX, scale, color, 2, cv2.LINE_AA)


def camera_frames(index):
    cap = cv2.VideoCapture(index)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    if not cap.isOpened():
        raise SystemExit(f"Cannot open camera {index}")
    landmarker = create_hand_landmarker("VIDEO", num_hands=2)
    last_ts = -1
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            ts = max(int(time.monotonic() * 1000), last_ts + 1)
            last_ts = ts
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            hands = hands_from_result(landmarker.detect_for_video(mp_image(rgb), ts))
            yield frame, hands, ts
    finally:
        cap.release()
        landmarker.close()
        cv2.destroyAllWindows()


def show(frame, hands, lines, window):
    draw_hands(frame, hands)
    view = cv2.flip(frame, 1)  # mirror only the preview, never the saved data
    for i, (s, color) in enumerate(lines):
        text(view, s, 30 + 30 * i, color)
    cv2.imshow(window, view)
    return cv2.waitKey(1) & 0xFF


def record(args):
    label = args.label if args.label == "no_sign" else args.label.upper()
    frames, rec_start, saved = None, 0, 0
    for frame, hands, ts in camera_frames(args.camera):
        h, w = frame.shape[:2]
        if frames is not None:
            frames.append({"t_ms": ts - rec_start, "hands": hands, "pose": []})
        lines = [(f"label {label}   signer {args.signer}   saved {saved}", (255, 255, 255)),
                 ("REC" if frames is not None else "SPACE = record, Q = quit",
                  (60, 60, 255) if frames is not None else (200, 200, 200))]
        key = show(frame, hands, lines, "GabaySenyas record")
        done = frames is not None and (key == 32 or ts - rec_start >= args.seconds * 1000)
        if done:
            if sum(1 for f in frames if f["hands"]) >= 5:
                stamp = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
                seq = {"label": label, "frame_size": {"width": w, "height": h}, "frames": frames,
                       "meta": {"kind": "webcam", "signer": args.signer, "source": "webcam",
                                "recorded_at": datetime.now().isoformat(timespec="seconds")}}
                path = save_sample(label, f"{args.signer}_{label}_{stamp}", seq)
                saved += 1
                print(f"saved {path.name} ({len(frames)} frames)")
            else:
                print("discarded: hand visible in fewer than 5 frames")
            frames = None
        elif key == 32 and frames is None:
            frames, rec_start = [], ts
        if key in (ord("q"), 27):
            break
    print(f"Saved {saved} recordings of {label} by {args.signer}")


def demo(args):
    import sys

    sys.path.insert(0, str(MODELS_DIR.parents[1] / "backend"))
    from src.modules.recognition.recognition_service import RecognitionModel

    model = RecognitionModel(args.model)
    print(f"Loaded model {model.version}: {' '.join(model.classes)}")
    buf, preds, n = deque(maxlen=args.window), [], 0
    for frame, hands, ts in camera_frames(args.camera):
        h, w = frame.shape[:2]
        buf.append({"t_ms": ts, "hands": hands, "pose": []})
        n += 1
        if n % 3 == 0:
            try:
                preds = model.predict({"frame_size": {"width": w, "height": h}, "frames": list(buf)})
            except pp.NoHandsDetected:
                preds = []
        lines = [(f"model {model.version}", (200, 200, 200))]
        if not preds:
            lines.append(("no hand", (200, 200, 200)))
        for i, p in enumerate(preds):
            ok = p.confidence >= args.confidence_min
            color = (80, 220, 80) if ok and i == 0 else (220, 220, 220)
            label = p.label if ok or i else f"{p.label}?  (not sure)"
            lines.append((f"{label:12} {p.confidence:.0%}", color))
        if show(frame, hands, lines, "GabaySenyas demo") in (ord("q"), 27):
            break


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="mode", required=True)
    r = sub.add_parser("record")
    r.add_argument("--label", required=True, help="letter, or no_sign")
    r.add_argument("--signer", required=True, help="anonymous id such as S01 (never a real name)")
    r.add_argument("--seconds", type=float, default=2.5)
    r.add_argument("--camera", type=int, default=0)
    d = sub.add_parser("demo")
    d.add_argument("--model", default=str(MODELS_DIR / "current"))
    d.add_argument("--window", type=int, default=45, help="frames in the sliding window (~1.5 s)")
    d.add_argument("--confidence-min", type=float, default=0.7)
    d.add_argument("--camera", type=int, default=0)
    args = ap.parse_args()
    record(args) if args.mode == "record" else demo(args)


if __name__ == "__main__":
    main()
