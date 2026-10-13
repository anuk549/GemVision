# Sapphire Defect Detection

CNN training pipeline for classifying sapphire gemstone images into defect
classes and localizing defects with Grad-CAM.

## Contents

```
ml/defect-detection/
├── datasets/                         # training images (blue + yellow sapphire)
│   ├── blue-sapphire/train/{crack,inclusion,normal}/
│   └── yellow-sapphire/train/{crack,inclusion,normal}/
├── keras/                            # trained model artifacts (gitignored)
│   ├── sapphire_model.keras          # EfficientNetV2-S
│   ├── sapphire_model_mobilenet.keras# MobileNetV2
│   └── model_metadata.json           # class order, image size, training time
├── notebooks/
│   └── sapphire_defect_classifier.ipynb
├── Makefile
└── .gitignore
```

## Classes

`crack`, `inclusion`, `normal` (sorted alphabetically — this is the model output
order stored in `model_metadata.json`).

## Dataset

Only the `train` split exists on disk. The notebook builds a **stratified 20%
validation hold-out in memory**, because
`image_dataset_from_directory(validation_split=...)` does not shuffle before
splitting and would put a single class into validation.

| Sapphire | crack | inclusion | normal |
|----------|------:|----------:|-------:|
| blue     |     5 |        42 |     30 |
| yellow   |     1 |         1 |     25 |

Preprocessing is shared with inference via
`backend/reusable_components/image_preprocessing.py` (bilateral denoise, HSV
gemstone crop, resize to 224×224).

## Training

Two backbones are trained and compared:

- **EfficientNetV2-S**, two stages: frozen head (20 epochs) then fine-tune
  (20 epochs), the last 15 layers unfrozen.
- **MobileNetV2**, same two-stage schedule.

Both use ImageNet weights, cosine-decay learning rate, class weights,
data augmentation, `EarlyStopping`, and `ModelCheckpoint` on `val_accuracy`.

### Run

The Makefile uses the project virtual environment (override with `PYTHON=`):

```bash
make run      # execute the notebook and write models + metadata
make clean    # clear notebook outputs
```

Or run the notebook directly:

```bash
jupyter nbconvert --to notebook --execute --inplace \
  notebooks/sapphire_defect_classifier.ipynb
```

Training requires `tensorflow`, `opencv-python`, `scikit-learn`, `seaborn`,
`matplotlib`, and `nbconvert`.

## Outputs

`keras/model_metadata.json` records the model contract:

```json
{
  "class_names": ["crack", "inclusion", "normal"],
  "model_requirement": "defect_detection",
  "image_size": [224, 224],
  "training_source": "notebooks/defect-detection/sapphire_defect_classifier.ipynb",
  "training_time_seconds": 258.5
}
```

The notebook also prints the total training time after the final model.

## Notes

- Training runs on CPU here (no CUDA device detected); a full run takes roughly
  4–5 minutes.
- This is the current three-class model. The project requirements describe a
  six-class model (`normal`, `crack`, `scratch_abrasion`, `silk`, `feather`,
  `crystal`); that data is not present yet, so the notebook trains on the
  available three classes.
