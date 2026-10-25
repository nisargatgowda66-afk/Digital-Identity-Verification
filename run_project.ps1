# Run Digital Identity Verification Using Blockchain (Backend + Frontend)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Starting Digital Identity Verification Using Blockchain..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Start Backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

# Start Frontend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host "`nBackend API:         http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Interactive Docs:    http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "Frontend Web App:    http://localhost:5173`n" -ForegroundColor Green
