# Model Architecture & Justification

> How the predictive-maintenance model applies the Deep Learning course concepts
> (IE University, Term 3 — Prof. Conchita Díaz), and why each design choice was made.

## 1. Problem framing → why an RNN

The task is **Remaining Useful Life (RUL) regression** from multivariate turbofan
sensor **time series** (NASA CMAPSS FD001): 21 sensors + 3 operating settings per
flight cycle, predicting how many cycles remain before maintenance.

The course covered three families (Blocks 1–4). The choice follows directly from the
data modality taught in each block:

| Family | Course block | Fit for this problem |
|---|---|---|
| **ANN** (dense) | Block 1 — tabular regression/classification | Ignores temporal order; would treat each cycle independently. Rejected. |
| **CNN** | Block 2 — spatial/image data | No spatial structure in the sensor vector. Rejected. |
| **RNN / LSTM / GRU** | **Block 4 — sequential data, time-series** | Degradation is a **temporal** process; the order and trend of readings carry the signal. **Chosen.** |

This mirrors the Block 4 teaching that RNNs are the family for "time-series
forecasting, sequential data" — the sentiment-analysis notebook applied the same
`Embedding → SimpleRNN/LSTM → Dense` sequential pattern to ordered token streams; here
the ordered stream is flight cycles instead of words.

## 2. The vanishing-gradient story (taught → demonstrated)

Block 4 introduced **SimpleRNN** and its **vanishing-gradient** weakness over long
sequences, then **LSTM** gating (cell-state "highway", input/forget/output gates) as the
fix. We reproduced this empirically rather than asserting it — a four-model ablation
trained under identical hyperparameters (`notebooks/03_model_training.ipynb`):

| Model | RMSE (cycles) | MAE (cycles) | Note |
|---|---|---|---|
| SimpleRNN | 15.90 | 11.22 | vanishing-gradient baseline (worst) |
| GRU | 13.57 | 9.97 | reset/update gates, fewer params |
| LSTM | 13.71 | 10.26 | full 4-gate cell |
| **LSTM + Attention** | **14.52** | **10.33** | **deployed** — see §4 |

SimpleRNN is measurably worst, confirming the lesson. GRU/LSTM close the gap, exactly as taught.

## 3. Deployed architecture

A **stacked LSTM with a dot-product attention head** (`backend/predict.py` loads this
model; defined in `notebooks/03`):

```
Input  [batch, 30, 17]              # 30-cycle window × 17 features (see §5)
  → LSTM(128, return_sequences=True) + Dropout(0.2)
  → LSTM(64,  return_sequences=True) + Dropout(0.2)
  → DotProductAttention()           # learns which cycles matter
  → GlobalAveragePooling1D
  → Dense(32, relu) → BatchNormalization
  → Dense(1)                        # RUL (linear regression output)
```

The **stacked-LSTM + `return_sequences=True` + Dropout + Dense head** is exactly the
pattern from the Block 4 LSTM notebook (`LSTM(64, return_sequences=True) → LSTM(32) →
Dense → Dropout → Dense`). Two adaptations from the taught **classification** example to
our **regression** task:

- Output: `Dense(1)` **linear** (RUL value) instead of `Dense(1, sigmoid)`.
- Loss: **MSE / Huber** instead of `BinaryCrossentropy`.

## 4. Attention — extension beyond the baseline

Dot-product self-attention over the 30 timesteps is the one piece beyond the Block 4
baseline. It is deployed despite GRU's marginally lower RMSE because it yields
**interpretability**: the attention weights (and a gradient-attribution proxy in
`backend/predict.py::_feature_importance`) expose *which cycles and which sensors* drove
each prediction. For an aviation MRO product, "why" is worth ~1 cycle of RMSE — and it
powers the dashboard's live "sensor drivers" panel.

## 5. Preprocessing (mirrors the notebook exactly)

`backend/predict.py` replicates `notebooks/02_preprocessing.ipynb` so inference matches
training (any mismatch = wrong predictions):

1. Drop near-constant sensors (1, 5, 6, 10, 16, 18, 19 in FD001) → 14 sensors + 3 op
   settings = **17 features**.
2. `MinMaxScaler` **fit on training data only** (persisted as `scaler.pkl`).
3. Sliding window of **length 30** cycles.
4. RUL target **capped at 125** (piecewise-linear), the CMAPSS-literature standard.

## 6. Hyperparameters & overfitting prevention (taught practices)

| Choice | Value | Course grounding |
|---|---|---|
| Optimizer | Adam (lr 1e-3, `ReduceLROnPlateau`) | Adam used throughout Block 4 |
| Dropout | 0.2 after each LSTM | Block 4 LSTM notebook used Dropout(0.5) |
| Early stopping | patience 10, restore best | overfitting control taught in Blocks 1 & 4 |
| Checkpointing | `ModelCheckpoint(save_best_only=True)` | exact callback from the Block 4 notebook |
| Validation | 80/20 split | standard train/val/test discipline |
| Window / cap | 30 / 125 | CMAPSS standard |

## 7. Evaluation metrics

Because this is regression (not the course's binary-classification example, which used
accuracy / confusion matrix / ROC), evaluation uses regression-appropriate metrics,
validated on 100 held-out FD001 engines:

- **RMSE 14.52**, **MAE 10.33** cycles — standard regression error.
- **NASA asymmetric score 603.4** — domain metric that penalises **late** predictions
  (dangerous: engine fails before maintenance) harder than early ones.
- **59% within ±10 cycles, 92% within ±25 cycles**.

The dashboard's "Predicted vs actual" scatter is generated by scoring those same 100
test engines through the live model (recomputed RMSE 14.44 ≈ 14.52) — real measured
calibration, not illustrative.
