# ARWay Lite 프로젝트 설정 스크립트 (PowerShell)

# UTF-8 인코딩 설정 (한글 출력을 위해 필요)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Write-Host "🚀 ARWay Lite 프로젝트 설정 시작..." -ForegroundColor Cyan

# 1. Frontend 의존성 설치
Write-Host "📦 Frontend 의존성 설치 중..." -ForegroundColor Yellow
Set-Location frontend
if (-not (Test-Path "node_modules")) {
    npm install
}
Set-Location ..

# 2. Backend 가상환경 및 의존성 설치
Write-Host "🐍 Backend 가상환경 설정 중..." -ForegroundColor Yellow
Set-Location backend
if (-not (Test-Path "venv")) {
    python -m venv venv
}
& .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Set-Location ..

# 3. 환경 변수 파일 복사
Write-Host "⚙️ 환경 변수 파일 설정 중..." -ForegroundColor Yellow
if (-not (Test-Path "frontend\.env.local")) {
    Copy-Item frontend\.env.example frontend\.env.local
}
if (-not (Test-Path "backend\.env")) {
    Copy-Item backend\.env.example backend\.env
}

Write-Host "✅ 설정 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Cyan
Write-Host "1. PostgreSQL 데이터베이스 생성"
Write-Host "2. backend\.env 파일 수정 (DATABASE_URL 확인)"
Write-Host "3. docker-compose up -d (또는 로컬 PostgreSQL 사용)"
Write-Host "4. alembic upgrade head (데이터베이스 마이그레이션)"
Write-Host "5. npm run dev (frontend)"
Write-Host "6. uvicorn app.main:app --reload (backend)"
