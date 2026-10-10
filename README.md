# GemVision - Jewelry Design Generation

## Project Directory Structure

```tex
GemVision/
├── backend/
│   ├── app/                      # Main application logic, endpoints, and routers
│   ├── reusable_components/      # Shared utilities and helper modules
│   ├── tests/                    # Unit and integration test suites
│   ├── .env.example              # Sample environment variable template
│   ├── .gitignore                # Backend-specific ignore rules
│   ├── Makefile                  # Build and task automation commands
│   ├── pyproject.toml            # Python package configuration and build settings
│   ├── requirements.txt          # Production dependencies
│   ├── requirements-dev.txt      # Development/testing dependencies
│   ├── run.py                    # Entry-point script to run the backend server
│   └── README.md                 # Backend documentation and setup steps
│
├── frontend/
│   ├── assets/                   # Static media, icons, and stylesheets
│   ├── src/                      # Source code (components, pages, navigation)
│   ├── .gitignore                # Frontend-specific ignore rules
│   ├── app.json                  # Application configuration metadata
│   ├── eslint.config.js          # ESLint code style and linting configuration
│   ├── package.json              # NPM package metadata and scripts
│   ├── package-lock.json         # Exact dependency lockfile
│   ├── LICENSE                   # Licensing terms
│   └── README.md                 # Frontend setup and run instructions
│
├── ml/
│   └── jewelrydesigngeneration/  # ML pipeline for jewelry design generation
│       ├── datasets/             # Local datasets or preprocessing scripts
│       ├── notebooks/            # Jupyter training and experimentation notebooks
│       ├── models/               # Saved weights, checkpoints, or model artifacts
│       ├── .gitignore            # Gitignore for large weights/datasets
│       ├── Makefile              # Automation for training/preprocessing
│       └── README.md             # Model training, inference, and environment instructions
│
├── .gitignore                    # Global repository ignore rules
└── README.md                     # Root project documentation
