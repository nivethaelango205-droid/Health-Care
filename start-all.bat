@echo off
REM ========================================================
REM RuralCare 360 - One-Click Application Startup Launcher
REM Automatically adds portable Node.js and npm to PATH
REM ========================================================

set "NODE_DIR=D:\Rural health Care\.tools\node-v24.21.0-win-x64"
if not exist "%NODE_DIR%\node.exe" (
    set "NODE_DIR=D:\node"
)

set "PATH=%NODE_DIR%;%PATH%"

echo ========================================================
echo   Starting RuralCare 360 Healthcare Platform
echo   Node: %NODE_DIR%
echo ========================================================

node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js could not be found at %NODE_DIR%.
    pause
    exit /b 1
)

echo [1/2] Starting Node.js + Express Backend on http://127.0.0.1:4000...
start "RuralCare 360 - Backend" cmd /k "cd /d ""%~dp0server"" && set ""PATH=%NODE_DIR%;%%PATH%%"" && node dist/index.js"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React + Vite Frontend on http://localhost:5173...
start "RuralCare 360 - Frontend" cmd /k "cd /d ""%~dp0"" && set ""PATH=%NODE_DIR%;%%PATH%%"" && npm run dev"

echo.
echo ========================================================
echo   RuralCare 360 is starting up!
echo   Frontend: http://localhost:5173
echo   Backend:  http://127.0.0.1:4000
echo   Health:   http://127.0.0.1:4000/api/health
echo ========================================================

