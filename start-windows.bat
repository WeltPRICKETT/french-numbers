@echo off
setlocal

cd /d "%~dp0"

set HOST=127.0.0.1
set PORT=5173
set URL=http://%HOST%:%PORT%/

echo =========================================
echo   法语数字练习 ^(French Numbers^)
echo =========================================
echo   练习页面: %URL%
echo   离线音频: public\audio\fr\0-100.wav
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未找到 Node.js。请先安装 Node.js LTS: https://nodejs.org/
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [错误] 未找到 npm。请确认 Node.js 安装完整。
  pause
  exit /b 1
)

if not exist node_modules (
  echo [首次运行] 正在安装依赖...
  call npm install
  if errorlevel 1 (
    echo [错误] 依赖安装失败。
    pause
    exit /b 1
  )
)

for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
  echo [重启] 发现 %PORT% 端口已有服务，正在关闭 PID %%p...
  taskkill /F /PID %%p >nul 2>nul
)

echo [启动] 正在打开 %URL%
echo.

call npx vite --host %HOST% --port %PORT% --strictPort --force --open %URL%

echo.
echo 服务已停止。
pause
