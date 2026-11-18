from src.modules.scoring.rating import rate_attempt, CORRECT, PARTIAL, INCORRECT


def test_correct():
    assert rate_attempt(90, 1, 1, 0.95) == CORRECT


def test_partial_when_score_mid():
    assert rate_attempt(65, 1, 1, 0.9) == PARTIAL


def test_high_score_but_not_recognized_is_partial():
    assert rate_attempt(85, 1, None, 0.2) == PARTIAL


def test_incorrect_low_score():
    assert rate_attempt(30, 1, 1, 0.9) == INCORRECT


def test_different_sign_confident_is_incorrect_even_with_decent_score():
    assert rate_attempt(70, 1, 2, 0.9) == INCORRECT


def test_different_sign_low_confidence_falls_back_to_score():
    assert rate_attempt(70, 1, 2, 0.3) == PARTIAL


def test_thresholds_are_configurable():
    assert rate_attempt(70, 1, 1, 0.9, correct_min=60) == CORRECT
