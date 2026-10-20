FROM python:3.11-slim

# Install system libraries needed by OpenCV, TensorFlow and LightGBM
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 2. Copy the backend code and machine learning models
COPY backend/ ./backend/
COPY ml-research/ ./ml-research/
COPY ml/ ./ml/

WORKDIR /app/backend

# 3. Start the FastAPI server using Railway's dynamic $PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]