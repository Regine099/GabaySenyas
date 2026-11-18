# GabaySenyas — Scope Lock

This file is the **scope authority**. It must stay consistent with the approved proposal (`GabaySenyas_Proposal.pdf`).

## In scope

- Web app for learning **Filipino Sign Language (FSL)** using a webcam
- Lesson library arranged by difficulty, with demonstration video/image per sign
- Real-time webcam capture in the browser
- Hand (and arm) landmark extraction with a hand-tracking library
- Sequence-based recognition of the **specific signs included in the lessons**
- Scoring of an attempt against a **validated reference sequence**
- Rating of each attempt: **correct**, **partially correct**, or **incorrect**
- Corrective feedback tips (hand position, motion direction, speed)
- Adaptive lessons that respond to the learner's performance
- Progress tracking (scores and attempts saved over time) for learners
- Administrator **analytics module** for overall learner performance
- Lesson content reviewed and approved by FSL teachers/professionals

## Delimitations (stated in the proposal)

- Desktop or laptop computers with a webcam only. **Not a mobile app.**
- FSL only.
- Recognizes **only the specific signs in its lessons**. No full sentences or conversation.
- Tracks **hand and arm movements only**. Facial expressions and other non-manual FSL markers are **not** assessed.
- Does **not** replace certified FSL teachers or official courses.

## Out of scope (do not build unless this file is changed)

- Mobile app (iOS/Android)
- Other sign languages (ASL, etc.)
- Sentence-level or continuous signing recognition, translation, or conversation
- Facial-expression / non-manual marker assessment
- Real-time live interaction with human teachers (video calls, chat)
- Points, levels, badges, leaderboards, peer comparison
- Credentialing or certification of learners
- Storing raw webcam video on the server (see `TECHNICAL_ARCHITECTURE.md`, Privacy)

## Roles

| Role | Description |
|---|---|
| `learner` | Self-registers. Learns signs, practices with the webcam, views own progress. |
| `admin` | Manages accounts and lesson/sign content, records FSL-reviewer approvals, views the analytics module. Seeded. |

FSL teachers/professionals act as **external reviewers**. Their approval is *recorded* by an admin (`sign_reviews`). They do not have their own UI in the prototype.

## Rule

If a feature is not listed under **In scope**, it must not become a dependency of the core demonstration without an explicit scope decision recorded in this file.
