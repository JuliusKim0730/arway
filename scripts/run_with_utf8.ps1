# UTF-8 인코딩으로 스크립트 실행하는 래퍼 스크립트
# 사용법: .\run_with_utf8.ps1 test.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$ScriptName
)

# UTF-8 인코딩 강제 설정
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

# 스크립트 실행
$scriptPath = Join-Path $PSScriptRoot $ScriptName
if (Test-Path $scriptPath) {
    & $scriptPath
} else {
    Write-Host "스크립트를 찾을 수 없습니다: $scriptPath" -ForegroundColor Red
    exit 1
}

