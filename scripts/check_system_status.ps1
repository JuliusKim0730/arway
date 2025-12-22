# 전체 시스템 상태 체크 스크립트

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  전체 시스템 상태 체크" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$errors = @()
$warnings = @()
$success = @()

# 1. Supabase 연결 정보 확인
Write-Host "1. Supabase 연결 정보 확인" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$envPath = Join-Path $PSScriptRoot "..\backend\.env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    
    if ($envContent -match 'DATABASE_URL=(.+)') {
        $dbUrl = $matches[1].Trim()
        Write-Host "✅ DATABASE_URL 설정됨" -ForegroundColor Green
        Write-Host "   $($dbUrl -replace ':[^@]+@', ':****@')" -ForegroundColor Gray
        
        if ($dbUrl -match 'pooler\.supabase\.com') {
            Write-Host "✅ 연결 풀러 사용 중" -ForegroundColor Green
            $success += "연결 풀러 사용"
        } else {
            Write-Host "⚠️  직접 연결 사용 중" -ForegroundColor Yellow
            $warnings += "직접 연결 사용 (연결 풀러 권장)"
        }
    } else {
        Write-Host "❌ DATABASE_URL 없음" -ForegroundColor Red
        $errors += "DATABASE_URL 설정 필요"
    }
    
    if ($envContent -match 'SUPABASE_URL=(.+)') {
        $supabaseUrl = $matches[1].Trim()
        Write-Host "✅ SUPABASE_URL 설정됨: $supabaseUrl" -ForegroundColor Green
        $success += "Supabase URL 설정"
    } else {
        Write-Host "⚠️  SUPABASE_URL 없음" -ForegroundColor Yellow
        $warnings += "SUPABASE_URL 설정 권장"
    }
} else {
    Write-Host "❌ .env 파일 없음" -ForegroundColor Red
    $errors += ".env 파일 생성 필요"
}

Write-Host ""

# 2. 데이터베이스 연결 테스트
Write-Host "2. 데이터베이스 연결 테스트" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$backendPath = Join-Path $PSScriptRoot "..\backend"
if (Test-Path $backendPath) {
    Push-Location $backendPath
    
    try {
        $pythonExe = Join-Path $backendPath "venv\Scripts\python.exe"
        if (Test-Path $pythonExe) {
            $testResult = & $pythonExe -c "from app.database import engine; from sqlalchemy import text; conn = engine.connect(); result = conn.execute(text('SELECT version()')); print('Connected:', result.fetchone()[0][:50]); conn.close()" 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ 데이터베이스 연결 성공" -ForegroundColor Green
                $success += "데이터베이스 연결"
            } else {
                Write-Host "❌ 데이터베이스 연결 실패" -ForegroundColor Red
                Write-Host "   $testResult" -ForegroundColor Gray
                $errors += "데이터베이스 연결 실패"
            }
        } else {
            Write-Host "⚠️  Python 가상환경 없음" -ForegroundColor Yellow
            $warnings += "가상환경 설정 필요"
        }
    } catch {
        Write-Host "❌ 연결 테스트 실패: $_" -ForegroundColor Red
        $errors += "데이터베이스 연결 테스트 실패"
    }
    
    Pop-Location
} else {
    Write-Host "❌ backend 폴더 없음" -ForegroundColor Red
    $errors += "backend 폴더 없음"
}

Write-Host ""

# 3. 백엔드 서버 상태 확인
Write-Host "3. 백엔드 서버 상태 확인" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    $healthData = $response.Content | ConvertFrom-Json
    
    if ($healthData.status -eq "healthy" -and $healthData.database -eq "connected") {
        Write-Host "✅ 백엔드 서버 실행 중" -ForegroundColor Green
        Write-Host "✅ Health Check: $($healthData.status)" -ForegroundColor Green
        Write-Host "✅ 데이터베이스: $($healthData.database)" -ForegroundColor Green
        $success += "백엔드 서버 실행 중"
    } else {
        Write-Host "⚠️  백엔드 서버 상태: $($healthData.status)" -ForegroundColor Yellow
        Write-Host "⚠️  데이터베이스: $($healthData.database)" -ForegroundColor Yellow
        if ($healthData.error) {
            Write-Host "   오류: $($healthData.error)" -ForegroundColor Red
        }
        $warnings += "백엔드 서버 상태 불안정"
    }
} catch {
    Write-Host "❌ 백엔드 서버 연결 실패" -ForegroundColor Red
    Write-Host "   서버가 실행 중이지 않거나 포트 8000이 사용 중입니다" -ForegroundColor Gray
    $errors += "백엔드 서버 미실행"
}

