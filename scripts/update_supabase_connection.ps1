# Supabase 연결 정보 업데이트 스크립트

Write-Host "=== Supabase 연결 정보 업데이트 ===" -ForegroundColor Cyan
Write-Host ""

# 현재 .env 파일 확인
$envPath = Join-Path $PSScriptRoot "..\backend\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "❌ .env 파일을 찾을 수 없습니다: $envPath" -ForegroundColor Red
    exit 1
}

Write-Host "현재 DATABASE_URL 확인 중..." -ForegroundColor Yellow
$currentContent = Get-Content $envPath -Raw
if ($currentContent -match 'DATABASE_URL=(.+)') {
    $currentUrl = $matches[1].Trim()
    Write-Host "현재: $currentUrl" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Supabase Dashboard에서 연결 정보를 확인하세요:" -ForegroundColor Yellow
Write-Host "1. https://supabase.com/dashboard 접속" -ForegroundColor White
Write-Host "2. 프로젝트 ARWAY 선택" -ForegroundColor White
Write-Host "3. Settings > Database 메뉴 클릭" -ForegroundColor White
Write-Host "4. Connection string 섹션에서 다음 중 하나 선택:" -ForegroundColor White
Write-Host ""
Write-Host "   옵션 A: Connection Pooling (권장)" -ForegroundColor Green
Write-Host "   형식: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres" -ForegroundColor Gray
Write-Host ""
Write-Host "   옵션 B: Direct Connection" -ForegroundColor Green
Write-Host "   형식: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -ForegroundColor Gray
Write-Host ""

$connectionString = Read-Host "연결 문자열을 입력하세요 (또는 Enter로 취소)"

if ([string]::IsNullOrWhiteSpace($connectionString)) {
    Write-Host "취소되었습니다." -ForegroundColor Yellow
    exit 0
}

# SSL 모드 확인 및 추가
if ($connectionString -notmatch 'sslmode=') {
    if ($connectionString -match '\?') {
        $connectionString += "&sslmode=require"
    } else {
        $connectionString += "?sslmode=require"
    }
    Write-Host "SSL 모드 추가됨: sslmode=require" -ForegroundColor Green
}

# .env 파일 업데이트
Write-Host ""
Write-Host ".env 파일 업데이트 중..." -ForegroundColor Yellow

# DATABASE_URL 라인 찾아서 교체
$lines = Get-Content $envPath
$updated = $false
$newLines = @()

foreach ($line in $lines) {
    if ($line -match '^DATABASE_URL=') {
        $newLines += "DATABASE_URL=$connectionString"
        $updated = $true
    } else {
        $newLines += $line
    }
}

if (-not $updated) {
    # DATABASE_URL이 없으면 추가
    $newLines += "DATABASE_URL=$connectionString"
}

$newLines | Set-Content $envPath -Encoding UTF8

Write-Host "✅ .env 파일이 업데이트되었습니다!" -ForegroundColor Green
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "1. 백엔드 서버 재시작: cd backend; .\restart_server.ps1" -ForegroundColor White
Write-Host "2. Health Check 확인: curl http://localhost:8000/health" -ForegroundColor White

