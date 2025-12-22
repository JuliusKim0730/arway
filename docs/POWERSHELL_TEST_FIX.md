# PowerShell 테스트 실행 수정 가이드

**작성일**: 2024년 12월 22일  
**문제**: PowerShell에서 `.\venv\Scripts\activate` 명령이 작동하지 않음

---

## ✅ 해결 방법

### 문제점
PowerShell에서 `.\venv\Scripts\activate` 명령이 인식되지 않는 경우가 있습니다.

### 해결책: 직접 Python 실행

**기존 방법 (작동하지 않을 수 있음)**:
```powershell
.\venv\Scripts\activate
pytest tests/ -v
```

**권장 방법 (PowerShell)**:
```powershell
.\venv\Scripts\python.exe -m pytest tests/ -v
```

---

## 📝 올바른 테스트 실행 방법

### 백엔드 테스트

```powershell
cd "C:\Cursor Project\new_challange\backend"

# 1. 가상환경 생성 (처음 한 번만)
python -m venv venv

# 2. 의존성 설치
.\venv\Scripts\python.exe -m pip install -r requirements.txt

# 3. 테스트 실행
.\venv\Scripts\python.exe -m pytest tests/ -v
```

### 백엔드 서버 실행

```powershell
cd "C:\Cursor Project\new_challange\backend"
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

---

## 🔧 대안: Activate.ps1 사용

만약 가상환경 활성화를 사용하고 싶다면:

### 1. 실행 정책 확인
```powershell
Get-ExecutionPolicy
```

### 2. 실행 정책 변경 (필요한 경우)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 3. 가상환경 활성화
```powershell
.\venv\Scripts\Activate.ps1
```

**주의**: `.ps1` 확장자를 명시해야 합니다.

---

## ✅ 테스트 결과

**성공적인 테스트 실행 결과**:
```
============================= test session starts =============================
platform win32 -- Python 3.13.3, pytest-9.0.2, pluggy-1.6.0
collecting ... collected 16 items

tests/test_analytics.py::test_get_stats PASSED
tests/test_destinations.py::test_create_destination PASSED
tests/test_destinations.py::test_get_destinations PASSED
tests/test_destinations.py::test_get_destination_by_id PASSED
tests/test_destinations.py::test_update_destination PASSED
tests/test_destinations.py::test_search_destinations PASSED
tests/test_integration.py::test_full_navigation_flow PASSED
tests/test_integration.py::test_user_session_relationship PASSED
tests/test_sessions.py::test_create_session PASSED
tests/test_sessions.py::test_get_session PASSED
tests/test_sessions.py::test_list_sessions PASSED
tests/test_sessions.py::test_update_session PASSED
tests/test_users.py::test_create_user PASSED
tests/test_users.py::test_create_duplicate_user PASSED
tests/test_users.py::test_get_user PASSED
tests/test_users.py::test_get_nonexistent_user PASSED

============================= 16 passed in 0.51s ==============================
```

---

## 📚 참고사항

### email-validator 설치 확인

`requirements.txt`에 이미 포함되어 있지만, 설치가 안 된 경우:

```powershell
.\venv\Scripts\python.exe -m pip install email-validator
# 또는
.\venv\Scripts\python.exe -m pip install 'pydantic[email]'
```

### 가상환경 확인

```powershell
# 가상환경 존재 확인
Test-Path "venv\Scripts\python.exe"

# Python 버전 확인
.\venv\Scripts\python.exe --version

# 설치된 패키지 확인
.\venv\Scripts\python.exe -m pip list
```

---

## 🎯 빠른 명령어 모음

```powershell
# 백엔드 테스트
cd backend; .\venv\Scripts\python.exe -m pytest tests/ -v

# 백엔드 서버 실행
cd backend; .\venv\Scripts\python.exe -m uvicorn app.main:app --reload

# 의존성 재설치
cd backend; .\venv\Scripts\python.exe -m pip install -r requirements.txt
```

---

**마지막 업데이트**: 2024년 12월 22일

