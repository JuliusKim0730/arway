# ARWay Lite 의존성 설치 스크립트 (PowerShell)

# UTF-8 인코딩 설정 (한글 출력을 위해 필요)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Write-Host "🚀 ARWay Lite 의존성 설치 시작..." -ForegroundColor Green

# 1. Backend 의존성 설치
Write-Host "`n📦 Backend 의존성 설치 중..." -ForegroundColor Yellow
Set-Location backend

# 가상환경 확인 및 생성
if (-not (Test-Path "venv")) {
    Write-Host "가상환경 생성 중..." -ForegroundColor Cyan
    python -m venv venv
}

# 가상환경 활성화
Write-Host "가상환경 활성화 중..." -ForegroundColor Cyan
& ".\venv\Scripts\Activate.ps1"

# 의존성 설치
Write-Host "Python 패키지 설치 중..." -ForegroundColor Cyan
pip install -r requirements.txt --quiet

Write-Host "✅ Backend 의존성 설치 완료" -ForegroundColor Green
Set-Location ..

# 2. Frontend 의존성 설치
Write-Host "`n📦 Frontend 의존성 설치 중..." -ForegroundColor Yellow
Set-Location frontend

if (-not (Test-Path "node_modules")) {
    Write-Host "npm 패키지 설치 중..." -ForegroundColor Cyan
    npm install --silent
} else {
    Write-Host "node_modules가 이미 존재합니다. 건너뜁니다." -ForegroundColor Gray
}

Write-Host "✅ Frontend 의존성 설치 완료" -ForegroundColor Green
Set-Location ..

# 3. Admin 의존성 설치
Write-Host "`n📦 Admin 의존성 설치 중..." -ForegroundColor Yellow
Set-Location admin

if (-not (Test-Path "node_modules")) {
    Write-Host "npm 패키지 설치 중..." -ForegroundColor Cyan
    npm install --silent
} else {
    Write-Host "node_modules가 이미 존재합니다. 건너뜁니다." -ForegroundColor Gray
}

Write-Host "✅ Admin 의존성 설치 완료" -ForegroundColor Green
Set-Location ..

# 4. 환경 변수 파일 확인
Write-Host "`n🔧 환경 변수 파일 확인 중..." -ForegroundColor Yellow

# Backend .env
if (-not (Test-Path "backend\.env")) {
    Write-Host "backend\.env 파일이 없습니다. .env.example을 복사합니다..." -ForegroundColor Cyan
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "⚠️ backend\.env 파일을 확인하고 DATABASE_URL을 수정하세요." -ForegroundColor Yellow
} else {
    Write-Host "✅ backend\.env 파일 존재" -ForegroundColor Green
}

# Frontend .env.local
if (-not (Test-Path "frontend\.env.local")) {
    Write-Host "frontend\.env.local 파일이 없습니다. .env.example을 복사합니다..." -ForegroundColor Cyan
    Copy-Item "frontend\.env.example" "frontend\.env.local"
    Write-Host "✅ frontend\.env.local 파일 생성 완료" -ForegroundColor Green
} else {
    Write-Host "✅ frontend\.env.local 파일 존재" -ForegroundColor Green
}

# Admin .env.local
if (-not (Test-Path "admin\.env.local")) {
    Write-Host "admin\.env.local 파일이 없습니다. .env.example을 복사합니다..." -ForegroundColor Cyan
    Copy-Item "admin\.env.example" "admin\.env.local"
    Write-Host "✅ admin\.env.local 파일 생성 완료" -ForegroundColor Green
} else {
    Write-Host "✅ admin\.env.local 파일 존재" -ForegroundColor Green
}

Write-Host "`n✅ 모든 의존성 설치 완료!" -ForegroundColor Green
Write-Host "`n다음 단계:" -ForegroundColor Cyan
Write-Host "1. backend\.env 파일에서 DATABASE_URL 확인 및 수정"
Write-Host "2. 데이터베이스 마이그레이션 실행: cd backend && alembic upgrade head"
Write-Host "3. 시드 데이터 생성: python -m app.database.seeds"
Write-Host "4. 서버 실행:"
Write-Host "   - Backend: cd backend && uvicorn app.main:app --reload"
Write-Host "   - Frontend: cd frontend && npm run dev"
Write-Host "   - Admin: cd admin && npm run dev"

