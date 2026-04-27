@echo off
echo Starting VisionGuard AI Platform...

echo Installing backend dependencies...
cd server
pip install -r requirements.txt

echo Starting FastAPI Backend (Port 8000)...
start cmd /k "python -m uvicorn api:app --reload --port 8000 --host 0.0.0.0"

echo Starting Vite Frontend (Port 5173)...
cd ../client
start cmd /k "npm run dev"

echo All services started!
