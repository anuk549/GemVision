# GemVision - Backend API Service

FastAPI-powered backend service for the **GemVision AI Bespoke Jewelry Design & Dynamic Valuation Platform**.

---

## 🏛️ System Architecture

### 1. Image Generation Pipeline Options (FLUX.2 on RunPod)
The backend supports multiple generation modes adaptable as models evolve or host on RunPod:

- **Option A: FLUX.2 Inpainting / Outpainting (Canvas Extension)**
  - Center loose gemstone pixels are 100% protected via binary mask.
  - The model generates the precious metal band and setting outwards.
- **Option B: FLUX.2 Redux / IP-Adapter (Image Prompting / Conditioning)**
  - Real loose gemstone photo is encoded through SigLIP/CLIP vision encoder.
  - Text encoder conditions the setting style, metal alloy, and aesthetic style.
- **Production Pipeline (Hybrid A + B)**:
  - **Step 1 — Segmentation & Masking**: Cuts out the loose gem (rembg/alpha segmentation).
  - **Step 2 — Canvas Staging**: Places and scales the gem on a `1024×1024` transparent canvas.
  - **Step 3 — FLUX Inpainting**: Generates the setting and band with realistic micro-prong overlap and cast shadows.

### 2. Team Member Loose Gemstone Integration
Gemstone parameters can be ingested directly from the other team member's component:
- `carat` / `gemstone_weight_ct`
- `color` / `color_grade`
- `shape` / `gemstone_shape` (e.g. Cushion, Oval, Round, Pear, Emerald)
- `size` / `gemstone_size_mm`
- `price` / `gemstone_price`: **Pre-calculated loose gemstone valuation (LKR)**. If passed, the BOM uses this exact value as the gemstone cost. If omitted, the engine computes price dynamically via the calibrated Ceylon sapphire power-law formula.

### 3. RunPod Serverless Integration
- Supports RunPod Serverless endpoints (`/run` and `/runsync`).
- **Development / Mock Fallback**: While models are being deployed to RunPod, the backend automatically uses high-fidelity local mock synthesis with real Ceylon sapphire design renders, allowing frontend and backend development to proceed uninterrupted.

---

## 🚀 Quick Start

### 1. Installation
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env` and fill in your RunPod credentials once models are hosted:
```bash
cp .env.example .env
```

### 3. Run the Server
```bash
python run.py
```
Or with Uvicorn:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- API Docs (Swagger UI): **http://localhost:8000/docs**
- OpenAPI Specification: **http://localhost:8000/api/v1/openapi.json**
- Health Endpoint: **http://localhost:8000/api/v1/health**

---

## 📡 Core API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/jewelry/generate-design` | Synthesizes jewelry design (Option A, B, Hybrid) and computes BOM + LKR valuation |
| `POST` | `/api/v1/jewelry/price-estimate` | Computes BOM breakdown and P10/P50/P90 market quantiles |
| `POST` | `/api/v1/jewelry/stage-canvas` | Previews 1024x1024 canvas staging and inpainting mask |
| `GET` | `/api/v1/jewelry/pipeline-options` | Lists supported diffusion & inpainting architectures |
| `GET` | `/api/v1/gemstones` | Catalog of loose gemstones available in assets |
| `POST` | `/api/v1/gemstones/from-team-member` | Ingests loose gemstone variables from other team member's component |
| `GET` | `/api/v1/health` | Health check & RunPod configuration status |
