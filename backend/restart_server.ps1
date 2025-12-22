# 백엔드 서버 재시작 스크립트

Write-Host "=== ARWay Lite Backend Server 재시작 ===" -ForegroundColor Cyan

# 포트 8000을 사용하는 프로세스 찾기 및 종료
Write-Host "`n기존 서버 프로세스 확인 중..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($pid in $processes) {
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($proc -and $proc.Path -like "*uvicorn*" -or $proc.CommandLine -like "*uvicorn*") {
            Write-Host "프로세스 종료 중: PID $pid ($($proc.ProcessName))" -ForegroundColor Yellow
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
}

# 가상환경 확인
if (-not (Test-Path "venv\Scripts\python.exe")) {
    Write-Host "❌ 가상환경을 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "가상환경 생성: python -m venv venv" -ForegroundColor Yellow
    exit 1
}

# 환경 변수 확인
if (-not (Test-Path ".env")) {
    Write-Host "⚠️ .env 파일이 없습니다. 기본 설정을 사용합니다." -ForegroundColor Yellow
}

# 서버 시작
Write-Host "`n서버 시작 중..." -ForegroundColor Green
Write-Host "접속 주소: http://localhost:8000" -ForegroundColor Green
Write-Host "API 문서: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "Health Check: http://localhost:8000/health" -ForegroundColor Green
Write-Host "`n종료하려면 Ctrl+C를 누르세요.`n" -ForegroundColor Yellow

.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

