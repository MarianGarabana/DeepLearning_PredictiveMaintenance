import type { ModelPerformanceResponse } from './types';

/**
 * Bundled real evaluation output for the deployed LSTM+Attention model,
 * copied verbatim from `backend/model/metrics.json` (produced by
 * `notebooks/04_evaluation.ipynb`). Used as a demo-safe fallback when the
 * deployed API does not serve `/model-performance` (older Space build returns
 * 404). These are the actual measured metrics - not placeholders.
 */
export const MODEL_METRICS: ModelPerformanceResponse = {
  rmse: 14.52,
  mae: 10.33,
  nasa_score: 603.4,
  pct_within_10: 59.0,
  pct_within_25: 92.0,
  feature_importance: {
    op_set_3: 0.0,
    op_set_2: 0.0091,
    op_set_1: 0.0108,
    sensor_3: 0.0201,
    sensor_21: 0.0349,
    sensor_17: 0.0397,
    sensor_15: 0.0413,
    sensor_2: 0.0466,
    sensor_4: 0.0562,
    sensor_20: 0.0637,
    sensor_7: 0.0673,
    sensor_12: 0.081,
    sensor_11: 0.0845,
    sensor_8: 0.0937,
    sensor_13: 0.0962,
    sensor_14: 0.1068,
    sensor_9: 0.1481,
  },
};
