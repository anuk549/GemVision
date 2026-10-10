# GemVision

AI-powered gemstone analysis. This repository contains a sapphire
**defect detection** model and a FastAPI backend that serves it over REST.

```
GemVision/
├── backend/                 # FastAPI service (REST API for the ML model)
├── frontend/                # web client (placeholder)
└── ml/
    └── defect-detection/    # training notebook, datasets, trained models
```

## Components

### `ml/defect-detection`
Trains two ImageNet backbones (`EfficientNetV2-S`, `MobileNetV2`) to classify
sapphire images into `crack`, `inclusion`, or `normal`, and produces Grad-CAM
defect localizations. See [ml/defect-detection/README.md](ml/defect-detection/README.md).

Artifacts written to `ml/defect-detection/keras/`:

```
sapphire_model.keras            # EfficientNetV2-S
sapphire_model_mobilenet.keras  # MobileNetV2
model_metadata.json             # class order + image size
```

### `backend`
FastAPI service that loads those models and exposes:

- `GET  /api/v1/health` — liveness + model status
- `GET  /api/v1/ready` — readiness (503 until models load)
- `GET  /api/v1/defects/models` — available models/classes
- `POST /api/v1/defects/detect` — classify + Grad-CAM localization
- `POST /api/v1/defects/detect/compare` — run every model

Shared preprocessing lives in `backend/reusable_components/`, which the training
notebook imports so that training and inference match. See
[backend/README.md](backend/README.md).

### `frontend`
Web client (to be implemented) that will call the backend API.

## Quick start

```bash
# 1. Environment
python -m venv venv && source venv/bin/activate
pip install -r backend/requirements.txt

# 2. Ensure models exist (train if needed)
cd ml/defect-detection && make run && cd -

# 3. Run the API
cd backend && make run
# -> http://localhost:8000/docs
```

Test a detection:

```bash
curl -X POST http://localhost:8000/api/v1/defects/detect \
  -F "file=@sample.jpg" -F "model=efficientnet"
```

## Model contract

`ml/defect-detection/keras/model_metadata.json` defines the interface the
backend relies on:

```json
{
  "class_names": ["crack", "inclusion", "normal"],
  "model_requirement": "defect_detection",
  "image_size": [224, 224]
}
```

Preprocessing: bilateral denoise → HSV gemstone crop → resize `224×224`.

## Notes

- Model binaries (`*.keras`) are gitignored; retrain with `make run` or supply
  them via `GEMVISION_MODEL_DIR`.
- The current model supports three classes. The planned six-class model
  (`normal`, `crack`, `scratch_abrasion`, `silk`, `feather`, `crystal`) requires
  additional data.