Write-Host ""

# 4. API 엔드포인트 확인
Write-Host "4. API 엔드포인트 확인" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$endpoints = @(
    @{Path="/"; Name="Root"},
    @{Path="/health"; Name="Health Check"},
    @{Path="/docs"; Name="API Documentation"}
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000$($endpoint.Path)" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        Write-Host "✅ $($endpoint.Name): $($endpoint.Path) (Status: $($response.StatusCode))" -ForegroundColor Green
        $success += "API 엔드포인트: $($endpoint.Path)"
    } catch {
        Write-Host "❌ $($endpoint.Name): $($endpoint.Path) - 연결 실패" -ForegroundColor Red
        $errors += "API 엔드포인트 실패: $($endpoint.Path)"
    }
}

Write-Host ""

# 5. Python 라이브러리 설치 확인
Write-Host "5. Python 라이브러리 설치 확인" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$backendPath = Join-Path $PSScriptRoot "..\backend"
if (Test-Path $backendPath) {
    Push-Location $backendPath
    
    $requiredLibs = @(
        "fastapi",
        "uvicorn",
        "sqlalchemy",
        "psycopg2",
        "pydantic",
        "alembic"
    )
    
    $pythonExe = Join-Path $backendPath "venv\Scripts\python.exe"
    if (Test-Path $pythonExe) {
        foreach ($lib in $requiredLibs) {
            $checkResult = & $pythonExe -c "import $($lib.Replace('-', '_')); print('OK')" 2>&1
            if ($LASTEXITCODE -eq 0) {
                $version = & $pythonExe -c "import $($lib.Replace('-', '_')); print(getattr($($lib.Replace('-', '_')), '__version__', 'unknown'))" 2>&1
                Write-Host "✅ $lib : $version" -ForegroundColor Green
                $success += "라이브러리: $lib"
            } else {
                Write-Host "❌ $lib : 설치되지 않음" -ForegroundColor Red
                $errors += "라이브러리 누락: $lib"
            }
        }
    } else {
        Write-Host "⚠️  Python 가상환경 없음" -ForegroundColor Yellow
        $warnings += "가상환경 설정 필요"
    }
    
    Pop-Location
}

Write-Host ""

# 6. 프론트엔드 설정 확인
Write-Host "6. 프론트엔드 설정 확인" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$frontendPath = Join-Path $PSScriptRoot "..\frontend"
if (Test-Path $frontendPath) {
    $frontendEnvPath = Join-Path $frontendPath ".env.local"
    if (Test-Path $frontendEnvPath) {
        $frontendEnv = Get-Content $frontendEnvPath -Raw
        
        if ($frontendEnv -match 'NEXT_PUBLIC_API_URL') {
            Write-Host "✅ NEXT_PUBLIC_API_URL 설정됨" -ForegroundColor Green
            $success += "프론트엔드 API URL 설정"
        } else {
            Write-Host "⚠️  NEXT_PUBLIC_API_URL 없음" -ForegroundColor Yellow
            $warnings += "프론트엔드 API URL 설정 필요"
        }
        
        if ($frontendEnv -match 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY') {
            Write-Host "✅ Google Maps API Key 설정됨" -ForegroundColor Green
            $success += "Google Maps API Key 설정"
        } else {
            Write-Host "⚠️  Google Maps API Key 없음" -ForegroundColor Yellow
            $warnings += "Google Maps API Key 설정 필요"
        }
    } else {
        Write-Host "⚠️  .env.local 파일 없음" -ForegroundColor Yellow
        $warnings += "프론트엔드 .env.local 파일 생성 필요"
    }
} else {
    Write-Host "⚠️  frontend 폴더 없음" -ForegroundColor Yellow
    $warnings += "frontend 폴더 없음"
}

Write-Host ""

# 7. 요약
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  체크 결과 요약" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "✅ 성공: $($success.Count)개" -ForegroundColor Green
foreach ($item in $success) {
    Write-Host "   - $item" -ForegroundColor Gray
}

Write-Host "`n⚠️  경고: $($warnings.Count)개" -ForegroundColor Yellow
foreach ($item in $warnings) {
    Write-Host "   - $item" -ForegroundColor Gray
}

Write-Host "`n❌ 오류: $($errors.Count)개" -ForegroundColor Red
foreach ($item in $errors) {
    Write-Host "   - $item" -ForegroundColor Gray
}

Write-Host ""

if ($errors.Count -eq 0) {
    Write-Host "✅ 모든 체크 통과!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ 일부 체크 실패. 위의 오류를 확인하세요." -ForegroundColor Red
    exit 1
}

