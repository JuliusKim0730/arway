# PostgreSQL 데이터베이스 및 사용자 생성 스크립트 (PowerShell)
# 기존 PostgreSQL에 실행

# UTF-8 인코딩 설정 (한글 출력을 위해 필요)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL 데이터베이스 설정" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# PostgreSQL 관리자 사용자 확인
$pgUser = Read-Host "PostgreSQL 관리자 사용자명 (기본: postgres)"
if ([string]::IsNullOrWhiteSpace($pgUser)) {
    $pgUser = "postgres"
}

Write-Host ""
Write-Host "다음 명령어를 실행하여 데이터베이스와 사용자를 생성하세요:" -ForegroundColor Yellow
Write-Host ""
Write-Host "psql -U $pgUser -f scripts\create_db.sql" -ForegroundColor Green
Write-Host ""
Write-Host "또는 수동으로 다음 SQL을 실행하세요:" -ForegroundColor Yellow
Write-Host ""
Write-Host "-- 데이터베이스 생성" -ForegroundColor Cyan
Write-Host "CREATE DATABASE arway_lite;" -ForegroundColor White
Write-Host ""
Write-Host "-- 사용자 생성" -ForegroundColor Cyan
Write-Host "CREATE USER arway_user WITH PASSWORD 'password';" -ForegroundColor White
Write-Host ""
Write-Host "-- 권한 부여" -ForegroundColor Cyan
Write-Host "GRANT ALL PRIVILEGES ON DATABASE arway_lite TO arway_user;" -ForegroundColor White
Write-Host ""
Write-Host "\c arway_lite" -ForegroundColor White
Write-Host "GRANT ALL ON SCHEMA public TO arway_user;" -ForegroundColor White
Write-Host "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO arway_user;" -ForegroundColor White
Write-Host ""

