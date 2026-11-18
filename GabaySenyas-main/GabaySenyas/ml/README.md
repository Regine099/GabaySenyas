# GabaySenyas ML

Data collection notes, training code, and exported models for sign recognition and reference scoring.

```text
ml/
├── data/        recordings and landmark sequences  (NOT committed; gitignored)
├── notebooks/   exploration and evaluation
├── training/    training scripts
└── models/      exported models (large files: use Git LFS or share outside git)
```

## Rules

- **One preprocessing implementation.** Import it from `backend/src/modules/recognition/preprocessing.py`; never copy it.
- Split train / validation / test **by signer**.
- Every contributor gives informed consent; keep the consent log outside the repo.
- Never commit raw video or personal data.
- Record per model: architecture, preprocessing version, classes, signer-independent metrics.
- Changing preprocessing means re-training and re-validating references.

## Suggested path

1. Landmark capture proof-of-concept (hands + arm/pose).
2. Small multi-signer dataset for 3–5 signs.
3. Baseline: DTW nearest-reference.
4. Sequence models (LSTM/GRU, 1D-CNN, Transformer encoder): compare on held-out signers.
5. Export the best model to `models/` and point `MODEL_PATH` at it.

See `docs/VALIDATION_AND_RISKS.md` and `docs/TESTING_GUIDE.md` §13.
