# AI-Powered Bespoke Jewelry Design & Dynamic Valuation Platform

An end-to-end dual-model artificial intelligence framework combining **FLUX.2 Generative Diffusion Models** for photorealistic bespoke jewelry design with a **Hybrid Multi-Modal Cost Network & Dynamic Valuation Engine** calibrated for the Sri Lankan gem and jewelry market in Sri Lankan Rupees (LKR).

---

## 🏛️ End-to-End System Architecture

```text
                  User Order Specification (JSON)
           (e.g., Ring, 2.5ct Blue Sapphire, 22K Gold, 5.2g)
                                │
        ┌───────────────────────┴────────────────────────┐
        ▼                                                ▼
[Prompt Synthesizer & Decoupler]             [Physical Specification Engine]
- Translates JSON into photorealistic         - Validates structural physical bounds
  macro studio prompt without accounting leaks - Holds baseline mass/carat tolerances
        │                                                │
        ▼                                                │
[Model 1: FLUX.2 Klein 9B LoRA on Colab]                 │
        │                                                │
        ▼                                                │
 Generated High-Res Design Image (1024×1024)             │
        │                                                │
        ▼                                                │
[Visual Feature Inspector / Bridge]                      │
- Audits rendered image via VLM/CV                       │
- Counts actual rendered accent stones                   │
- Verifies setting type & visual complexity              │
        │                                                │
        └───────────────────────┬────────────────────────┘
                                ▼
               [Reconciled Physical Spec Vector]
              (Combines user spec + image audit)
                                │
                                ▼
              [Model 2: Hybrid Valuation & Cost System]
        ┌───────────────────────┼────────────────────────┐
        ▼                       ▼                        ▼
[Deterministic Metal Engine]   [MultiModalCostNet]      [Jeweler Labor Matrix]
Weight (g) × alloy rate        ResNet-18 (512-d) +      Validated Labor Cost:
+ 10% casting wastage          7 Embeddings + 4 Numerics 3,500 - 14,000 LKR
(XGBoost R²=0.9992, MAE=3.7k)  Predicts Gemstone & Price(XGBoost R²=1.0000, MAE=0.02)
        │                       │                        │
        └───────────────────────┼────────────────────────┘
                                ▼
              [Additive Cost Reconciliation Engine]
             Total Mfg Cost = Metal + Gem + Accents + Labor + Setting + Overheads
                                │
                                ▼
              [Retail Showroom Markup Head]
              (Calibrated against 209 real retail listings: 28% - 35%)
                                │
                                ▼
              Detailed Itemized Quotation & Final Price (LKR)
```

---

## 🔬 Core Components

### 1. Model 1: Generative Design Synthesis (FLUX.2 LoRA)
* **Base Architecture**: **FLUX.2 `[klein]` 9B Base** (undistilled flow-matching diffusion transformer).
* **Hardware & Setup**: Trained on Google Colab A100 (40GB VRAM) using Diffusers PEFT LoRA ($r=16, \alpha=32$).
* **Optimization Highlights**:
  - **Decoupled Carat Weight**: Prevents 2D scale artifacts by translating physical carats into qualitative studio tokens (*"prominent centerpiece"*, *"delicate solitaire"*) while preserving exact gram/carat numbers for financial modeling.
  - **VAE Latent Precaching & 8-Bit AdamW**: Eliminates duplicate VAE encode passes and cuts optimizer memory footprint by $75\%$.
  - **Aspect-Ratio Bucketing**: Preserves natural vertical drop ratios for chandelier earrings and pendant necklaces without distortion.
  - **Verification**: Evaluated with SigLIP2 semantic prompt alignment and Qwen3-VL attribute scoring.

