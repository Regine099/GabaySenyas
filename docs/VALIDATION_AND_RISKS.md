# GabaySenyas — Validation and Risks

## 1. Validation Priorities

1. **Sign correctness:** every sign, reference, and tip is approved by FSL teachers/professionals.
2. **Recognition accuracy:** measured on signers not seen in training.
3. **Rating validity:** system ratings agree with FSL teacher/professional ratings.
4. **Feedback usefulness:** learners can understand and apply the tips.
5. **Robustness:** works across lighting, backgrounds, cameras, distances, and signers.
6. **Learning value:** scores improve over repeated attempts.

## 2. Recognition Validation

- Split data by **signer**. Never evaluate on signers used for training.
- Report overall accuracy, per-sign precision/recall/F1, and a confusion matrix.
- Include a "no sign / other movement" test set.
- Compare at least two or three sequence architectures against a simple baseline (e.g., DTW nearest-reference) to justify the sequence model.

## 3. Scoring and Rating Validation

- Collect attempts from several learners (including deliberate errors).
- Have FSL teachers/professionals rate each as correct / partially correct / incorrect.
- Compare to the system rating (confusion matrix, Cohen's kappa).
- Tune `correct_min`, `partial_min`, and `confidence_min` on one portion of the data and confirm on another.
- Thresholds in the prototype are **defaults, not standards**.

## 4. Feedback Validation

- Perturbation tests: shift position, change direction, change speed → expected tip.
- Teacher check: do the tips match what a teacher would say?
- Learner check: after seeing a tip, does the next attempt improve in that dimension?

## 5. Adaptive Learning Validation

- Verify that the rules produce sensible recommendations on simulated learner histories.
- Check for loops (a learner stuck repeating one sign with no new guidance). After repeated `needs_practice`, suggest replaying the demo or moving on and reviewing later.

## 6. Technical Validation

- End-to-end latency, landmark FPS, and payload size meet the targets in `TECHNICAL_ARCHITECTURE.md` §14.
- Works on at least two different laptops/webcams and two browsers.
- The preprocessing package is shared and tested.

## 7. Highest-Risk Gaps

### Risk 1 — Scope drift
Adding sentences, facial expressions, mobile, or other languages. Keep `SCOPE.md` authoritative.

### Risk 2 — Overclaiming accuracy
Reporting accuracy on the same signers used in training. Always split by signer and report limitations.

### Risk 3 — Not enough validated data
Few signers and few repetitions give a model that does not generalize. Start with a small sign set; collect varied data early.

### Risk 4 — Reference bias
Scoring against one signer's style (body size, speed, handedness) penalizes others. Use multiple validated references and body-relative normalization.

### Risk 5 — Arm tracking gap
Hand landmark libraries track hands, not the whole arm. The proposal says hand **and arm** movements. Add pose keypoints (shoulders, elbows, wrists) or document the limit.

### Risk 6 — Facial/non-manual markers
Some FSL signs depend on them. The system cannot assess these. Choose signs carefully and state the limit in the UI.

### Risk 7 — Incorrect content
A wrong demonstration or reference teaches a wrong sign. Gate everything behind recorded FSL teacher/professional approval.

### Risk 8 — Privacy
Webcam use is sensitive. Keep video in the browser, store no landmarks by default, get consent for any collected data.

### Risk 9 — Real-time performance
Landmark extraction on low-end laptops may be slow. Test early; allow a lower-FPS mode.

### Risk 10 — Closed-set recognition
The model only knows its lesson signs and may confidently misclassify other movements. Use a confidence threshold and a "no sign" class.

## 4. Recommended Validation Order

1. Confirm sign list and variants with FSL teachers/professionals.
2. Landmark capture proof-of-concept (hands + arm) on 2+ laptops.
3. Record validated references and a small multi-signer dataset.
4. Baseline scoring (DTW) with perturbation tests.
5. Train and compare sequence models (signer-independent split).
6. Calibrate rating thresholds with teacher ratings.
7. Validate tips with teachers and learners.
8. Usability test with real learners.
9. Report results and limitations.

## 5. Prototype Defaults That Need Tuning

| Item | Default |
|---|---|
| `correct_min` | 80 |
| `partial_min` | 50 |
| `confidence_min` | 0.7 |
| Speed bounds | too fast < 0.7, too slow > 1.3 (ratio to reference) |
| Sequence length `T` | 32 frames |
| Mastery rule | 2 correct attempts + recent average ≥ `correct_min` |
| Needs-practice rule | ≥ 3 attempts, recent average < `partial_min` |
| Lesson unlock | ≥ 70% of previous lesson's signs mastered |
| Score mapping | `100 · exp(−distance / τ)`, τ calibrated on data |
