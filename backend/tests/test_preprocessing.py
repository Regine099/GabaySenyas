import numpy as np
import pytest

from src.modules.recognition import preprocessing as pp


def make_hand(seed=0):
    """A plausible 21-point hand: wrist at origin-ish, fingers spreading upward."""
    rng = np.random.default_rng(seed)
    pts = np.zeros((21, 3))
    pts[0] = [0.5, 0.8, 0.0]
    for f, chain in enumerate(pp.FINGER_CHAINS):
        direction = np.array([-0.08 + 0.04 * f, -0.1, 0.0])
        for k, idx in enumerate(chain[1:], start=1):
            pts[idx] = pts[0] + direction * k + rng.normal(0, 0.005, 3)
    return pts


def to_seq(track, frame_size=None):
    frames = []
    for t, pts in enumerate(track):
        hands = []
        if pts is not None:
            hands = [{"handedness": "right",
                      "landmarks": [{"x": x, "y": y, "z": z} for x, y, z in pts]}]
        frames.append({"t_ms": t * 33, "hands": hands, "pose": []})
    seq = {"frames": frames}
    if frame_size:
        seq["frame_size"] = frame_size
    return seq


def moving_track(n=20):
    base = make_hand()
    return [base + np.array([0.01 * t, 0.005 * t, 0.0]) for t in range(n)]


def test_output_shape_and_finite():
    out = pp.preprocess_for_model(to_seq(moving_track()))
    assert out.shape == (pp.T, pp.FEAT)
    assert out.dtype == np.float32
    assert np.all(np.isfinite(out))


def test_translation_and_scale_invariant():
    track = moving_track()
    moved = [p * 1.7 + np.array([0.2, -0.1, 0.05]) for p in track]
    a = pp.preprocess_for_model(to_seq(track))
    b = pp.preprocess_for_model(to_seq(moved))
    np.testing.assert_allclose(a, b, atol=1e-4)


def test_empty_edges_are_trimmed():
    track = moving_track()
    a = pp.preprocess_for_model(to_seq(track))
    b = pp.preprocess_for_model(to_seq([None, None] + track + [None]))
    np.testing.assert_allclose(a, b, atol=1e-6)


def test_interior_gap_is_interpolated():
    track = moving_track()
    track[5] = None
    track[6] = None
    assert np.all(np.isfinite(pp.preprocess_for_model(to_seq(track))))


def test_no_hands_raises():
    with pytest.raises(pp.NoHandsDetected):
        pp.preprocess_for_model(to_seq([None, None, None]))


def test_single_frame_is_static():
    out = pp.preprocess_for_model(to_seq([make_hand()]))
    assert out.shape == (pp.T, pp.FEAT)
    np.testing.assert_allclose(out[:, -pp.N_VELOCITY:], 0.0, atol=1e-6)
    np.testing.assert_allclose(out[0], out[-1], atol=1e-6)


def test_motion_shows_in_velocity():
    out = pp.preprocess_for_model(to_seq(moving_track()))
    assert np.abs(out[1:, -pp.N_VELOCITY:]).max() > 0.1


def test_largest_hand_is_used():
    big, small = make_hand(0), make_hand(1) * 0.3
    seq = to_seq([big])
    seq["frames"][0]["hands"].insert(0, {
        "handedness": "left",
        "landmarks": [{"x": x, "y": y, "z": z} for x, y, z in small]})
    np.testing.assert_allclose(
        pp.preprocess_for_model(seq), pp.preprocess_for_model(to_seq([big])), atol=1e-6)


def test_frame_size_corrects_aspect():
    track = moving_track()
    squeezed = [p * np.array([0.5, 1.0, 0.5]) for p in track]  # as seen in a 2:1 frame
    a = pp.preprocess_for_model(to_seq(track))
    b = pp.preprocess_for_model(to_seq(squeezed, {"width": 2, "height": 1}))
    np.testing.assert_allclose(a, b, atol=1e-4)