### 2. Model 2: Multi-Modal Cost Network (`MultiModalCostNet`)
* **Custom Architecture**: A deep multi-task fusion neural network combining:
  1. **Visual Stream**: Pretrained ResNet-18 convolutional backbone (frozen ImageNet weights, 512-d GELU linear projection).
  2. **Categorical Stream**: 7 learnable entity embedding tables (`category`, `gemstone`, `gemstone_quality`, `gemstone_cut`, `metal`, `setting_type`, `design_complexity`).
  3. **Continuous Physical Stream**: Z-score normalized continuous projection (gemstone carats, metal grams, accent stone count, accent carats).
  4. **Deep Fusion Trunk**: 3-layer MLP (`606 → 256 → 128 → 64`) with BatchNorm1d, GELU, and Dropout (0.2).
  5. **Multi-Task Heads**: Simultaneously predicts 5 cost heads (`final_price`, `total_cost`, `gemstone_cost`, `metal_cost`, `labor_cost`).
* **Additive Physical Consistency Loss**:
  $$\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{price}} + \mathcal{L}_{\text{total\_mfg}} + 0.4\mathcal{L}_{\text{gem}} + 0.4\mathcal{L}_{\text{metal}} + 0.2\mathcal{L}_{\text{labor}} + 0.3|\hat{Y}_{\text{total}} - (\hat{Y}_{\text{gem}} + \hat{Y}_{\text{metal}} + \hat{Y}_{\text{labor}} + \dots)|$$

### 3. Production Hybrid Architecture
Rather than forcing a single model to price every component, our production pipeline delegates:
- **Precious Metals & Workshop Labor** $\to$ **Deterministic Formula / XGBoost** ($R^2 = 1.0000$ on labor, $R^2 = 0.9992$ on metal).
- **Primary Gemstones & Final Showroom Selling Price** $\to$ **`MultiModalCostNet`** ($R^2 = 0.8695$ on retail price, $R^2 = 0.7833$ on gemstone valuation).

---

## 📊 Empirical Benchmark Results

Evaluated on the held-out test split ($n = 664$ unseen jewelry pieces):

| Target Component | Best Model | $R^2$ Score | MAE (LKR) | RMSE (LKR) | MAPE (%) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Final Retail Price** | **MultiModalCostNet (ResNet18+MLP)** | **0.8695** | **95,995.54** | **597,528.36** | **10.41%** |
| Final Retail Price | LightGBM Baseline | 0.8457 | 127,155.90 | 649,797.58 | 33.48% |
| Final Retail Price | XGBoost Baseline | 0.7998 | 103,439.15 | 740,140.51 | 9.81% |
| **Gemstone Cost** | **MultiModalCostNet (ResNet18+MLP)** | **0.7833** | **93,782.91** | **546,112.37** | **14.70%** |
| Gemstone Cost | LightGBM Baseline | 0.7829 | 101,258.75 | 546,584.80 | 21.75% |
| Gemstone Cost | XGBoost Baseline | 0.7165 | 81,803.72 | 624,635.74 | 13.49% |
| **Artisan Labor** | **XGBoost Baseline** | **1.0000** | **0.02** | **0.17** | **0.00%** |
| Artisan Labor | LightGBM Baseline | 0.9999 | 13.35 | 46.14 | 0.26% |
| Artisan Labor | MultiModalCostNet | -9.1806 | 8,805.18 | 12,712.80 | 152.59% |
| **Precious Metal Cost** | **XGBoost Baseline** | **0.9992** | **3,754.30** | **10,418.77** | **4.02%** |
| Precious Metal Cost | LightGBM Baseline | 0.9989 | 4,650.66 | 12,053.40 | 7.25% |
| Precious Metal Cost | MultiModalCostNet | 0.9102 | 47,352.28 | 111,359.15 | 150.50% |
| **Total Manufacturing Cost** | **MultiModalCostNet (ResNet18+MLP)** | **0.8593** | **73,970.81** | **478,432.22** | **10.28%** |
| Total Manufacturing Cost | LightGBM Baseline | 0.8416 | 97,808.01 | 507,524.16 | 31.21% |
| Total Manufacturing Cost | XGBoost Baseline | 0.7924 | 77,944.35 | 581,119.05 | 9.32% |

---

## 📁 Repository Structure

