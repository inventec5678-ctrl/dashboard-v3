#!/bin/bash
# Dashboard V3 環境停止腳本
# 使用方式：./stop_env.sh

pkill -f "python3 server.py" 2>/dev/null && echo "Backend 已停止" || echo "Backend 未運行"
pkill -f "node.*vite" 2>/dev/null && echo "Frontend 已停止" || echo "Frontend 未運行"
echo "✅ 所有服務已停止"