# 백엔드 서버 시작 스크립트 (PowerShell)

Set-Location $PSScriptRoot

# 가상 환경 활성화 (있는 경우)
if (Test-Path "venv\Scripts\Activate.ps1") {
    & "venv\Scripts\Activate.ps1"
} elseif (Test-Path ".venv\Scripts\Activate.ps1") {
    & ".venv\Scripts\Activate.ps1"
}

# Python 모듈로 uvicorn 실행
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

