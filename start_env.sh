#!/bin/bash
# Dashboard V3 環境啟動腳本
# 使用方式：./start_env.sh
# 會在背景啟動所有需要的服務

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR"

# 動態偵測後端：V3 有 server.py 就用 V3（任務 B1-1），否則用 V2 過渡
if [ -f "$FRONTEND_DIR/server.py" ]; then
    BACKEND_DIR="$FRONTEND_DIR"
    echo "[start_env] V3 後端偵測到，使用 V3 server.py"
else
    BACKEND_DIR="/Users/changrunlin/.openclaw/workspace/dashboard_v2_standalone"
    echo "[start_env] V3 後端尚未建立（B1-1 還沒做完），使用 V2 過渡"
fi

echo "[start_env] 啟動 Dashboard V3 環境..."
echo "[start_env] Backend 目錄：$BACKEND_DIR"

# 殺掉舊的服務（如果有的話）
pkill -f "python3 server.py" 2>/dev/null || true
pkill -f "node.*vite" 2>/dev/null || true

sleep 1

# 啟動 Backend (port 5006)
echo "[start_env] 啟動 Backend (server.py)..."
cd "$BACKEND_DIR"
nohup python3 server.py --port 5006 > /tmp/server.log 2>&1 &
BACKEND_PID=$!
echo "[start_env] Backend PID: $BACKEND_PID"

# 等待 Backend 就緒
sleep 3
for i in {1..10}; do
    if curl -s http://localhost:5006/api/symbols/crypto > /dev/null 2>&1; then
        echo "[start_env] Backend 就緒 (port 5006)"
        break
    fi
    sleep 1
done

# 啟動 Frontend (port 5173)
echo "[start_env] 啟動 Frontend (Vite dev server)..."
cd "$FRONTEND_DIR"
nohup npm run dev > /tmp/vite.log 2>&1 &
FRONTEND_PID=$!
echo "[start_env] Frontend PID: $FRONTEND_PID"

# 等待 Frontend 就緒
sleep 5
for i in {1..10}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "[start_env] Frontend 就緒 (port 5173)"
        break
    fi
    sleep 1
done

echo "[start_env] ✅ 所有服務啟動完成"
echo "  Backend：$BACKEND_DIR（http://localhost:5006）"
echo "  Frontend：http://localhost:5173"
echo "  停止服務：./stop_env.sh"