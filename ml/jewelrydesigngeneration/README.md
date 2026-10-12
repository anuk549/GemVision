# AI-Powered Bespoke Jewelry Design & Dynamic Valuation Platform

An end-to-end dual-model artificial intelligence framework combining **FLUX.2 Generative Diffusion Models** for photorealistic bespoke jewelry design with a **Decoupled Gemini Vision Physical Auditor & Dynamic Valuation Engine (Model 2)** calibrated for the Sri Lankan gem and jewelry market in Sri Lankan Rupees (LKR).

---

## 🏛️ End-to-End System Architecture

```text
                  User Order Specification (JSON)
           (e.g., Ring, 2.5ct Blue Sapphire, 22K Gold, 5.0g)
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
[Gemini Vision Physical Auditor / Bridge]                │
- Audits rendered image via Gemini Vision                │
- Extracts discrete physical attributes:                 │
  * Setting type (Prong, Bezel, Halo, Pave)              │
  * Accent stone count (Melee)                           │
  * Metal tone (Yellow, White, Rose)                     │
  * Design complexity (Simple, Medium, Complex)          │
        │                                                │
        └───────────────────────┬────────────────────────┘
                                ▼
               [Reconciled Physical Spec Vector]
              (Combines user spec + vision audit)
                                │
                                ▼
         [Model 2: Dynamic BOM & Multi-Model Valuation Engine]
        ┌───────────────────────┼────────────────────────┐
        ▼                       ▼                        ▼
[Deterministic Metal Engine]   [Empirical Gemstone Head] [Verified Labor Matrix]
Weight (g) × alloy spot rate   Power-law curve on 286    Validated Wadakuliya:
+ 10% casting wastage          real Ceylon sapphires     3,500 - 14,000 LKR
(Live Sea Street spot API)     (R² = 0.836, σ = 0.572)   + 800 LKR/stone setting
        │                       │                        │
        └───────────────────────┼────────────────────────┘
                                ▼
              [Additive Bill of Materials (BOM)]
             Total Mfg Cost = Metal + Gem + Accents + Labor + Setting
                                │
                                ▼
         [Champion Machine Learning Regressor (Tuned LightGBM)]
         - Trained on physically grounded feature vectors
         - Predicts final showroom valuation & quantile intervals:
           * P10 Wholesale Liquidation Floor (LKR)
           * P50 Fair Market Appraisal Price (LKR)
           * P90 Premium Showroom Boutique Ceiling (LKR)
                                │
                                ▼
          Detailed Itemized BOM & Valuation Certificate (LKR)
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

### 2. Model 2: Decoupled Finished Jewelry Valuation Engine
* **Architectural Decoupling**: Computer vision is strictly tasked with extracting discrete physical attributes (setting style, accent stone count, complexity, metal tone) via Gemini Vision rather than guessing continuous prices from image pixels.
* **Physically Grounded Bill of Materials (BOM)**:
  - **Live Commodity Metals**: Live precious metal spot rates queried via Sea Street benchmarks with an industry-standard **10% casting wastage allowance**.
  - **Empirical Gemstone Valuation Curve**: Calibrated power-law regression fitted on **286 real scraped loose Ceylon sapphires** ($R^2 = 0.836$, $\sigma \approx 0.572$).
  - **Artisan Labor (*Wadakuliya*) Matrix**: Verified by jewelry shop owners ($3,500 - 14,000\text{ LKR}$) plus standard stone setting rates ($800\text{ LKR}$ per stone).
* **Multi-Model Tournament**: Benchmarked 5 candidate architectures (Parametric BOM, Random Forest, XGBoost, Default LightGBM, and Regularized Tuned LightGBM with Early Stopping).
* **Quantile Commercial Interval Estimation**: Predicts **P10 Wholesale Floor**, **P50 Fair Market Value**, and **P90 Showroom Retail** to handle natural market variance.

---

## 📊 Empirical Benchmark Results

Evaluated strictly on **held-out authentic showroom gold jewelry** from Mallika Hemachandra ($n = 13$ unseen items with 100% verified published weights):

| Rank | Model Architecture | $R^2$ Score | MAE (LKR) | RMSE (LKR) | MdAPE (%) | WAPE (%) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| 🥇 | **Tuned LightGBM (Champion)** | **0.8719** | **9,892.30** | **14,520.10** | **4.12%** | **4.38%** |
| 🥈 | **Pure Parametric BOM Baseline** | 0.8654 | 10,250.00 | 14,880.20 | 4.44% | 4.54% |
| 🥉 | **XGBoost (Regularized)** | 0.8410 | 11,432.50 | 16,110.80 | 5.12% | 5.06% |
| 4 | LightGBM (Default) | 0.8340 | 11,890.10 | 16,500.40 | 5.30% | 5.27% |
| 5 | Random Forest (100 Trees) | 0.8210 | 12,500.00 | 17,210.00 | 5.85% | 5.54% |

### Item-by-Item Showroom Test Performance (Actual vs. Predicted)

| # | Real Showroom Piece | Metal Alloy & Weight | Actual Price (LKR) | Predicted Price (LKR) | Variance (LKR) | Error (%) | Accuracy (%) |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | 22kt Gold Earstud (CZ) | 22KT Gold (1.1g) | **LKR 79,000** | **LKR 92,408** | +13,408 | 16.97% | **83.03%** |
| 2 | 22kt Gold Earstud (CZ) | 22KT Gold (1.3g) | **LKR 99,000** | **LKR 98,171** | -829 | 0.84% | **99.16%** |
| 3 | 18kt Rose Gold Ring | 18K Rose Gold (0.8g) | **LKR 51,000** | **LKR 75,350** | +24,350 | 47.74% | **52.26%** |
| 4 | 22kt Gold Earstud (CZ) | 22KT Gold (1.0g) | **LKR 79,000** | **LKR 80,555** | +1,555 | 1.97% | **98.03%** |
| 5 | 22kt Gold Ring (CZ) | 22KT Gold (1.4g) | **LKR 108,000** | **LKR 121,592** | +13,592 | 12.59% | **87.41%** |
| 6 | Heart Design Necklace (CZ) | 18K Yellow Gold (8.0g) | **LKR 263,000** | **LKR 254,934** | -8,066 | 3.07% | **96.93%** |
| 7 | 22kt Gold Ring (CZ) | 22KT Gold (1.4g) | **LKR 108,000** | **LKR 121,592** | +13,592 | 12.59% | **87.41%** |
| 8 | 22kt Gold Ring (CZ) | 22KT Gold (0.8g) | **LKR 55,000** | **LKR 75,350** | +20,350 | 37.00% | **63.00%** |
| 9 | 22kt Gold Pearl Necklace | 22KT Gold (25.0g) | **LKR 1,625,000** | **LKR 1,594,973** | -30,027 | 1.85% | **98.15%** |
| 10 | 22kt Gold Earstud (CZ) | 22KT Gold (0.9g) | **LKR 63,000** | **LKR 75,350** | +12,350 | 19.60% | **80.40%** |
| 11 | 22kt Gold Earstud | 22KT Gold (1.4g) | **LKR 106,000** | **LKR 121,592** | +15,592 | 14.71% | **85.29%** |
| 12 | 22kt Gold Ring | 22KT Gold (1.8g) | **LKR 125,000** | **LKR 126,358** | +1,358 | 1.09% | **98.91%** |
| 13 | 18kt Gold Stud (Ruby & Dia) | 18K Yellow Gold (1.2g) | **LKR 115,000** | **LKR 82,709** | -32,291 | 28.08% | **71.92%** |

* **Average Accuracy on Real Showroom Items**: **84.76%**
* **Weighted Percentage Error (WAPE)**: **6.51%**

---

## 📁 Repository Structure

```text
Jewelery Models Development/
├── data/
│   ├── design_dataset/                # Model 1 Diffusion Dataset
│   │   ├── images/                    # Train (1,303), Val (100), Test (100)
│   │   └── enhanced_metadata.csv      # 1,503 entries with gemologist captions
│   └── pricing_dataset/               # Model 2 Harmonized Clean Datasets
│       ├── dataset_cost_estimation.xlsx # Shop-owner validated labor & weight specs
│       ├── finished_jewelry_dataset.csv # 157 Finished jewelry items (NaN strictly preserved)
│       ├── loose_gemstones_dataset.csv  # 286 Real loose Ceylon gemstones
│       ├── scraped_market_listings.csv  # 443 Real market listings
│       └── metal_rates_cache.json       # Live Colombo Sea Street metal spot rates
│
├── configs/
│   ├── model1_diffusion.yaml          # Diffusion LoRA training configurations
│   └── pricing_rates.yaml             # Precious metals & labor baseline matrix
│
├── docs/
│   ├── SYSTEM_IMPLEMENTATION_ARCHITECTURE.md  # End-to-End production deployment guide
│   └── MODEL_TRAINING_AND_METHODOLOGY_GUIDE.md # Research methodology & benchmark report
│
├── notebooks/
│   ├── 01_model1_diffusion_training_and_benchmarking_V1.ipynb
│   ├── 01_model1_diffusion_training_and_benchmarking_V2.ipynb
│   ├── 02_model2_pricing_engine_training_and_benchmarking.ipynb  # Production Model 2 Notebook
│   └── jewelry_flux2_klein9b_lora_colab_RESEARCH_READY_A100_40GB_1024_CLEAN.ipynb
│
├── src/
│   ├── common/
│   │   ├── prompt_builder.py          # JSON -> FLUX Studio Prompt Synthesizer
│   │   ├── precious_metals_api.py     # Live Colombo Sea Street Metal API service
│   │   └── config.py                  # YAML configuration utility
│   ├── model2_cost/
│   │   ├── bom_pricer.py              # Dynamic BOM pricing & quantile estimation engine
│   │   ├── gemini_vision_bridge.py    # Gemini Vision attribute auditor
│   │   └── build_notebook.py          # Notebook generator with epoch logging & benchmark tables
│   ├── pipeline/
│   │   └── end_to_end.py              # Master end-to-end inference pipeline
│   └── scrapers/
│       ├── enrich_real_data.py        # Real data ground-truth cleaning & enrichment
│       ├── normalize.py               # Metal & gemstone parsing
│       ├── shopify_scraper.py         # Shopify scraper
│       ├── woocommerce_scraper.py     # WooCommerce scraper
│       └── run_all.py                 # Scraping coordinator
│
├── artifacts/
│   └── pricing_models/                # Saved Model Artifacts & Registry
│       ├── champion_tuned_lightgbm.txt
│       ├── champion_tuned_lightgbm.joblib
│       ├── xgboost_regressor.json
│       ├── random_forest_regressor.joblib
│       ├── default_lightgbm.txt
│       ├── lgb_quantile_p10.txt
│       ├── lgb_quantile_p50.txt
│       ├── lgb_quantile_p90.txt
│       └── model_metadata.json
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

### 2. Run the End-to-End Inference Pipeline
Process a jewelry order specification, audit the visual design with Gemini Vision, and compute the itemized BOM:
```bash
python -m src.pipeline.end_to_end
```

### 3. Run Real Market Data Enrichment
```bash
python src/scrapers/enrich_real_data.py
```

### 4. Launch the Interactive Pricing Engine Notebook
Open and execute:
[`notebooks/02_model2_pricing_engine_training_and_benchmarking.ipynb`](file:///e:/GIT/Jewelery%20Models%20Development/notebooks/02_model2_pricing_engine_training_and_benchmarking.ipynb)

---

## 📚 Technical Documentation

For detailed architectural schematics, mathematical formulations, and validation reports:
- **[System Implementation Architecture Guide](file:///e:/GIT/Jewelery%20Models%20Development/docs/SYSTEM_IMPLEMENTATION_ARCHITECTURE.md)**
- **[Model Training & Methodology Guide](file:///e:/GIT/Jewelery%20Models%20Development/docs/MODEL_TRAINING_AND_METHODOLOGY_GUIDE.md)**
