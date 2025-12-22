# AR Navigation Status Check Script
# PowerShell Script

# UTF-8 encoding settings
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AR Navigation Status Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $PSScriptRoot
$results = @()

# ========================================
# 1. Frontend Server Check
# ========================================
Write-Host "[1/4] Checking frontend server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  [OK] Frontend server is running on port 3000" -ForegroundColor Green
        $results += @{Name="Frontend Server"; Status="[OK] Running"; Details="http://localhost:3000"}
    } else {
        Write-Host "  [WARN] Frontend server returned status code: $($response.StatusCode)" -ForegroundColor Yellow
        $results += @{Name="Frontend Server"; Status="[WARN] Unexpected Status"; Details="Status: $($response.StatusCode)"}
    }
} catch {
    Write-Host "  [ERROR] Frontend server is not running on port 3000" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "  [SOLUTION] Start frontend server:" -ForegroundColor Yellow
    Write-Host "     cd frontend" -ForegroundColor White
    Write-Host "     npm run dev" -ForegroundColor White
    $results += @{Name="Frontend Server"; Status="[ERROR] Not Running"; Details=$_.Exception.Message}
}
Write-Host ""

# ========================================
# 2. AR Navigation Page Check
# ========================================
Write-Host "[2/4] Checking AR navigation page..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/ar-nav" -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  [OK] AR navigation page is accessible" -ForegroundColor Green
        Write-Host "     URL: http://localhost:3000/ar-nav" -ForegroundColor Gray
        $results += @{Name="AR Nav Page"; Status="[OK] Accessible"; Details="http://localhost:3000/ar-nav"}
    } else {
        Write-Host "  [WARN] AR navigation page returned status code: $($response.StatusCode)" -ForegroundColor Yellow
        $results += @{Name="AR Nav Page"; Status="[WARN] Unexpected Status"; Details="Status: $($response.StatusCode)"}
    }
} catch {
    Write-Host "  [ERROR] AR navigation page is not accessible" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
    $results += @{Name="AR Nav Page"; Status="[ERROR] Not Accessible"; Details=$_.Exception.Message}
}
Write-Host ""

# ========================================
# 3. Backend API Check
# ========================================
Write-Host "[3/4] Checking backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/destinations/" -Method Get -TimeoutSec 5 -ErrorAction Stop
    if ($response -and $response.Count -ge 0) {
        Write-Host "  [OK] Backend API is accessible" -ForegroundColor Green
        Write-Host "     Destinations available: $($response.Count)" -ForegroundColor Gray
        $results += @{Name="Backend API"; Status="[OK] Accessible"; Details="$($response.Count) destinations"}
    } else {
        Write-Host "  [WARN] Backend API returned empty response" -ForegroundColor Yellow
        $results += @{Name="Backend API"; Status="[WARN] Empty"; Details="0 destinations"}
    }
} catch {
    Write-Host "  [ERROR] Backend API is not accessible" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "  [SOLUTION] Start backend server:" -ForegroundColor Yellow
    Write-Host "     cd backend" -ForegroundColor White
    Write-Host "     .\venv\Scripts\python.exe -m uvicorn app.main:app --reload" -ForegroundColor White
    $results += @{Name="Backend API"; Status="[ERROR] Not Accessible"; Details=$_.Exception.Message}
}
Write-Host ""

# ========================================
# 4. Browser Instructions
# ========================================
Write-Host "[4/4] Browser instructions..." -ForegroundColor Yellow
Write-Host "  [INFO] To use AR Navigation:" -ForegroundColor Cyan
Write-Host "     1. Open browser: http://localhost:3000/ar-nav" -ForegroundColor White
Write-Host "     2. Click '도보 AR 네비 시작' button" -ForegroundColor White
Write-Host "     3. Select a destination" -ForegroundColor White
Write-Host "     4. Allow camera and GPS permissions when prompted" -ForegroundColor White
Write-Host ""
Write-Host "  [NOTE] Make sure you are using:" -ForegroundColor Yellow
Write-Host "     - http://localhost:3000 (Frontend - AR Navigation)" -ForegroundColor White
Write-Host "     NOT http://localhost:3001 (Admin page)" -ForegroundColor Red
Write-Host ""

# ========================================
# Results Summary
# ========================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Results Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
foreach ($result in $results) {
    Write-Host "$($result.Name): $($result.Status)" -ForegroundColor $(if ($result.Status -like "*OK*") { "Green" } elseif ($result.Status -like "*WARN*") { "Yellow" } else { "Red" })
    Write-Host "  Details: $($result.Details)" -ForegroundColor Gray
}
Write-Host ""

$allOk = ($results | Where-Object { $_.Status -like "*OK*" }).Count -eq $results.Count
if ($allOk) {
    Write-Host "[SUCCESS] All checks passed!" -ForegroundColor Green
    Write-Host "Open http://localhost:3000/ar-nav in your browser" -ForegroundColor Cyan
} else {
    Write-Host "[WARNING] Some checks failed. Please review the errors above." -ForegroundColor Yellow
}
Write-Host ""

