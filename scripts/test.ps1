# ARWay Lite Test Runner Script
# PowerShell Script

# UTF-8 encoding settings
# Force PowerShell console encoding
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$env:PYTHONIOENCODING = 'utf-8'

# 코드 페이지 변경 (UTF-8)
try {
    chcp 65001 | Out-Null
} catch {
    # Ignore if chcp fails
}

# Font settings
if ($Host.UI.RawUI) {
    try {
        $Host.UI.RawUI.OutputEncoding = [System.Text.Encoding]::UTF8
    } catch {
        # Ignore if setting fails
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ARWay Lite Test Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# Test type selection
Write-Host "Select test type:" -ForegroundColor Yellow
Write-Host "1. Backend tests only"
Write-Host "2. Frontend tests only"
Write-Host "3. Run all tests"
Write-Host "4. Start backend server (for API testing)"
Write-Host "5. Start frontend server"
Write-Host "6. Start full system (Docker + Backend + Frontend)"
Write-Host "7. AR Navigation debug and status check"
Write-Host "8. Database status check"
Write-Host ""
$choice = Read-Host "Select (1-8)"

switch ($choice) {
    "1" {
        Write-Host "`nRunning backend tests..." -ForegroundColor Green
        Set-Location "$projectRoot\backend"
        
        # Check virtual environment
        if (-not (Test-Path "venv\Scripts\python.exe")) {
            Write-Host "Virtual environment not found. Creating..." -ForegroundColor Yellow
            try {
                python -m venv venv
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "Virtual environment creation failed!" -ForegroundColor Red
                    exit 1
                }
            } catch {
                Write-Host "Error creating virtual environment: $_" -ForegroundColor Red
                exit 1
            }
        }
        
        # Check dependencies
        Write-Host "Checking dependencies..." -ForegroundColor Yellow
        try {
            & "venv\Scripts\python.exe" -m pip install -q -r requirements.txt
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Dependency installation failed!" -ForegroundColor Red
                exit 1
            }
        } catch {
            Write-Host "Error installing dependencies: $_" -ForegroundColor Red
            exit 1
        }
        
        # Run tests (direct python execution in PowerShell)
        Write-Host "`nRunning tests..." -ForegroundColor Green
        try {
            & "venv\Scripts\python.exe" -m pytest tests/ -v
            $testExitCode = $LASTEXITCODE
            if ($testExitCode -eq 0) {
                Write-Host "`n[OK] Backend tests completed! (All tests passed)" -ForegroundColor Green
            } else {
                Write-Host "`n[WARN] Backend tests completed (Some tests failed, exit code: $testExitCode)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "`n[ERROR] Error running tests: $_" -ForegroundColor Red
            exit 1
        }
    }
    
    "2" {
        Write-Host "`nRunning frontend tests..." -ForegroundColor Green
        Set-Location "$projectRoot\frontend"
        
        # Check Node.js
        try {
            $nodeVersion = node --version
            Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan
        } catch {
            Write-Host "Node.js is not installed!" -ForegroundColor Red
            exit 1
        }
        
        # Check dependencies
        if (-not (Test-Path "node_modules")) {
            Write-Host "Installing dependencies..." -ForegroundColor Yellow
            try {
                npm install
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "Dependency installation failed!" -ForegroundColor Red
                    exit 1
                }
            } catch {
                Write-Host "Error installing dependencies: $_" -ForegroundColor Red
                exit 1
            }
        }
        
        # Run tests
        Write-Host "`nRunning tests..." -ForegroundColor Green
        try {
            npm test
            $testExitCode = $LASTEXITCODE
            if ($testExitCode -eq 0) {
                Write-Host "`n[OK] Frontend tests completed! (All tests passed)" -ForegroundColor Green
            } else {
                Write-Host "`n[WARN] Frontend tests completed (Some tests failed, exit code: $testExitCode)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "`n[ERROR] Error running tests: $_" -ForegroundColor Red
            exit 1
        }
    }
    
    "3" {
        Write-Host "`nRunning all tests..." -ForegroundColor Green
        $backendTestPassed = $false
        $frontendTestPassed = $false
        
        # Backend tests
        Write-Host "`n[1/2] Running backend tests..." -ForegroundColor Cyan
        Set-Location "$projectRoot\backend"
        try {
            if (-not (Test-Path "venv\Scripts\python.exe")) {
                Write-Host "Creating virtual environment..." -ForegroundColor Yellow
                python -m venv venv
            }
            Write-Host "Checking dependencies..." -ForegroundColor Yellow
            & "venv\Scripts\python.exe" -m pip install -q -r requirements.txt
            Write-Host "Running tests..." -ForegroundColor Green
            & "venv\Scripts\python.exe" -m pytest tests/ -v
            if ($LASTEXITCODE -eq 0) {
                $backendTestPassed = $true
                Write-Host "[OK] Backend tests passed" -ForegroundColor Green
            } else {
                Write-Host "[WARN] Backend tests partially failed" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "[ERROR] Error running backend tests: $_" -ForegroundColor Red
        }
        
        # Frontend tests
        Write-Host "`n[2/2] Running frontend tests..." -ForegroundColor Cyan
        Set-Location "$projectRoot\frontend"
        try {
            if (-not (Test-Path "node_modules")) {
                Write-Host "Installing dependencies..." -ForegroundColor Yellow
                npm install
            }
            Write-Host "Running tests..." -ForegroundColor Green
            npm test
            if ($LASTEXITCODE -eq 0) {
                $frontendTestPassed = $true
                Write-Host "[OK] Frontend tests passed" -ForegroundColor Green
            } else {
                Write-Host "[WARN] Frontend tests partially failed" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "[ERROR] Error running frontend tests: $_" -ForegroundColor Red
        }
        
        # Results summary
        Write-Host "`n========================================" -ForegroundColor Cyan
        Write-Host "Test Results Summary" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "Backend tests: $(if ($backendTestPassed) { '[OK] Passed' } else { '[WARN] Partially failed' })" -ForegroundColor $(if ($backendTestPassed) { 'Green' } else { 'Yellow' })
        Write-Host "Frontend tests: $(if ($frontendTestPassed) { '[OK] Passed' } else { '[WARN] Partially failed' })" -ForegroundColor $(if ($frontendTestPassed) { 'Green' } else { 'Yellow' })
        Write-Host "========================================" -ForegroundColor Cyan
    }
    
    "4" {
        Write-Host "`nStarting backend server..." -ForegroundColor Green
        Set-Location "$projectRoot\backend"
        
        # Check virtual environment
        if (-not (Test-Path "venv\Scripts\python.exe")) {
            Write-Host "Virtual environment not found. Creating..." -ForegroundColor Yellow
            try {
                python -m venv venv
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "Virtual environment creation failed!" -ForegroundColor Red
                    exit 1
                }
            } catch {
                Write-Host "Error creating virtual environment: $_" -ForegroundColor Red
                exit 1
            }
        }
        
        # Check dependencies
        Write-Host "Checking dependencies..." -ForegroundColor Yellow
        try {
            & "venv\Scripts\python.exe" -m pip install -q -r requirements.txt
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Dependency installation failed!" -ForegroundColor Red
                exit 1
            }
        } catch {
            Write-Host "Error installing dependencies: $_" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "`nStarting backend server..." -ForegroundColor Green
        Write-Host "API docs: http://localhost:8000/docs" -ForegroundColor Cyan
        Write-Host "API server: http://localhost:8000" -ForegroundColor Cyan
        Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow
        Write-Host ""
        
        try {
            & "venv\Scripts\python.exe" -m uvicorn app.main:app --reload
        } catch {
            Write-Host "Error starting server: $_" -ForegroundColor Red
            exit 1
        }
    }
    
    "5" {
        Write-Host "`nStarting frontend server..." -ForegroundColor Green
        Set-Location "$projectRoot\frontend"
        
        # Check Node.js
        try {
            $nodeVersion = node --version
            Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan
        } catch {
            Write-Host "Node.js is not installed!" -ForegroundColor Red
            exit 1
        }
        
        # Check dependencies
        if (-not (Test-Path "node_modules")) {
            Write-Host "Installing dependencies..." -ForegroundColor Yellow
            try {
                npm install
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "Dependency installation failed!" -ForegroundColor Red
                    exit 1
                }
            } catch {
                Write-Host "Error installing dependencies: $_" -ForegroundColor Red
                exit 1
            }
        }
        
        Write-Host "`nStarting frontend server..." -ForegroundColor Green
        Write-Host "URL: http://localhost:3000/ar-nav" -ForegroundColor Cyan
        Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow
        Write-Host ""
        
        try {
            npm run dev
        } catch {
            Write-Host "Error starting server: $_" -ForegroundColor Red
            exit 1
        }
    }
    
    "6" {
        Write-Host "`nStarting full system..." -ForegroundColor Green
        Write-Host "Note: This may open 3 terminal windows." -ForegroundColor Yellow
        Write-Host ""
        
        # Check Docker
        try {
            $dockerVersion = docker --version
            Write-Host "Docker version: $dockerVersion" -ForegroundColor Cyan
        } catch {
            Write-Host "[WARN] Docker is not installed or not running." -ForegroundColor Yellow
            Write-Host "Backend and frontend can run without Docker." -ForegroundColor Yellow
        }
        
        # Start Docker PostgreSQL
        Write-Host "[1/3] Starting PostgreSQL container..." -ForegroundColor Cyan
        Set-Location $projectRoot
        try {
            docker-compose up -d postgres
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] PostgreSQL container started" -ForegroundColor Green
            } else {
                Write-Host "[WARN] PostgreSQL container start failed (may already be running)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "[WARN] Docker error: $_" -ForegroundColor Yellow
            Write-Host "Continuing without Docker..." -ForegroundColor Yellow
        }
        
        Start-Sleep -Seconds 3
        
        # Start backend server (new window)
        Write-Host "[2/3] Starting backend server (new window)..." -ForegroundColor Cyan
        try {
            $backendCommand = "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; chcp 65001 | Out-Null; cd '$projectRoot\backend'; if (-not (Test-Path 'venv\Scripts\python.exe')) { Write-Host 'Creating virtual environment...'; python -m venv venv }; Write-Host 'Checking dependencies...'; .\venv\Scripts\python.exe -m pip install -q -r requirements.txt; Write-Host 'Starting backend server...'; Write-Host 'API docs: http://localhost:8000/docs'; .\venv\Scripts\python.exe -m uvicorn app.main:app --reload"
            Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand
            Write-Host "[OK] Backend server window opened" -ForegroundColor Green
        } catch {
            Write-Host "[ERROR] Failed to open backend server window: $_" -ForegroundColor Red
        }
        
        Start-Sleep -Seconds 2
        
        # Start frontend server (new window)
        Write-Host "[3/3] Starting frontend server (new window)..." -ForegroundColor Cyan
        try {
            $frontendCommand = "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; chcp 65001 | Out-Null; cd '$projectRoot\frontend'; if (-not (Test-Path 'node_modules')) { Write-Host 'Installing dependencies...'; npm install }; Write-Host 'Starting frontend server...'; Write-Host 'URL: http://localhost:3000/ar-nav'; npm run dev"
            Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand
            Write-Host "[OK] Frontend server window opened" -ForegroundColor Green
        } catch {
            Write-Host "[ERROR] Failed to open frontend server window: $_" -ForegroundColor Red
        }
        
        Write-Host "`n========================================" -ForegroundColor Cyan
        Write-Host "Full system started!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "Backend API: http://localhost:8000/docs" -ForegroundColor Cyan
        Write-Host "Frontend: http://localhost:3000/ar-nav" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Press Ctrl+C in each window to stop servers." -ForegroundColor Yellow
        Write-Host "To stop Docker container: docker-compose down" -ForegroundColor Yellow
    }
    
    "7" {
        Write-Host "`nRunning AR Navigation debug and status check..." -ForegroundColor Green
        Set-Location $projectRoot
        
        # 디버그 스크립트 실행
        $debugScript = Join-Path $PSScriptRoot "debug_ar_nav.ps1"
        if (Test-Path $debugScript) {
            & $debugScript
        } else {
            Write-Host "[ERROR] Debug script not found: $debugScript" -ForegroundColor Red
            exit 1
        }
    }
    
    "8" {
        Write-Host "`nChecking database status..." -ForegroundColor Green
        Set-Location $projectRoot
        
        # 데이터베이스 체크 스크립트 실행
        $dbCheckScript = Join-Path $PSScriptRoot "check_database.ps1"
        if (Test-Path $dbCheckScript) {
            & $dbCheckScript
        } else {
            Write-Host "[ERROR] Database check script not found: $dbCheckScript" -ForegroundColor Red
            exit 1
        }
    }
    
    default {
        Write-Host "`n[ERROR] Invalid selection. Please enter a number between 1-8." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`nDone!" -ForegroundColor Green
