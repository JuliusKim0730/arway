# Clear all destination data from database
# PowerShell Script

# UTF-8 encoding settings
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Clear Destination Data" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location "$projectRoot\backend"

# Check if virtual environment exists
if (-not (Test-Path "venv\Scripts\python.exe")) {
    Write-Host "[ERROR] Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please create virtual environment first:" -ForegroundColor Yellow
    Write-Host "  python -m venv venv" -ForegroundColor White
    exit 1
}

Write-Host "[WARNING] This will delete ALL destination data from the database!" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Are you sure? Type 'yes' to continue"

if ($confirm -ne "yes") {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "[1/2] Clearing destination data..." -ForegroundColor Yellow
try {
    $result = & "venv\Scripts\python.exe" -c @"
from app.database import SessionLocal
from app import models

db = SessionLocal()
try:
    # Delete all destinations
    count = db.query(models.Destination).delete()
    db.commit()
    print(f'Deleted {count} destinations')
except Exception as e:
    db.rollback()
    print(f'Error: {e}')
    raise
finally:
    db.close()
"@ 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Destination data cleared successfully" -ForegroundColor Green
        Write-Host "  $result" -ForegroundColor Gray
    } else {
        Write-Host "  [ERROR] Failed to clear destination data" -ForegroundColor Red
        Write-Host "  Error: $result" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  [ERROR] Error clearing destination data" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "[2/2] Verifying deletion..." -ForegroundColor Yellow
try {
    $result = & "venv\Scripts\python.exe" -c @"
from app.database import SessionLocal
from app import models

db = SessionLocal()
try:
    count = db.query(models.Destination).count()
    print(f'Remaining destinations: {count}')
finally:
    db.close()
"@ 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $result" -ForegroundColor Gray
        if ($result -like "*Remaining destinations: 0*") {
            Write-Host "  [OK] All destinations deleted" -ForegroundColor Green
        } else {
            Write-Host "  [WARN] Some destinations may still exist" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "  [WARN] Could not verify deletion" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

