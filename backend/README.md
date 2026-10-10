# GemVision Backend

FastAPI service that connects the trained sapphire defect-detection models in
[`ml/defect-detection`](../ml/defect-detection) to a REST API. It classifies an
uploaded gemstone image into `crack`, `inclusion`, or `normal`, and returns a
Grad-CAM heatmap with the localized defect region.

## Features

- Loads both trained backbones (`EfficientNetV2-S` and `MobileNetV2`).
- Shared preprocessing with training (`reusable_components`).
- Classification + Grad-CAM defect localization (bounding box, coverage).
- Base64 PNG visuals (heatmap, overlay, gem mask).
- Layered design with dependency injection and a consistent error envelope.
- Settings via `pydantic-settings` (`.env` + `GEMVISION_*` env vars).
- Pydantic-validated responses, automatic OpenAPI docs at `/docs`, pytest suite.

## Architecture

The app is split into layers so business logic stays framework-agnostic and
easy to test:

- **`core/`** — configuration, logging, and domain exceptions.
- **`domain/`** — pure concepts (`DefectClass`, `Severity`, report profiles).
- **`services/`** — `ModelRegistry` (loads `.keras` + metadata) and
  `DefectDetector` (predict + Grad-CAM). No FastAPI imports.
- **`api/`** — thin HTTP layer; dependencies in `deps.py` pull the registry and
  detector from `app.state`.
- **`schemas/`** — Pydantic request/response models.

## Project structure

```
backend/
├── app/
│   ├── main.py                     # create_app() factory, lifespan, error handlers
│   ├── core/
│   │   ├── config.py               # Settings (pydantic-settings, GEMVISION_*)
│   │   ├── logging.py              # logging setup
│   │   └── exceptions.py           # domain errors -> HTTP status + error type
│   ├── domain/
│   │   └── defects.py              # DefectClass, Severity, report profiles
│   ├── api/
│   │   ├── deps.py                 # DI: settings/registry/detector from app.state
│   │   └── v1/
│   │       ├── router.py
│   │       └── endpoints/
│   │           ├── health.py       # /health, /ready
│   │           └── defects.py      # /defects/*
│   ├── schemas/
│   │   ├── common.py               # shared error envelope
│   │   └── defect.py               # detection models
│   └── services/
│       ├── model_registry.py       # loads .keras models + metadata
│       └── defect_detector.py      # orchestration: predict + Grad-CAM
├── reusable_components/            # shared with the ML notebook
│   ├── gem_mask.py                 # HSV gemstone mask + bounding box
│   ├── image_preprocessing.py      # denoise -> crop -> resize
│   └── gradcam.py                  # Grad-CAM + overlay
├── tests/                          # pytest suite (API + reusable components)
├── run.py                          # dev server entry point
├── Makefile                        # make run / dev / install / test / lint
├── pyproject.toml                  # ruff + pytest config
├── requirements.txt
├── requirements-dev.txt
├── .env.example
└── .gitignore
```

The ML notebook adds `backend/` to `sys.path` and imports
`reusable_components.image_preprocessing.preprocess_rgb_array`, so training and
inference stay byte-for-byte consistent.

## Setup

Use the project virtual environment (the ML models were trained with it):

```bash
python -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt        # runtime
# or, for development (adds pytest + ruff):
pip install -r backend/requirements-dev.txt
```

## Model files

The API expects the artifacts produced by the notebook in
`ml/defect-detection/keras/`:

```
sapphire_model.keras            # EfficientNetV2-S
sapphire_model_mobilenet.keras  # MobileNetV2
model_metadata.json             # class order + image size
```

If they are missing, generate them with:

```bash
cd ml/defect-detection && make run
```

Override the location with `GEMVISION_MODEL_DIR`. If no models are present the
service still starts (health reports `degraded`) and detection returns `503`.

## Run

From the `backend` directory:

