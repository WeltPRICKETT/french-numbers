#!/bin/bash
set -e

cd "$(dirname "$0")"

HOST="127.0.0.1"
PORT="5173"
URL="http://${HOST}:${PORT}/"

echo "========================================="
echo "  French Numbers Practice"
echo "========================================="
echo "  Practice page: ${URL}"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "[Error] Node.js was not found. Install Node.js LTS: https://nodejs.org/"
  read -r -p "Press Enter to exit..."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[Error] npm was not found. Please reinstall Node.js LTS."
  read -r -p "Press Enter to exit..."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "[First run] Installing dependencies..."
  npm install
fi

if command -v lsof >/dev/null 2>&1; then
  PIDS=$(lsof -ti tcp:${PORT} || true)
  if [ -n "$PIDS" ]; then
    echo "[Restart] Port ${PORT} is already in use. Stopping old process..."
    kill $PIDS >/dev/null 2>&1 || true
    sleep 1

    STILL_RUNNING=$(lsof -ti tcp:${PORT} || true)
    if [ -n "$STILL_RUNNING" ]; then
      kill -9 $STILL_RUNNING >/dev/null 2>&1 || true
      sleep 1
    fi
  fi
else
  echo "[Warning] lsof was not found. If port ${PORT} is busy, stop the old server manually."
fi

echo "[Start] Opening ${URL}"
echo ""

npx vite --host "${HOST}" --port "${PORT}" --strictPort --force --open "${URL}"
