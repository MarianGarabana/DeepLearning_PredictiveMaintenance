"""
Inference pipeline — mirrors 02_preprocessing.ipynb EXACTLY.
Load once at startup; call predict() per request.
"""
import os
import numpy as np
import joblib
from pathlib import Path
from typing import List, Tuple
import tensorflow as tf
from tensorflow import keras

from utils import rul_to_status, confidence_interval

_MODEL  = None
_META   = None   # dict: scaler, feature_cols, drop_sensors, sequence_length, rul_cap
_GRADS  = None   # attention model for feature importance
_USE_MC_DROPOUT = False  # set at load time depending on whether _MODEL has Dropout layers

DEFAULT_OP_SETTINGS = [0.0, 0.0, 100.0]  # FD001 nominal operating condition.

MC_DROPOUT_SAMPLES = int(os.getenv('MC_DROPOUT_SAMPLES', '30'))


def _load():
    global _MODEL, _META, _USE_MC_DROPOUT
    model_path  = Path(__file__).parent / 'model' / 'lstm_model.keras'
    scaler_path = Path(__file__).parent / 'model' / 'scaler.pkl'

    _META  = joblib.load(scaler_path)

    # Custom layer needed for model load
    class DotProductAttention(keras.layers.Layer):
        def call(self, x):
            score = tf.matmul(x, x, transpose_b=True)
            score = score / tf.math.sqrt(tf.cast(tf.shape(x)[-1], tf.float32))
            weights = tf.nn.softmax(score, axis=-1)
            attended = tf.matmul(weights, x)
            return attended, weights

    _MODEL = keras.models.load_model(
        model_path,
        custom_objects={'DotProductAttention': DotProductAttention}
    )
    print(f'Model loaded. Input shape: {_MODEL.input_shape}')

    _USE_MC_DROPOUT = any(isinstance(layer, keras.layers.Dropout) for layer in _MODEL.layers)
    if _USE_MC_DROPOUT:
        print(f'Uncertainty estimation: MC Dropout ({MC_DROPOUT_SAMPLES} samples)')
    else:
        print('Uncertainty estimation: static ±15% heuristic (no Dropout layers found in model)')


def is_loaded() -> bool:
    return _MODEL is not None


def _preprocess(sensor_window: List[List[float]]) -> np.ndarray:
    """
    sensor_window: list of 30 lists, each with 21 raw sensor values.
    Returns: array of shape [1, 30, n_features] ready for model.
    """
    scaler       = _META['scaler']
    feature_cols = _META['feature_cols']
    drop_sensors = _META['drop_sensors']
    seq_len      = _META['sequence_length']

    import pandas as pd
    op_cols     = ['op_set_1', 'op_set_2', 'op_set_3']
    sensor_cols = [f'sensor_{i}' for i in range(1, 22)]
    all_cols    = op_cols + sensor_cols

    # sensor_window has 21 raw sensor values — no op settings from frontend.
    # FD001's third operating setting is constant at 100, so zero-padding it
    # would push scaled inference inputs outside the training range.
    if len(sensor_window[0]) == 21:
        window_with_ops = [DEFAULT_OP_SETTINGS + row for row in sensor_window]
    else:
        window_with_ops = sensor_window  # assume full 24-col input

    df = pd.DataFrame(window_with_ops, columns=all_cols)
    df.drop(columns=[c for c in drop_sensors if c in df.columns], inplace=True)
    df = df[feature_cols]
    scaled = scaler.transform(df)

    # Take last seq_len rows (handles short inputs)
    if len(scaled) < seq_len:
        pad = np.tile(scaled[0], (seq_len - len(scaled), 1))
        scaled = np.vstack([pad, scaled])
    else:
        scaled = scaled[-seq_len:]

    return scaled[np.newaxis, :, :].astype(np.float32)


def _extract_rul_scalar(output) -> float:
    """
    Pulls the scalar RUL value out of a model call's output, whether that
    output is a single tensor or a tuple/list (e.g. attention variants that
    also return attention weights). Mirrors the [0][0] indexing predict()
    already relies on for the deterministic point estimate.
    """
    if isinstance(output, (list, tuple)):
        output = output[0]
    arr = output.numpy() if hasattr(output, 'numpy') else np.asarray(output)
    return float(arr.reshape(-1)[0])


def mc_dropout_predict(x: np.ndarray, n_samples: int = MC_DROPOUT_SAMPLES) -> Tuple[float, float]:
    """
    MC Dropout (Gal & Ghahramani, 2016): run the model n_samples times with
    dropout kept active (training=True) and treat the spread of outputs as
    an epistemic uncertainty estimate. Returns (mean_rul, std_rul).
    """
    x_tensor = tf.constant(x)
    samples = np.array([
        _extract_rul_scalar(_MODEL(x_tensor, training=True))
        for _ in range(n_samples)
    ])
    return float(samples.mean()), float(samples.std())


def _feature_importance(x: np.ndarray) -> List[Tuple[str, float]]:
    """Gradient-based importance proxy — absolute grad of output w.r.t input."""
    x_tensor = tf.constant(x)
    with tf.GradientTape() as tape:
        tape.watch(x_tensor)
        pred = _MODEL(x_tensor, training=False)
    grads = tape.gradient(pred, x_tensor).numpy()[0]  # [30, n_features]
    importance = np.abs(grads).mean(axis=0)           # [n_features]
    importance /= importance.sum() + 1e-9

    feature_cols = _META['feature_cols']
    pairs = sorted(zip(feature_cols, importance), key=lambda p: p[1], reverse=True)
    return pairs[:10]  # top 10


def predict(sensor_window: List[List[float]]) -> dict:
    if not is_loaded():
        _load()

    x = _preprocess(sensor_window)
    rul_raw = float(_MODEL.predict(x, verbose=0)[0][0])
    rul = max(0.0, round(rul_raw, 1))

    if _USE_MC_DROPOUT:
        _, std_rul = mc_dropout_predict(x)
        ci_lo = max(0.0, rul - 1.96 * std_rul)
        ci_hi = rul + 1.96 * std_rul
    else:
        ci_lo, ci_hi = confidence_interval(rul)

    status = rul_to_status(rul)

    top_sensors = [
        {'name': feat.replace('_', ' ').replace('sensor ', 'S').upper(), 'importance': round(float(imp), 4)}
        for feat, imp in _feature_importance(x)
    ]

    return {
        'rul': rul,
        'ci_lower': round(ci_lo, 1),
        'ci_upper': round(ci_hi, 1),
        'status': status,
        'top_sensors': top_sensors,
    }


# Load on module import (warm start)
try:
    _load()
except Exception as e:
    print(f'[predict.py] Model not loaded at startup: {e}')
    print('Call predict() after placing model files in backend/model/')
