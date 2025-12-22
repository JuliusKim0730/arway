# ARWay Lite 배포 스크립트 (PowerShell)

# UTF-8 인코딩 설정 (한글 출력을 위해 필요)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Write-Host "🚀 ARWay Lite 배포 시작..." -ForegroundColor Green

# 1. 데이터베이스 마이그레이션
Write-Host "📦 데이터베이스 마이그레이션 실행..." -ForegroundColor Yellow
Set-Location backend
alembic upgrade head

# 2. 시드 데이터 생성
Write-Host "🌱 시드 데이터 생성..." -ForegroundColor Yellow
python -m app.database.seeds

# 3. Docker Compose 시작
Write-Host "🐳 Docker Compose 시작..." -ForegroundColor Yellow
Set-Location ..
docker-compose up -d

Write-Host "✅ 배포 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "서비스 접속 정보:" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:3000/ar-nav"
Write-Host "- Backend API: http://localhost:8000"
Write-Host "- API 문서: http://localhost:8000/docs"
Write-Host "- Admin: http://localhost:3001"

