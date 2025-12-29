@echo off
REM SCQ 테스트 데이터 생성 스크립트 (Windows)

cd /d "%~dp0"

REM 가상 환경 활성화 (있는 경우)
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)

REM 테스트 데이터 생성
python app\database\seed_scq_data.py

pause

