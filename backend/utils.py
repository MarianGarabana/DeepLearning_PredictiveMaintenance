import numpy as np


def nasa_score(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    NASA asymmetric scoring function for RUL.
    Late predictions (d > 0) penalized harder than early (d < 0).
    d = predicted - true
    """
    d = y_pred - y_true
    scores = np.where(d < 0, np.exp(-d / 13) - 1, np.exp(d / 10) - 1)
    return float(np.sum(scores))


def rul_to_status(rul: float) -> str:
    if rul < 30:
        return "CRITICAL"
    elif rul < 80:
        return "WARNING"
    return "OK"


def confidence_interval(rul: float, uncertainty_pct: float = 0.15):
    """Simple symmetric ±15% CI — replace with MC Dropout if time permits."""
    margin = rul * uncertainty_pct
    return max(0.0, rul - margin), rul + margin
