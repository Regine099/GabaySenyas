"""Train, evaluate and export the sign recognition model.

    python ml/training/train.py                      # all labels in ml/data/landmarks
    python ml/training/train.py --arch cnn           # compare architectures
    python ml/training/train.py --labels A,B,C,L,J   # subset
    python ml/training/train.py --test-signers S05,S06   # explicit held-out signers

Output: ml/models/<version>/ with model.onnx, model.pt, meta.json,
report.txt, confusion_matrix.png; then copied to ml/models/current/
(the folder the backend loads via MODEL_PATH) unless --no-promote.
"""
from __future__ import annotations

import argparse
import json
import shutil
import time
from datetime import datetime

import numpy as np
import torch
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from torch import nn
from torch.utils.data import DataLoader, Dataset

from augment import augment, eval_track
from common import LANDMARKS_DIR, MODELS_DIR, pp
from dataset import describe, load_samples, split_samples
from model import ARCHITECTURES, SignClassifier, WithSoftmax


def to_features(track):
    return pp.features(pp.resample(track, pp.T))


class TrainSet(Dataset):
    def __init__(self, samples, class_idx, seed, mirror):
        self.samples, self.class_idx, self.mirror = samples, class_idx, mirror
        self.rng = np.random.default_rng(seed)

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, i):
        s = self.samples[i]
        x = to_features(augment(s.track, self.rng, self.mirror))
        return torch.from_numpy(x), self.class_idx[s.label]


def fixed_tensors(samples, class_idx):
    x = np.stack([to_features(eval_track(s.track)) for s in samples])
    y = np.array([class_idx[s.label] for s in samples])
    return torch.from_numpy(x), torch.from_numpy(y)


@torch.no_grad()
def predict(model, x, batch=512):
    model.eval()
    return torch.cat([torch.softmax(model(x[i:i + batch]), -1) for i in range(0, len(x), batch)]).numpy()


def export_onnx(model, path):
    model.eval()
    wrapped = WithSoftmax(model).eval()
    dummy = torch.zeros(1, pp.T, pp.FEAT)
    try:
        torch.onnx.export(wrapped, dummy, str(path), input_names=["features"], output_names=["probs"],
                          dynamic_axes={"features": {0: "batch"}, "probs": {0: "batch"}},
                          opset_version=17, dynamo=False)
    except Exception as legacy_error:  # legacy exporter removed in a future torch
        print(f"Legacy ONNX export failed ({legacy_error}); trying dynamo exporter")
        torch.onnx.export(wrapped, (dummy,), str(path), input_names=["features"], output_names=["probs"],
                          dynamic_shapes={"x": {0: torch.export.Dim("batch")}}, dynamo=True)
    import onnxruntime as ort

    sess = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
    probe = torch.randn(3, pp.T, pp.FEAT)
    with torch.no_grad():
        expected = wrapped(probe).numpy()
    got = sess.run(None, {sess.get_inputs()[0].name: probe.numpy()})[0]
    if not np.allclose(expected, got, atol=1e-4):
        raise RuntimeError("ONNX output does not match PyTorch output")


