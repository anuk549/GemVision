# GemVision – Gemstone Identification, Price Prediction and Jewelry Recommendation

## 1. About the Project

GemVision is a gemstone-focused application developed as part of a research project. It combines a frontend interface, a Python backend, machine-learning models, and a jewelry recommendation system.

### Main Features

# 1. Gemstone Identification

Accepts an uploaded gemstone image.

Identifies Blue Sapphire, Yellow Sapphire, Other Gemstone, or Not a Gemstone.

Displays the predicted gemstone class and its confidence score.

Allows supported sapphire predictions to proceed to price estimation.

Technical Implementation: Uses a deep-learning image classification model based on MobileNetV2 with transfer learning. The model is initially trained with a frozen pretrained backbone and then fine-tuned by unfreezing selected layers. During prediction, the uploaded image is converted to RGB, resized to 224 × 224 pixels, and passed to the trained model. The model produces class scores, and the class with the highest score is selected as the prediction.

# 2. Sapphire Price Prediction

Estimates sapphire prices using gemstone characteristics.

Considers weight, dimensions, color, intensity, clarity, shape, cut, treatment, and origin.

Provides an estimated price based on the trained prediction models.

Technical Implementation: Uses an ensemble regression approach combining XGBoost, CatBoost, and LightGBM. The input features are preprocessed according to the requirements of each algorithm. The models predict price per carat using a logarithmically transformed target, and their predictions are averaged in log space before being converted back to the original price scale. Out-of-fold prediction errors are used to estimate a price range around the predicted value.

# 3. Jewelry Recommendation

Recommends suitable jewelry categories, including rings, earrings, and necklaces.

Considers gemstone weight, shape, treatment, clarity, and cut.

Uses a weighted rule-based scoring system to rank the recommendations.

Technical Implementation: Uses an explainable rule-based decision system rather than a trained machine-learning model. Each jewelry category receives scores based on predefined rules for the gemstone's characteristics. The scores are combined using weighted factors: weight (30%), shape (25%), treatment (20%), clarity (15%), and cut (10%). The category with the highest overall suitability score is recommended.

## 2. Technologies Used

### Frontend
- React
- React Native
- Expo
- Expo Router
- React Native Web
- JavaScript

### Backend
- Python
- FastAPI
- Uvicorn
- Pydantic
- TensorFlow/Keras
- NumPy
- OpenCV
- Pillow

### Machine Learning and Data Processing
- XGBoost
- CatBoost
- LightGBM
- scikit-learn
- Pandas
- Joblib

The frontend dependencies are defined in `frontend/package.json`. The backend dependencies are defined in `backend/requirements.txt`.


## 3. Software Requirements

Install the following software before running the application:

1. **Python 3.11** — recommended for the Python backend.
2. **Node.js LTS** — required to run the frontend and npm.
3. **Visual Studio Code** — recommended for running the project.
4. An internet connection — required to download dependencies during installation.

### Check the Installed Versions

Open the VS Code terminal and run:

```powershell
py --version
node --version
npm --version
```

If these commands do not work, install the required software and restart VS Code.

## 4. Installing and Running the Application

The application requires two separate processes:

- **Backend:** handles API requests, image processing, and supported prediction features.
- **Frontend:** provides the user interface through which users interact with the application.

Start both processes in separate terminals.

### Step 1: Open the Project

Open the `GemVision-MyBranch` folder in Visual Studio Code.

You should see the `backend`, `frontend`, `data`, `ml`, and `ml-research` folders.

### Step 2: Set Up the Backend

Open the first terminal in VS Code.

Move into the backend directory:

```powershell
cd backend
```

#### Activate the Virtual Environment

If the existing `backend/venv` folder is present, activate it:

```powershell
.\venv\Scripts\Activate.ps1
```

If the virtual environment does not exist, create it first:

```powershell
py -3.11 -m venv venv
```

Then activate it:

```powershell
.\venv\Scripts\Activate.ps1
```

#### Install the Backend Packages

Run:

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

#### Configure the Environment

The backend includes an example configuration file named `.env.example`.

If a `.env` file does not already exist, create one by running:

```powershell
Copy-Item .env.example .env
```

If `.env` already exists, keep it rather than overwriting it.

The example configuration includes settings for the backend host, port, API prefix, CORS, and model directory.

#### Start the Backend Server

Run:

```powershell
python run.py
```

Wait for the server to start.

Open the following address in your browser to access the API documentation:

**API documentation:**
http://127.0.0.1:8000/docs

**Alternative API documentation:**
http://127.0.0.1:8000/redoc

These addresses assume the backend is running on port `8000`.

**Important:** Keep the first terminal open while using the application.

### Step 3: Set Up the Frontend

Open a **second terminal** in VS Code.

Make sure you start from the main project directory, `GemVision-MyBranch`.

Move into the frontend directory:

```powershell
cd frontend
```

#### Install the Frontend Packages

Run:

```powershell
npm install
```

#### Start the Frontend

Run:

```powershell
npm run web
```

This command starts the Expo frontend in web mode.

Wait until the development server starts. Open the local web address displayed in the terminal. Expo commonly uses:

http://localhost:8081

The exact address will be shown in the terminal.

**Important:** Keep the second terminal open too.

### Step 4: Use the Application

Once both the backend and frontend are running:

1. Open the frontend in your browser.
2. Navigate through the available features.
3. Upload a gemstone image to test identification.
4. Enter the required gemstone characteristics to test price prediction.
5. View the jewelry recommendations supported by the application.

The frontend must be configured to send API requests to the running backend. If the interface loads but a feature cannot retrieve results, check the API base URL and backend configuration.

## 5. Required Model Files

The prediction features depend on trained model files being available at the paths expected by their backend services.

You normally do not need to retrain the models every time you start the application.

Before running the application, check that the required model files are present in the appropriate project directories.

If a prediction feature reports that a model cannot be found, check the model path used by that feature and make sure the corresponding trained model file exists.




