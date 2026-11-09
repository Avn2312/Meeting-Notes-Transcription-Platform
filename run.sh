#!/usr/bin/env bash
set -e

echo "🪰 Starting Fireflies.ai Clone Fullstack Platform..."

# Kill any child processes on exit
trap 'echo -e "\n🛑 Stopping servers..."; kill $(jobs -p) 2>/dev/null; exit' SIGINT SIGTERM EXIT

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Start Backend
echo "📦 Starting FastAPI backend on http://127.0.0.1:8000..."
cd "$ROOT_DIR/backend"
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 &
cd "$ROOT_DIR"

# Wait briefly for backend startup
sleep 2

# 2. Start Frontend
echo "💻 Starting Next.js frontend on http://localhost:3000..."
cd "$ROOT_DIR/frontend"
npm run dev &
cd "$ROOT_DIR"

echo ""
echo "=========================================================="
echo "✨ Fireflies.ai Clone is live!"
echo "👉 Frontend: http://localhost:3000"
echo "👉 Backend API Docs: http://127.0.0.1:8000/docs"
echo "Press Ctrl+C anytime to stop both servers."
echo "=========================================================="
echo ""

wait

