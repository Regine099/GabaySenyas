# GabaySenyas — Background and Positioning

## The gap

Filipino Sign Language (FSL) is hard to learn on your own in the Philippines: formal classes are hard to find, and videos or PDF guides show *what* a sign looks like but cannot tell a learner *whether they are signing it correctly*. A learner who copies a sign wrongly gets no correction and may keep repeating the mistake.

GabaySenyas adds the missing feedback loop with only a laptop and a webcam: the learner performs a sign, the system recognizes it, scores it against a validated reference, and explains what to fix.

## Positioning

GabaySenyas is a **self-practice aid**. It does not replace certified FSL teachers or official courses, and it does not certify skill. It covers a limited set of isolated FSL signs and assesses hand and arm movement only.

## What it combines

- Computer vision (hand/arm landmark tracking from a webcam)
- Sequence-based machine learning (sign recognition from movement over time)
- Reference-based scoring and rule-based corrective feedback
- Adaptive lesson flow
- Progress tracking and administrator analytics

## Users

| User | Responsibility |
|---|---|
| **Learner** | Watches lessons, performs signs, reads feedback, tracks progress. |
| **Administrator** | Manages accounts and content, records FSL reviewer approvals, monitors overall learner performance in analytics. |
| **FSL teacher/professional (external)** | Reviews and approves signs, references, and tips. |

## Related work to review (for the paper's literature section)

Fill this in with the team's own sources. Suggested areas to cover:

- Sign-language recognition from landmark sequences (LSTM/GRU/Transformer/1D-CNN approaches)
- Hand/pose landmark libraries (e.g., MediaPipe)
- Existing sign-language learning apps and their feedback methods
- Dynamic Time Warping for motion comparison
- Existing Filipino Sign Language resources and datasets

Do not cite anything that has not been read and verified.
