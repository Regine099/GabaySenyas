# GabaySenyas ML

Data collection, training code, and exported models for sign recognition.
Starter sign set: the **FSL alphabet** (static letters + moving letters J and Z) plus a `no_sign` class.
The main data source is **webcam recordings** (landmark sequences); image datasets are optional.

```text
ml/
├── setup.ps1            one-command setup (venv + dependencies)
├── requirements.txt
├── data/                (gitignored — never commit)
│   ├── landmarks/<LABEL>/<id>.json   ← the ONLY thing training reads
│   ├── landmarks_images/             (optional) image-derived samples kept aside
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
    ├── mediapipe/       hand_landmarker.task (downloaded automatically)
    ├── <version>/       model.onnx, model.pt, meta.json, report.txt, confusion_matrix.png
    └── current/         copy of the promoted model; the backend loads this (MODEL_PATH)
```

## Setup (once)

From the repository root, in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File ml\setup.ps1
```

This creates `ml/.venv`, installs CPU-only PyTorch, `ml/requirements.txt`, and `backend/requirements.txt`
(the training code imports the backend's preprocessing). It is safe to run again.

Then, **in every new terminal**, activate the venv from the repository root:

```powershell
ml\.venv\Scripts\activate
```

<details>
<summary>Manual setup (macOS/Linux, or if the script cannot run)</summary>

```bash
python -m venv ml/.venv
ml\.venv\Scripts\activate            # macOS/Linux: source ml/.venv/bin/activate
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r ml/requirements.txt -r backend/requirements.txt
```
</details>

## Workflow

Every data source is converted to **one format**: a landmark sequence JSON
(docs/TECHNICAL_ARCHITECTURE.md §5) saved in `ml/data/landmarks/<LABEL>/`.
Training never looks at images or video, so **changing the dataset never requires changing code**.

```powershell
# 1. Record webcam clips (main data source)
python ml/training/webcam.py record --label A --signer S01

# 2. Train, evaluate, export, and promote to ml/models/current
python ml/training/train.py