def plot_confusion(cm, classes, path):
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    norm = cm / np.maximum(cm.sum(axis=1, keepdims=True), 1)
    size = max(6, len(classes) * 0.45)
    fig, ax = plt.subplots(figsize=(size, size))
    ax.imshow(norm, cmap="Blues", vmin=0, vmax=1)
    ax.set_xticks(range(len(classes)), classes)
    ax.set_yticks(range(len(classes)), classes)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("True")
    for i in range(len(classes)):
        for j in range(len(classes)):
            if cm[i, j]:
                ax.text(j, i, cm[i, j], ha="center", va="center", fontsize=7,
                        color="white" if norm[i, j] > 0.5 else "black")
    ax.set_title("Test confusion matrix (counts; color = row %)")
    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--data", default=str(LANDMARKS_DIR))
    ap.add_argument("--labels", help="comma-separated subset of labels")
    ap.add_argument("--arch", choices=ARCHITECTURES, default="gru")
    ap.add_argument("--hidden", type=int, default=128)
    ap.add_argument("--epochs", type=int, default=40)
    ap.add_argument("--patience", type=int, default=8)
    ap.add_argument("--batch", type=int, default=64)
    ap.add_argument("--lr", type=float, default=1e-3)
    ap.add_argument("--val-frac", type=float, default=0.15)
    ap.add_argument("--test-frac", type=float, default=0.15)
    ap.add_argument("--test-signers", help="comma-separated signer ids held out for testing")
    ap.add_argument("--no-mirror", action="store_true", help="disable left/right mirroring augmentation")
    ap.add_argument("--confidence-min", type=float, default=0.7)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--name", help="model version name (default: <arch>-<timestamp>)")
    ap.add_argument("--no-promote", action="store_true", help="do not copy to ml/models/current")
    args = ap.parse_args()

    torch.manual_seed(args.seed)
    np.random.seed(args.seed)
    from pathlib import Path

    labels = [s.strip().upper() for s in args.labels.split(",")] if args.labels else None
    samples = load_samples(Path(args.data), labels)
    classes = sorted({s.label for s in samples})
    class_idx = {c: i for i, c in enumerate(classes)}
    splits = split_samples(samples, args.val_frac, args.test_frac, args.seed,
                           args.test_signers.split(",") if args.test_signers else None)
    data_info = describe(splits)
    print(f"{len(samples)} samples, {len(classes)} classes: {' '.join(classes)}")
    for name in ("train", "val", "test"):
        print(f"  {name:5} {data_info[name]['n']:6}  kinds={data_info[name]['per_kind']}")
    if not data_info["signer_independent"]:
        print("  WARNING: some samples have no signer id -> test accuracy is NOT signer-independent "
              "and will likely overestimate real-world accuracy.")

    x_val, y_val = fixed_tensors(splits["val"], class_idx)
    x_test, y_test = fixed_tensors(splits["test"], class_idx)
    x_train_fixed, _ = fixed_tensors(splits["train"], class_idx)
    flat = x_train_fixed.reshape(-1, pp.FEAT)
    mean, std = flat.mean(0), flat.std(0).clamp_min(1e-3)

    model = SignClassifier(len(classes), pp.FEAT, args.arch, args.hidden, mean=mean, std=std)
    counts = np.bincount([class_idx[s.label] for s in splits["train"]], minlength=len(classes))
    weights = torch.tensor(counts.sum() / (len(classes) * np.maximum(counts, 1)), dtype=torch.float32)
    loss_fn = nn.CrossEntropyLoss(weight=weights, label_smoothing=0.05)
    opt = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=args.epochs)
    loader = DataLoader(TrainSet(splits["train"], class_idx, args.seed, not args.no_mirror),
                        batch_size=args.batch, shuffle=True, num_workers=0)

    best_f1, best_state, best_epoch, stale = -1.0, None, 0, 0
    start = time.time()
    for epoch in range(1, args.epochs + 1):
        model.train()
        total = 0.0
        for xb, yb in loader:
            opt.zero_grad()
            loss = loss_fn(model(xb), yb)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
            total += loss.item() * len(xb)
        sched.step()
        val_pred = predict(model, x_val).argmax(1)
        val_f1 = f1_score(y_val, val_pred, average="macro")
        print(f"epoch {epoch:3}  loss {total / len(loader.dataset):.4f}  "
              f"val acc {accuracy_score(y_val, val_pred):.3f}  val macro-F1 {val_f1:.3f}", flush=True)
        if val_f1 > best_f1:
            best_f1, best_epoch, stale = val_f1, epoch, 0
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
        else:
            stale += 1
            if stale >= args.patience:
                print(f"Early stop (no val improvement for {args.patience} epochs)")
                break
    model.load_state_dict(best_state)

    probs = predict(model, x_test)
    pred, conf = probs.argmax(1), probs.max(1)
    y = y_test.numpy()
    report = classification_report(y, pred, labels=range(len(classes)), target_names=classes,
                                   digits=3, zero_division=0)
    cm = confusion_matrix(y, pred, labels=range(len(classes)))
    confident = conf >= args.confidence_min
    metrics = {
        "test_accuracy": float(accuracy_score(y, pred)),
        "test_macro_f1": float(f1_score(y, pred, average="macro")),
        "best_val_macro_f1": float(best_f1),
        "best_epoch": best_epoch,
        "confidence_min": args.confidence_min,
        "test_fraction_confident": float(confident.mean()),
        "test_accuracy_when_confident": float((pred[confident] == y[confident]).mean()) if confident.any() else None,
        "per_class": classification_report(y, pred, labels=range(len(classes)), target_names=classes,
                                           output_dict=True, zero_division=0),
        "signer_independent": data_info["signer_independent"],
    }
    pairs = [(classes[i], classes[j], int(cm[i, j])) for i in range(len(classes))
             for j in range(len(classes)) if i != j and cm[i, j]]
    pairs.sort(key=lambda p: -p[2])

    version = args.name or f"{args.arch}-{datetime.now():%Y%m%d-%H%M%S}"
    out = MODELS_DIR / version
    out.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), out / "model.pt")
    export_onnx(model, out / "model.onnx")
    plot_confusion(cm, classes, out / "confusion_matrix.png")
    meta = {
        "version": version,
        "architecture": args.arch,
        "hyperparameters": {k: v for k, v in vars(args).items() if k not in ("data", "name")},
        "classes": classes,
        "preprocessing_version": pp.PREPROCESSING_VERSION,
        "input": {"name": "features", "T": pp.T, "feat": pp.FEAT},
        "output": {"name": "probs"},
        "metrics": metrics,
        "data": data_info,
        "trained_at": datetime.now().isoformat(timespec="seconds"),
        "train_seconds": round(time.time() - start, 1),
    }
    (out / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    summary = (
        f"Model {version}  ({args.arch}, preprocessing v{pp.PREPROCESSING_VERSION})\n"
        f"Test accuracy {metrics['test_accuracy']:.3f}   macro-F1 {metrics['test_macro_f1']:.3f}   "
        f"(best val macro-F1 {best_f1:.3f} @ epoch {best_epoch})\n"
        f"Confident (>= {args.confidence_min}): {metrics['test_fraction_confident']:.1%} of test, "
        f"accuracy among those {metrics['test_accuracy_when_confident'] or 0:.3f}\n"
        f"Signer-independent split: {data_info['signer_independent']}\n\n"
        f"{report}\nMost confused (true -> predicted: count):\n"
        + "\n".join(f"  {a} -> {b}: {n}" for a, b, n in pairs[:15]) + "\n"
    )
    (out / "report.txt").write_text(summary, encoding="utf-8")
    print("\n" + summary)
    print(f"Saved -> {out}")

    if not args.no_promote:
        current = MODELS_DIR / "current"
        if current.exists():
            shutil.rmtree(current)
        shutil.copytree(out, current)
        print(f"Promoted -> {current}")


if __name__ == "__main__":
    main()
