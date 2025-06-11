#!/bin/bash
set -e

echo "Setting up Python environment..."

cd ml_api

# Step 1: Create venv if missing
if [ ! -d ".venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv .venv
fi

# Step 2: Check if activation script exists
if [ ! -f ".venv/bin/activate" ]; then
  echo "Virtual environment created, but 'activate' script is missing."
  echo "Attempting to repair using ensurepip..."

  # Manually run ensurepip if available
  .venv/bin/python3 -m ensurepip --upgrade || {
    echo "Failed to fix venv. Please install python3-venv and python3-pip:"
    echo "     apt install python3-venv python3-pip"
    exit 1
  }

  echo "Ran ensurepip. Retrying activation..."
fi

# Step 3: Activate venv
source .venv/bin/activate

# Step 4: Install packages
pip install --upgrade pip
pip install -r requirements.txt
pip install torch==2.6.0 --index-url https://download.pytorch.org/whl/cpu

# Step 5: Train model
echo "Training sentiment analysis model (one-time process)..."
python3 train_sentiment_analysis_model.py
echo "...done"

cd ..
echo "Python environment is ready."