```text
Jewelery Models Development/
├── data/
│   ├── design_dataset/                # Model 1 Diffusion Dataset
│   │   ├── images/                    # Train (1,303), Val (100), Test (100)
│   │   └── enhanced_metadata.csv      # 1,503 entries with gemologist-level captions
│   └── pricing_dataset/               # Model 2 Harmonized Datasets
│       ├── dataset_cost_estimation.xlsx           # 1,000 Shop-owner validated entries
│       ├── dataset_cost_estimation_calibrated.xlsx # Re-calibrated with empirical gem curves
│       ├── loose_gemstones_dataset.csv            # 319 Real Ceylon trade gemstone listings
│       ├── scraped_market_listings.csv            # 209 Real showroom listings (Colombo)
│       └── master_pricing_dataset.csv             # 5,210 Unified master training records
│
├── configs/
│   ├── model1_diffusion.yaml          # Diffusion LoRA training configurations
│   ├── model2_cost.yaml               # Multi-Modal Cost Network hyperparams
│   └── pricing_rates.yaml             # Market commodity spot rates & labor constants
│
├── docs/
│   ├── SYSTEM_IMPLEMENTATION_ARCHITECTURE.md  # End-to-End production deployment guide
│   └── MODEL_TRAINING_AND_METHODOLOGY_GUIDE.md # In-depth research & training methodology
│
├── notebooks/
│   ├── 02_model2_multimodal_pricing_training_and_benchmarking.ipynb
│   └── jewelry_flux2_klein9b_lora_colab_RESEARCH_READY_A100_40GB_1024_CLEAN.ipynb
│
├── src/
│   ├── common/
│   │   ├── prompt_builder.py          # JSON -> FLUX Studio Prompt Synthesizer
│   │   └── config.py                  # YAML configuration utility
│   ├── model2_cost/
│   │   ├── models/
│   │   │   ├── multimodal_net.py      # Custom MultiModalCostNet Architecture
│   │   │   └── tabular_mlp.py         # Tabular baseline MLP
│   │   ├── dataset.py                 # PyTorch Multi-Modal Dataset loader
│   │   ├── reconcile_dataset.py       # Master dataset harmonization script
│   │   ├── train_tabular_baseline.py  # LightGBM & XGBoost benchmark suite
│   │   ├── train.py                   # PyTorch multi-task training script
│   │   └── build_notebook.py          # Interactive Jupyter notebook generator
│   └── pipeline/
│       └── end_to_end.py              # Production Hybrid Inference Pipeline
│
├── artifacts/                         # Model weights and scalers (Git-ignored)
│   ├── model2_cost_checkpoints/       # best_multimodal_cost_net.pth (Epoch 24)
│   └── tabular_baselines/             # Trained XGBoost & LightGBM model binaries
│
├── requirements.txt
└── README.md
```

---

## 🚀 Quickstart

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the End-to-End Hybrid Valuation Pipeline
Process an order specification to synthesize the macro studio prompt, audit physical dimensions, and calculate the itemized BOM:
```bash
python -m src.pipeline.end_to_end
```

### 3. Reconcile the Dataset (Phase 1)
```bash
python src/model2_cost/reconcile_dataset.py
```

### 4. Train Tabular Baselines (Phase 2)
```bash
python src/model2_cost/train_tabular_baseline.py
```

### 5. Launch the Multi-Modal Interactive Notebook (Phase 3)
Open and run:
`notebooks/02_model2_multimodal_pricing_training_and_benchmarking.ipynb`

---

## 📚 Technical Documentation

For detailed architectural schematics, loss function mathematical formulations, and deployment specifications, consult:
- **[System Implementation Architecture Guide](file:///e:/GIT/Jewelery%20Models%20Development/docs/SYSTEM_IMPLEMENTATION_ARCHITECTURE.md)**
- **[Model Training & Methodology Guide](file:///e:/GIT/Jewelery%20Models%20Development/docs/MODEL_TRAINING_AND_METHODOLOGY_GUIDE.md)**
