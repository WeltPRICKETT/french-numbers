#!/bin/bash
set -e

cd "$(dirname "$0")"

HOST="127.0.0.1"
PORT="5173"
URL="http://${HOST}:${PORT}/"
DIAG_URL="${URL}test-tts.html"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  法语数字练习 (French Numbers)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  练习页面: ${URL}"
echo "  TTS 诊断: ${DIAG_URL}"
echo ""
echo "  需在浏览器中允许自动播放音频。"
echo "  法语语音: 系统设置 → 辅助功能 → 语音内容 → 下载法语"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "❌ 未找到 Node.js"
  read -r -p "按回车退出..."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "❌ 未找到 npm"
  read -r -p "按回车退出..."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "📦 首次运行，正在安装依赖..."
  npm install
fi

if command -v lsof >/dev/null 2>&1; then
  PIDS=$(lsof -ti tcp:${PORT} || true)
  if [ -n "$PIDS" ]; then
    echo "♻️ 发现 ${PORT} 端口已有服务，正在重启..."
    kill $PIDS >/dev/null 2>&1 || true
    sleep 1

    STILL_RUNNING=$(lsof -ti tcp:${PORT} || true)
    if [ -n "$STILL_RUNNING" ]; then
      kill -9 $STILL_RUNNING >/dev/null 2>&1 || true
      sleep 1
    fi
  fi
else
  echo "⚠️ 未找到 lsof，无法自动清理旧服务；如果端口被占用，请先手动关闭旧终端。"
fi

echo "🚀 启动中..."
echo "   ${URL}"
echo ""

npx vite --host "${HOST}" --port "${PORT}" --strictPort --force --open "${URL}"
