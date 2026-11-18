"""Turn a similarity score into a rating.

Rule (see docs/USER_WORKFLOWS.md section 3). Thresholds are prototype defaults.
"""
from typing import Optional

CORRECT = "correct"
PARTIAL = "partially_correct"
INCORRECT = "incorrect"


def rate_attempt(
    score: float,
    target_sign_id: int,
    recognized_sign_id: Optional[int],
    confidence: float,
    correct_min: float = 80.0,
    partial_min: float = 50.0,
    confidence_min: float = 0.7,
) -> str:
    """Return 'correct', 'partially_correct' or 'incorrect'.

    A different sign recognized with confidence >= confidence_min is always
    'incorrect', whatever the score.
    """
    if (
        recognized_sign_id is not None
        and recognized_sign_id != target_sign_id
        and confidence >= confidence_min
    ):
        return INCORRECT
    if score >= correct_min and recognized_sign_id == target_sign_id:
        return CORRECT
    if score >= partial_min:
        return PARTIAL
    return INCORRECT
