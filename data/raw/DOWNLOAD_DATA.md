# Download NASA CMAPSS Dataset

Two options:

## Option 1: Kaggle (easiest)
1. Go to: https://www.kaggle.com/datasets/behrad3d/nasa-cmaps
2. Download the zip
3. Extract these files into this folder (`data/raw/`):
   - `train_FD001.txt`
   - `test_FD001.txt`
   - `RUL_FD001.txt`
   - (optionally FD002, FD003, FD004 for multi-condition later)

## Option 2: NASA directly
1. https://www.nasa.gov/intelligent-systems-division/discovery-and-systems-health/pcoe/pcoe-data-set-repository/
2. Search "CMAPSS" — download "Turbofan Engine Degradation Simulation"

## Verify files
After download, confirm:
```
ls data/raw/
# train_FD001.txt  test_FD001.txt  RUL_FD001.txt
```

## Then run notebooks in order:
1. `notebooks/01_EDA.ipynb`
2. `notebooks/02_preprocessing.ipynb`  ← saves scaler.pkl + .npy arrays
3. `notebooks/03_model_training.ipynb` ← best run on Google Colab (free GPU)
4. `notebooks/04_evaluation.ipynb`