# 3. Try it live
python ml/training/webcam.py demo
```

## Recording with the webcam

```powershell
python ml/training/webcam.py record --label <LETTER or no_sign> --signer <ID> [--seconds 2.5] [--camera 0]
```

| Key | Action |
|---|---|
| `SPACE` | start a clip (stops after `--seconds`, or press `SPACE` again) |
| `Q` / `Esc` | quit (move on to the next letter) |

Each clip saves the hand landmarks of **every frame** (never video), so motion is learned, not just
handshape. Files are named `<SIGNER>_<LABEL>_<timestamp>.json`, so recordings from different
people never overwrite each other.

Record a whole alphabet for one signer (the window reopens per letter; press `Q` for the next):

```powershell
$s = "S01"; foreach ($l in [char[]]"ABCDEFGHIJKLMNOPQRSTUVWXYZ") { python ml/training/webcam.py record --label $l --signer $s }
python ml/training/webcam.py record --label no_sign --signer $s
```

Check how many clips each label has:

```powershell
Get-ChildItem ml\data\landmarks -Directory | ForEach-Object { "{0}: {1}" -f $_.Name, (Get-ChildItem $_.FullName -Filter *.json).Count }
```

### How many clips

| Class | Per signer / session | Total (≥ 7 signers) |
|---|---|---|
| Static letters | 15–20 | ~100–140 |
| Moving letters (J, Z) | 25–30 | ~175–210 |
| `no_sign` | 30–40 | ~200–280 |

Keep classes roughly balanced. One full session (26 letters + `no_sign`) takes about 50–60 minutes;
splitting it across days under the same signer id is fine.

### At least 7 signer ids are required

Train / validation / test are split **by signer**, so with the default fractions `train.py` needs
**≥ 7 different signer ids** (otherwise: *"Need at least 7 signers/groups to split"*).

- Best: 7+ different people (`S01`…`S08`).
- One person only: record separate sessions as `S01`, `S02`, … with different lighting, background,
  and clothing. Training works, but test accuracy will overestimate real accuracy (same person in every split).
- To hold out specific people for testing: `python ml/training/train.py --test-signers S07,S08`.

### What to vary

- **Every clip:** distance (≈40–80 cm), position in frame (center/left/right/up/down), slight wrist angle,
  speed (for J, Z, `no_sign`), starting point of the motion.
- **Every session:** lighting, background, sleeves/clothing, camera, and ideally the signer.
- **Never vary the handshape itself.** A sloppy or half-formed sign does not belong under the letter's
  label; record it as `no_sign` instead.

### Hands and motion

- Sign with your **natural dominant hand**; left-handed signers use their left hand.
  Training mirrors every clip left↔right (including the motion direction), so one hand is enough.
  Disable with `--no-mirror` only if an FSL teacher says a mirrored letter means something else.
- Keep the **other hand out of frame** so the tracker follows the signing hand.
- Start the motion right after pressing `SPACE` and do the **whole sign once** per clip.
  The live demo looks at the last ~1.5 s (45 frames), so sign at a natural pace.
  For slow J/Z use `--seconds 3.5`, but don't stretch the sign.
- Static letters: hold the shape steady for the clip.
- `no_sign`: resting hand, transitions between letters, waving, touching face/hair,
  half-formed shapes, and empty frames.

## Collecting data from other people

**Option 1 — on your computer (easiest).** The person signs at your machine using their own id:
`--signer S02`. Nothing to set up or merge.

**Option 2 — on their computer.**

1. They clone the repo, check out the working branch, and run `ml\setup.ps1` (see Setup).
2. They record with the id **you assign** (same commands as above).
3. They zip their `ml\data\landmarks` folder and send it to you (JSON only, small).
4. You merge it (file names are prefixed with the signer id, so nothing is overwritten):

```powershell
Expand-Archive S02_landmarks.zip -DestinationPath tmp_S02
Copy-Item -Recurse -Force tmp_S02\landmarks\* ml\data\landmarks\
Remove-Item -Recurse tmp_S02
```

**Rules for every contributor**

- One coordinator assigns ids (`S02`, `S03`, …) so no two people share one.
- Anonymous ids only — never real names.
- Get **informed consent before recording**; keep a consent log (id, date, consent given) **outside the repo**.
- Share the recording tips and clip targets above with them.

## Image datasets (optional)

```powershell
# From an image dataset laid out as <LABEL>/<image>.jpg (zip or folder)
python ml/training/images_to_landmarks.py path/to/dataset.zip --source-name my_dataset
```

Images are single frames, so moving letters (J, Z) are learned only as static handshapes, and
image samples have no signer id, which makes the split **not signer-independent** (training warns).

### Current image dataset (testing only)

`archive.zip` — "Collated" FSL alphabet images, 26 letters (A–Z), 11,700 files.

- 3,168 are Roboflow augmented copies (`*.rf.*`) and 555 are exact duplicates; both are skipped
  → ~8,000 unique images (J has the fewest).
- Tight hand crops, no shoulders: pose is not used for recognition.
- No signer ids and likely frames from videos → test accuracy will overestimate real webcam accuracy.
- **J and Z are single frozen frames of a moving sign** (close to I and D). Real J/Z need webcam sequences.
- Before relying on it: confirm the source and license, and have an FSL teacher spot-check letters.

Its converted samples are kept aside in `ml/data/landmarks_images/` so training uses webcam data only.
To mix them back in, copy the letter folders into `ml/data/landmarks/`.

## Managing data and models

**Training always starts from scratch** — it never loads an old model. Each run writes a new
`ml/models/<arch>-<timestamp>/` folder and replaces `ml/models/current/` with a copy of it.
Older version folders are never deleted.

```powershell
python ml/training/train.py --name webcam-v1 --no-promote      # train without touching current/
python ml/training/webcam.py demo --model ml/models/webcam-v1  # try it live
python ml/training/train.py --labels A,B,C,J,no_sign           # train on a subset
python ml/training/train.py --arch cnn                         # compare architectures
```

Promote (or roll back to) a specific version:

```powershell
Remove-Item -Recurse -Force ml\models\current; Copy-Item -Recurse ml\models\<version> ml\models\current
```

Start over with a new dataset: rename (e.g. `landmarks_old`) or delete `ml/data/landmarks`,
record/convert the new data, and run `train.py`. Labels are folder names, so new classes
(e.g. `NG`, `no_sign`) are picked up automatically. Keep at least one working model in
`ml/models/current` — the backend loads it.

`ml/data/` and `ml/models/` are gitignored: there is **no git backup**, so copy anything you want to keep.

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

## Rules

- **One preprocessing implementation.** Import it from `backend/src/modules/recognition/preprocessing.py`; never copy it.
- Split train / validation / test **by signer** (`meta.signer`; use anonymous ids like `S01`).
- Every contributor gives informed consent; keep the consent log outside the repo.
- Never commit raw video, images, landmarks, or personal data.
- Each model folder records architecture, preprocessing version, classes, and metrics (`meta.json`).
- Changing preprocessing means bumping `PREPROCESSING_VERSION`, re-training, and re-validating references.

See `docs/VALIDATION_AND_RISKS.md` and `docs/TESTING_GUIDE.md` §13.
