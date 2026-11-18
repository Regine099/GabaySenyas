# GabaySenyas — Core Concept

## System Title

**GabaySenyas: A Computer Vision and Sequence-Based Machine Learning System for Filipino Sign Language Recognition, Performance Analytics, and Adaptive Learning**

## Overview

GabaySenyas is a web-based system that teaches Filipino Sign Language (FSL) and checks a learner's signing in real time using a webcam. It addresses the lack of accessible FSL learning tools: formal classes are hard to find, and videos or PDF guides cannot tell learners whether they are signing correctly.

The learner watches a lesson, performs the sign in front of the webcam, and the system recognizes the sign, scores it against a validated reference, and gives tips to correct mistakes. Lessons adapt to the learner's performance, and progress is tracked over time.

It is designed for anyone who wants to learn FSL on their own using a computer with a webcam. It does not replace certified FSL teachers or official courses.

## 1. Problem

- Formal FSL classes are difficult to find.
- Videos and PDF guides are one-way: a learner can copy a sign but gets **no feedback** on whether they did it correctly.
- Without feedback, learners can practice a sign wrongly and reinforce the mistake.

## 2. Problem → Solution

| Problem | How GabaySenyas addresses it |
|---|---|
| Few accessible FSL learning tools | Browser-based app; only a laptop/desktop with a webcam is needed. |
| No feedback on correctness | Real-time recognition plus a score against a validated reference sequence, rated correct / partially correct / incorrect. |
| Learners don't know *what* to fix | Specific tips based on which part differed most: hand position, motion direction, or speed. |
| One-size-fits-all lessons | Lessons adapt to the learner's performance. |
| No visibility of improvement | Scores and attempts are saved so learners see progress over time. |
| Organizers/teachers lack overview | Administrators monitor overall learner performance in the analytics module. |
| Risk of teaching incorrect signs | Lesson signs are reviewed and approved by FSL teachers/professionals. |

## 3. Core Modules

### A. Learning (lessons + signs)
Lesson library arranged by difficulty. Each sign has a demonstration video or image, a description, and a validated reference sequence.

### B. Capture and Landmark Extraction
The browser captures the webcam feed. A hand-tracking library finds hands (and arm/upper-body keypoints) in every frame and extracts landmarks such as fingertips, knuckles, and wrist. The video becomes a **sequence of coordinates**, so the system works with positions rather than raw images.

### C. Sign Recognition
A **sequence-based classification model** reads the landmark sequence over time and predicts which FSL sign was performed. A sequence model is used because many signs depend on movement, not just a still hand shape.

### D. Scoring
The learner's landmark sequence is compared with the validated reference sequence for the target sign. The result becomes a score and a rating: **correct**, **partially correct**, or **incorrect**.

### E. Feedback
Using the part of the sign that differed most from the reference (hand position, motion direction, or speed), the system shows a specific tip, e.g. "raise your hand higher" or "slow down the movement."

### F. Adaptive Learning
Lessons and recommendations adapt to performance (what to repeat, what to unlock next).

### G. Progress and Analytics
- **Learner:** scores and attempts saved; progress view over time.
- **Administrator:** analytics module for overall learner performance.

## 4. Simplified Workflow

```text
I.   Learn the sign          → watch demo video/image
II.  Capture the attempt     → webcam on, perform the sign
III. Detect hand landmarks   → video → sequence of coordinates
IV.  Recognize the sign      → sequence model predicts the sign
V.   Score the attempt       → compare to validated reference → correct / partial / incorrect
VI.  Give feedback           → tip on position / direction / speed
VII. Track progress          → save scores & attempts; analytics for admins
```

## 5. Success Criteria (to be measured)

- Recognition accuracy on the in-scope sign set (held-out signers).
- Agreement between system ratings and FSL teacher/professional ratings.
- Learners can identify and fix errors using the tips (usability testing).
- Learners improve scores across repeated attempts.
- Administrators can see overall learner performance in the analytics module.

## 6. Items Requiring Validation

- Which FSL signs (and how many) are in the first release — confirm with FSL teachers/professionals.
- Reference-sequence recording protocol and who signs the references.
- Rating thresholds (correct / partial / incorrect) — prototype defaults, must be calibrated against teacher ratings.
- Whether the "arm" requirement needs pose keypoints in addition to hand landmarks (see `TECHNICAL_ARCHITECTURE.md`).
- Lighting, camera, background, and signer-diversity robustness.
- Data-collection consent and privacy handling.

## 7. Future Enhancements

- Mobile support
- Facial expression / non-manual markers
- Phrase and sentence recognition
- Larger FSL vocabulary
- Teacher-facing review/assignment tools
