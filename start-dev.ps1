Write-Host "Starting JAWJI Drone System..." -ForeColor Green

# 1. Start Mosquitto (Broker)
$mosquitoProcess = Get-Process mosquitto -ErrorAction SilentlyContinue
if ($mosquitoProcess) {
    Write-Host "Mosquitto is already running." -ForeColor Yellow
} else {
    Write-Host "Starting Mosquitto..." -ForeColor Cyan
    # Adapt path if necessary, or assume it's in PATH
    Start-Process -FilePath "C:\Program Files\mosquitto\mosquitto.exe" -ArgumentList "-v" -WindowStyle Minimized
}

# 2. Start Next.js App
Write-Host "Starting Web App..." -ForeColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# 3. Start Drone Simulator
Write-Host "Starting Drone Simulator..." -ForeColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python scripts/sim_drone.py --id drone-01"

Write-Host "All systems Go!" -ForeColor Green
Write-Host "Web App: http://localhost:3000"
