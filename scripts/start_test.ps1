# ARWay Lite 테스트 실행 스크립트 (UTF-8 강제 설정)
# 이 스크립트는 UTF-8 인코딩을 강제로 설정한 후 test.ps1을 실행합니다

# UTF-8 인코딩 강제 설정
chcp 65001 | Out-Null
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# 현재 디렉토리 확인
$scriptDir = Split-Path -Parent $PSScriptRoot
Set-Location $scriptDir

# test.ps1 실행
$testScript = Join-Path $PSScriptRoot "test.ps1"
if (Test-Path $testScript) {
    & $testScript
} else {
    Write-Host "test.ps1 파일을 찾을 수 없습니다: $testScript" -ForegroundColor Red
    exit 1
}

