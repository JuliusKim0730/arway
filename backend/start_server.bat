@echo off
REM 백엔드 서버 시작 스크립트 (Windows)

cd /d "%~dp0"

REM 가상 환경 활성화 (있는 경우)
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)

REM Python 모듈로 uvicorn 실행
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause

