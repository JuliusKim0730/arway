# SCQ 백엔드 서버 빠른 시작 가이드

**작성일**: 2025-12-22

---

## 🚀 빠른 시작

### 1. 가상 환경 활성화 및 서버 실행

#### PowerShell에서 실행
```powershell
cd backend

# 가상 환경 활성화
.\venv\Scripts\Activate.ps1

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 또는 Python 모듈로 직접 실행 (가상 환경 없이도 가능)
```powershell
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. 테스트 데이터 생성

#### PowerShell에서 실행
```powershell
cd backend

# 가상 환경 활성화 (이미 활성화되어 있으면 생략)
.\venv\Scripts\Activate.ps1

# 테스트 데이터 생성
python app\database\seed_scq_data.py
```

#### 또는 배치 파일 사용
```cmd
cd backend
seed_scq_data.bat
```

---

## ✅ 서버 실행 확인

서버가 정상 실행되면 다음 URL에서 확인 가능:

- **API 문서**: http://localhost:8000/docs
- **헬스 체크**: http://localhost:8000/health
- **루트**: http://localhost:8000/

---

## 🧪 API 테스트

### PowerShell에서 curl 대신 Invoke-WebRequest 사용

```powershell
# 헬스 체크
Invoke-WebRequest -Uri "http://localhost:8000/health" | Select-Object -ExpandProperty Content

# 건물 목록
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/buildings" | Select-Object -ExpandProperty Content

# 지오펜스 조회
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/geofences?lat=37.4979&lng=127.0276&radius=1000" | Select-Object -ExpandProperty Content

# POI 조회
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/pois?lat=37.4979&lng=127.0276&radius=100" | Select-Object -ExpandProperty Content
```

---

## 🔧 문제 해결

### 문제: 'uvicorn' 용어가 인식되지 않음

**해결 방법**: Python 모듈로 실행
```powershell
python -m uvicorn app.main:app --reload
```

### 문제: 가상 환경 활성화 오류

**해결 방법**: 실행 정책 변경 (관리자 권한 필요)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📋 체크리스트

- [ ] 가상 환경 활성화 또는 Python 모듈로 실행
- [ ] 서버 정상 실행 확인
- [ ] 테스트 데이터 생성
- [ ] API 엔드포인트 테스트
- [ ] 프론트엔드와 연동 테스트

---

**다음 단계**: 프론트엔드 개발 서버 실행 및 통합 테스트

