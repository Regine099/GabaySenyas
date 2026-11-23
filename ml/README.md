# GabaySenyas ML

Data collection, training code, and exported models for sign recognition.
Starter sign set: the **FSL alphabet** (static letters + moving letters J and Z).

```text
ml/
├── requirements.txt
├── data/                (gitignored — never commit)
│   ├── landmarks/<LABEL>/<id>.json   ← the ONLY thing training reads
│   └── reports/                      conversion reports
├── training/
│   ├── common.py               paths, MediaPipe helpers, imports backend preprocessing
│   ├── images_to_landmarks.py  image dataset (zip/folder) → landmark samples
│   ├── webcam.py               record your own sequences · live demo
│   ├── augment.py              landmark augmentation (static image → synthetic sequence)
│   ├── dataset.py              loading + signer-aware train/val/test split
│   ├── model.py                GRU / LSTM / 1D-CNN classifiers
│   └── train.py                train → evaluate → export ONNX → promote
└── models/              (gitignored — share outside git)
    ├── <version>/       model.onnx, model.pt, meta.json, report.txt, confusion_matrix.png
    └── current/         copy of the promoted model; the backend loads this (MODEL_PATH)
```

## Setup (once)

```bash
python -m venv ml/.venv
ml\.venv\Scripts\activate
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r ml/requirements.txt -r backend/requirements.txt
```

## Workflow

Every data source is first converted to **one format**: a landmark sequence JSON
(docs/TECHNICAL_ARCHITECTURE.md §5) saved in `ml/data/landmarks/<LABEL>/`.
Training never looks at images or video, so **changing the dataset never requires changing code**.

```bash
# 1a. From an image dataset laid out as <LABEL>/<image>.jpg (zip or folder)
python ml/training/images_to_landmarks.py path/to/dataset.zip --source-name my_dataset

# 1b. From your own webcam recordings (moving letters, no_sign, test signers)
python ml/training/webcam.py record --label J --signer S01

# 2. Train, evaluate, export, and promote to ml/models/current
python ml/training/train.py
python ml/training/train.py --arch cnn            # compare architectures

# 3. Try it live
python ml/training/webcam.py demo
```

### Re-training on a new / corrected dataset

1. Move the old samples out of the way: rename `ml/data/landmarks` (e.g. `landmarks_old`) or delete it.
2. Convert the new data with step 1a and/or 1b.
3. Run `train.py`. The labels are the folder names, so new letters (e.g. `NG`, `no_sign`) are picked up automatically.

To mix sources, just convert them all into the same `ml/data/landmarks` folder.

## Pipeline

```
sample JSON ─► preprocessing.extract_hand_track  (dominant hand per frame, aspect-corrected)
            ─► clean_track      trim empty edges, interpolate gaps
            ─► augment          (train only) static→sequence, rotation, stretch, speed, mirror, jitter
            ─► resample T=32    ─► features (32 × 87) ─► GRU ─► softmax over letters
```

Features (preprocessing v1, `backend/src/modules/recognition/preprocessing.py`):
hand shape relative to the wrist / palm size (63), finger joint angles (15), and wrist,
index-tip and pinky-tip velocity (9). Hand-only, so cropped images and webcam frames match.
**J vs I** and **Z vs D** differ only by motion, which is what the velocity features capture.

## Current dataset (testing only)

`archive.zip` — "Collated" FSL alphabet images, 26 letters (A–Z), 11,700 files.

- 3,168 are Roboflow augmented copies (`*.rf.*`) and 555 are exact duplicates; both are skipped
  → ~8,000 unique images (J has the fewest).
- Tight hand crops, no shoulders: pose is not used for recognition.
- No signer ids and likely frames from videos → the split is **not signer-independent**;
  test accuracy will overestimate real webcam accuracy.
- **J and Z are single frozen frames of a moving sign.** The model learns them as static
  handshapes here (close to I and D). Real J/Z need webcam sequences (`webcam.py record`).
- Before relying on it: confirm the source and license, and have an FSL teacher spot-check letters.

## Rules

- **One preprocessing implementation.** Import it from `backend/src/modules/recognition/preprocessing.py`; never copy it.
- Split train / validation / test **by signer** (`meta.signer`; use anonymous ids like `S01`).
- Every contributor gives informed consent; keep the consent log outside the repo.
- Never commit raw video, images, landmarks, or personal data.
- Each model folder records architecture, preprocessing version, classes, and metrics (`meta.json`).
- Changing preprocessing means bumping `PREPROCESSING_VERSION`, re-training, and re-validating references.

See `docs/VALIDATION_AND_RISKS.md` and `docs/TESTING_GUIDE.md` §13.
