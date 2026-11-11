# RuralCare 360 - PowerShell Startup Script
$ErrorActionPreference = 'Stop'

$nodeDir = "D:\Rural health Care\.tools\node-v24.21.0-win-x64"
if (-not (Test-Path "$nodeDir\node.exe")) {
    $nodeDir = "D:\node"
}

$env:PATH = "$nodeDir;$env:PATH"
Write-Host "Configured PATH with Node.js: $(node -v) / npm: $(npm -v)" -ForegroundColor Green

# Start backend
Write-Host "Starting Backend on http://127.0.0.1:4000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = '$nodeDir;' + `$env:PATH; Set-Location 'D:\Rural health Care\server'; node dist/index.js"

Start-Sleep -Seconds 2

# Start frontend
Write-Host "Starting Frontend on http://localhost:5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = '$nodeDir;' + `$env:PATH; Set-Location 'D:\Rural health Care'; npm run dev"

Write-Host "`nRuralCare 360 services launched." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend:  http://127.0.0.1:4000" -ForegroundColor Yellow

