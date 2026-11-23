"""Sequence classifiers. Input (batch, T, FEAT) -> logits (batch, classes).

Feature normalization (mean/std from the training set) is stored inside the
model, so the exported ONNX file needs nothing but preprocessing.features().
"""
from __future__ import annotations

import torch
from torch import nn

ARCHITECTURES = ("gru", "lstm", "cnn")


class SignClassifier(nn.Module):
    def __init__(self, n_classes: int, feat: int, arch: str = "gru", hidden: int = 128,
                 dropout: float = 0.3, mean=None, std=None):
        super().__init__()
        if arch not in ARCHITECTURES:
            raise ValueError(f"arch must be one of {ARCHITECTURES}")
        self.arch = arch
        self.register_buffer("mean", torch.zeros(feat) if mean is None else torch.as_tensor(mean).float())
        self.register_buffer("std", torch.ones(feat) if std is None else torch.as_tensor(std).float())
        if arch in ("gru", "lstm"):
            rnn = nn.GRU if arch == "gru" else nn.LSTM
            self.encoder = rnn(feat, hidden, num_layers=2, batch_first=True,
                               dropout=dropout, bidirectional=True)
            out_dim = hidden * 2
        else:
            self.encoder = nn.Sequential(
                nn.Conv1d(feat, hidden, 5, padding=2), nn.BatchNorm1d(hidden), nn.ReLU(), nn.Dropout(dropout),
                nn.Conv1d(hidden, hidden, 5, padding=2), nn.BatchNorm1d(hidden), nn.ReLU(), nn.Dropout(dropout),
                nn.Conv1d(hidden, hidden, 3, padding=1), nn.BatchNorm1d(hidden), nn.ReLU(),
            )
            out_dim = hidden
        self.head = nn.Sequential(nn.Dropout(dropout), nn.Linear(out_dim, n_classes))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = (x - self.mean) / self.std
        if self.arch == "cnn":
            h = self.encoder(x.transpose(1, 2)).mean(dim=2)
        else:
            h, _ = self.encoder(x)
            h = h.mean(dim=1)
        return self.head(h)


class WithSoftmax(nn.Module):
    """Export wrapper: the ONNX model outputs probabilities."""

    def __init__(self, model: nn.Module):
        super().__init__()
        self.model = model

    def forward(self, x):
        return torch.softmax(self.model(x), dim=-1)
