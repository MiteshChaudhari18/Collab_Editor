# Start all services for Collaborative Code Editor

Write-Host "Starting Collaborative Code Editor..." -ForegroundColor Green
Write-Host ""

# Start Y-WebSocket Server
Write-Host "Starting Y-WebSocket Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\y-websocket-server'; npm start" -WindowStyle Normal
Start-Sleep -Seconds 2

# Start Backend Server
Write-Host "Starting Backend API Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; npm start" -WindowStyle Normal
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Starting React Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\client'; npm start" -WindowStyle Normal

Write-Host ""
Write-Host "All services starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Services:" -ForegroundColor Yellow
Write-Host "  Y-WebSocket Server: Port 1234" -ForegroundColor Gray
Write-Host "  Backend API: Port 4000" -ForegroundColor Gray
Write-Host "  Frontend: Port 5173" -ForegroundColor Gray
Write-Host ""
Write-Host "Access app at: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Wait ~30 seconds for React to compile..." -ForegroundColor Yellow

