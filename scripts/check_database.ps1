# Database Status Check Script
# PowerShell Script

# UTF-8 encoding settings
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Status Check" -ForegroundColor Cyan
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

# Check Docker PostgreSQL container status
Write-Host "[0/4] Checking Docker PostgreSQL container..." -ForegroundColor Yellow
Set-Location $projectRoot
try {
    $dockerPs = docker ps -a --filter "name=postgres" --format "{{.Names}} {{.Status}}" 2>&1
    if ($dockerPs -like "*postgres*") {
        if ($dockerPs -like "*Up*") {
            Write-Host "  [OK] PostgreSQL container is running" -ForegroundColor Green
        } else {
            Write-Host "  [WARN] PostgreSQL container exists but is not running" -ForegroundColor Yellow
            Write-Host "  Attempting to start container..." -ForegroundColor Yellow
            docker-compose up -d postgres 2>&1 | Out-Null
            Start-Sleep -Seconds 3
            Write-Host "  [OK] Container started" -ForegroundColor Green
        }
    } else {
        Write-Host "  [WARN] PostgreSQL container not found" -ForegroundColor Yellow
        Write-Host "  Attempting to start container..." -ForegroundColor Yellow
        docker-compose up -d postgres 2>&1 | Out-Null
        Start-Sleep -Seconds 3
        Write-Host "  [OK] Container started" -ForegroundColor Green
    }
} catch {
    Write-Host "  [WARN] Could not check Docker container (Docker may not be installed)" -ForegroundColor Yellow
    Write-Host "  Error: $_" -ForegroundColor Gray
}
Write-Host ""

Set-Location "$projectRoot\backend"

Write-Host "[1/4] Checking database connection..." -ForegroundColor Yellow
try {
    $result = & "venv\Scripts\python.exe" -c "from app.database import engine; from sqlalchemy import text; conn = engine.connect(); conn.execute(text('SELECT 1')); conn.close(); print('OK')" 2>&1
    if ($LASTEXITCODE -eq 0 -and $result -like "*OK*") {
        Write-Host "  [OK] Database connection successful" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] Database connection failed" -ForegroundColor Red
        
        # Extract meaningful error message
        $errorMsg = $result -join "`n"
        if ($errorMsg -like "*Connection refused*" -or $errorMsg -like "*port 5433*") {
            Write-Host "  Error: PostgreSQL server is not running on port 5433" -ForegroundColor Red
            Write-Host ""
            Write-Host "  [SOLUTION] Start PostgreSQL container:" -ForegroundColor Yellow
            Write-Host "    cd $projectRoot" -ForegroundColor White
            Write-Host "    docker-compose up -d postgres" -ForegroundColor White
            Write-Host ""
            Write-Host "  Or check if PostgreSQL is running on a different port" -ForegroundColor Yellow
        } else {
            Write-Host "  Error: $errorMsg" -ForegroundColor Red
        }
        exit 1
    }
} catch {
    Write-Host "  [ERROR] Database connection check failed" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "[2/4] Checking database migrations..." -ForegroundColor Yellow
try {
    $migrationResult = & "venv\Scripts\python.exe" -m alembic current 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Migration check successful" -ForegroundColor Green
        Write-Host "  Current migration: $migrationResult" -ForegroundColor Gray
    } else {
        Write-Host "  [WARN] Migration check failed or no migrations found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [WARN] Could not check migrations" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[3/4] Checking if tables exist..." -ForegroundColor Yellow
try {
    $tablesResult = & "venv\Scripts\python.exe" -c "from app.database import engine; from sqlalchemy import inspect; inspector = inspect(engine); tables = inspector.get_table_names(); print('Tables:', ', '.join(tables) if tables else 'No tables found')" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Table check successful" -ForegroundColor Green
        Write-Host "  $tablesResult" -ForegroundColor Gray
        
        if ($tablesResult -like "*No tables found*") {
            Write-Host ""
            Write-Host "  [WARN] No tables found in database!" -ForegroundColor Yellow
            Write-Host "  [TIP] Run migrations:" -ForegroundColor Yellow
            Write-Host "        alembic upgrade head" -ForegroundColor White
            Write-Host "        python app/database/seeds.py" -ForegroundColor White
        }
    } else {
        Write-Host "  [ERROR] Table check failed" -ForegroundColor Red
        Write-Host "  Error: $tablesResult" -ForegroundColor Red
    }
} catch {
    Write-Host "  [ERROR] Could not check tables" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "[4/4] Checking database URL configuration..." -ForegroundColor Yellow
try {
    $dbUrl = & "venv\Scripts\python.exe" -c "from app.config import settings; print(settings.database_url)" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Database URL configured" -ForegroundColor Green
        Write-Host "  URL: $dbUrl" -ForegroundColor Gray
    } else {
        Write-Host "  [WARN] Could not read database URL" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [WARN] Could not check database URL" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If database connection failed:" -ForegroundColor White
Write-Host "  1. Start PostgreSQL container:" -ForegroundColor Yellow
Write-Host "     cd $projectRoot" -ForegroundColor White
Write-Host "     docker-compose up -d postgres" -ForegroundColor White
Write-Host ""
Write-Host "  2. Wait a few seconds for PostgreSQL to start" -ForegroundColor Yellow
Write-Host ""
Write-Host "If database is not initialized:" -ForegroundColor White
Write-Host "  1. cd backend" -ForegroundColor Yellow
Write-Host "  2. .\venv\Scripts\python.exe -m alembic upgrade head" -ForegroundColor White
Write-Host "  3. .\venv\Scripts\python.exe app\database\seeds.py" -ForegroundColor White
Write-Host ""