```bash
make install   # pip install -r requirements.txt
make run       # start the API (python run.py)
make dev       # uvicorn with --reload (development)
make test      # run the pytest suite
make lint      # ruff check
```

Override the interpreter or bind address as needed:

```bash
make run PYTHON=/path/to/venv/bin/python HOST=127.0.0.1 PORT=9000
```

Without `make`:

```bash
python run.py
# or
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> The models are large and loaded into process memory, so run with a single
> worker (avoid `--workers > 1`).

## API

Base path: `/api/v1`

| Method | Path                 | Description                                  |
|--------|----------------------|----------------------------------------------|
| GET    | `/health`            | Liveness + model loading status              |
| GET    | `/ready`             | Readiness (503 until models are loaded)      |
| GET    | `/defects/models`    | List models, classes and image size          |
| POST   | `/defects/detect`    | Detect defects in one image                  |
| POST   | `/defects/detect/compare` | Run every loaded model on one image     |

Interactive docs: `http://localhost:8000/docs`.

### `POST /api/v1/defects/detect`

`multipart/form-data` fields:

| Field             | Type   | Default         | Notes                                   |
|-------------------|--------|-----------------|-----------------------------------------|
| `file`            | file   | required        | jpg / png / webp                        |
| `model`           | string | `efficientnet`  | `efficientnet` or `mobilenet`           |
| `include_visuals` | bool   | `true`          | Return base64 heatmap/overlay/mask      |

Example:

```bash
curl -X POST http://localhost:8000/api/v1/defects/detect \
  -F "file=@sample.jpg" \
  -F "model=efficientnet" \
  -F "include_visuals=true"
```

Response (abridged):

```json
{
  "model_name": "EfficientNetV2-S",
  "backbone": "efficientnetv2-s",
  "predicted_class": "crack",
  "confidence": 0.97,
  "probabilities": {"crack": 0.97, "inclusion": 0.02, "normal": 0.01},
  "defect": {
    "name": "Crack",
    "severity": "HIGH",
    "description": "Visible fracture in the crystal structure",
    "location": "Surface or internal fracture"
  },
  "gem_coverage_pct": 41.2,
  "defect_coverage_pct": 6.8,
  "bounding_box": {
    "x_min": 74, "y_min": 51, "x_max": 138, "y_max": 120,
    "center_x": 106, "center_y": 85,
    "x_min_pct": 33.0, "y_min_pct": 22.8, "x_max_pct": 61.6, "y_max_pct": 53.6,
    "center_x_pct": 47.3, "center_y_pct": 38.1
  },
  "visuals": {
    "heatmap": "data:image/png;base64,...",
    "overlay": "data:image/png;base64,...",
    "gem_mask": "data:image/png;base64,..."
  }
}
```

### `POST /api/v1/defects/detect/compare`

Accepts the same `file` field (and optional `include_visuals`) and returns an
array with one result per loaded model.

## Configuration

See [`.env.example`](.env.example). Settings are loaded from `GEMVISION_*`
environment variables and a `.env` file (loaded automatically via
`pydantic-settings`), falling back to sensible defaults.

## Errors

All errors share one envelope:

```json
{ "error": { "type": "invalid_image", "message": "Uploaded file is empty" } }
```

| Status | `type`                   | Meaning                                  |
|--------|--------------------------|------------------------------------------|
| 400    | `invalid_image`          | Empty or undecodable image               |
| 400    | `unknown_model`          | Unknown `model` key                      |
| 413    | `image_too_large`        | Exceeds `GEMVISION_MAX_UPLOAD_MB`        |
| 415    | `unsupported_media_type` | Non-image content type                   |
| 422    | `validation_error`       | Malformed request                        |
| 503    | `model_unavailable`      | No models loaded / models unavailable    |

## Tests

```bash
make test        # or: pytest
make lint        # or: ruff check .
```

The suite runs without the model artifacts: it covers the API surface, the
error envelope, request validation, and the shared `reusable_components`.
