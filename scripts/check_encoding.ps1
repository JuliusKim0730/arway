# UTF-8 인코딩 확인 및 수정 스크립트
# PowerShell 스크립트 파일들의 인코딩을 확인하고 UTF-8로 변환

# UTF-8 인코딩 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PowerShell 스크립트 인코딩 확인" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $PSScriptRoot
$scriptsPath = Join-Path $scriptDir "scripts"

if (-not (Test-Path $scriptsPath)) {
    Write-Host "scripts 폴더를 찾을 수 없습니다: $scriptsPath" -ForegroundColor Red
    exit 1
}

Write-Host "스크립트 폴더: $scriptsPath" -ForegroundColor Yellow
Write-Host ""

$ps1Files = Get-ChildItem -Path $scriptsPath -Filter "*.ps1" -File

if ($ps1Files.Count -eq 0) {
    Write-Host "PowerShell 스크립트 파일을 찾을 수 없습니다." -ForegroundColor Yellow
    exit 0
}

Write-Host "발견된 PowerShell 스크립트 파일 ($($ps1Files.Count)개):" -ForegroundColor Green
Write-Host ""

$hasUtf8Header = @"
# UTF-8 인코딩 설정 (한글 출력을 위해 필요)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
`$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null
"@

foreach ($file in $ps1Files) {
    Write-Host "파일: $($file.Name)" -ForegroundColor Cyan
    
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $hasEncoding = $content -match "UTF-8 인코딩 설정"
    
    if ($hasEncoding) {
        Write-Host "  ✅ UTF-8 인코딩 설정 있음" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  UTF-8 인코딩 설정 없음" -ForegroundColor Yellow
        
        # 파일 시작 부분에 UTF-8 설정 추가
        $lines = Get-Content $file.FullName -Encoding UTF8
        $firstLine = $lines[0]
        
        # 주석이 아닌 첫 줄 찾기
        $insertIndex = 0
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -notmatch "^\s*#") {
                $insertIndex = $i
                break
            }
        }
        
        # UTF-8 설정 추가
        $newContent = $lines[0..($insertIndex-1)] + $hasUtf8Header.Split("`n") + $lines[$insertIndex..($lines.Count-1)]
        
        # UTF-8 BOM으로 저장
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllLines($file.FullName, $newContent, $utf8NoBom)
        
        Write-Host "  ✅ UTF-8 인코딩 설정 추가됨" -ForegroundColor Green
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "인코딩 확인 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

