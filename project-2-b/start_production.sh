#!/usr/bin/env bash

echo "Activating Python virtual environment..."
source ml_api/venv/bin/activate

echo "Starting Python backend with gunicorn via pm2..."
pm2 start ml_api/venv/bin/gunicorn --name python-api -- -w 2 -b 0.0.0.0:8000 ml_api.app:app

echo "Starting Node.js server with pm2..."
pm2 start yarn --name node-api -- start

echo "Saving pm2 process list..."
pm2 save

echo "Both servers started using pm2 and gunicorn."