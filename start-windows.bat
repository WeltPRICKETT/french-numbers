@echo off
setlocal

cd /d "%~dp0"

set HOST=127.0.0.1
set PORT=5173
set URL=http://%HOST%:%PORT%/

echo =========================================
echo   French Numbers Practice
echo =========================================
echo   Practice page: %URL%
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [Error] Node.js was not found. Install Node.js LTS: https://nodejs.org/
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [Error] npm was not found. Please reinstall Node.js LTS.
  pause
  exit /b 1
)

if not exist node_modules (
  echo [First run] Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [Error] Dependency installation failed.
    pause
    exit /b 1
  )
)

for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
  echo [Restart] Port %PORT% is already in use. Stopping PID %%p...
  taskkill /F /PID %%p >nul 2>nul
)

echo [Start] Opening %URL%
echo.

call npx vite --host %HOST% --port %PORT% --strictPort --force --open %URL%

echo.
echo Server stopped.
pause
