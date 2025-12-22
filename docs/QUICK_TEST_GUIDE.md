# 빠른 테스트 가이드

**작성일**: 2024년 12월 22일

---

## 🚀 빠른 시작 (3단계)

### 1단계: 백엔드 테스트 실행

```powershell
cd "C:\Cursor Project\new_challange\backend"

# 가상환경이 없으면 생성
if (-not (Test-Path "venv")) {
    python -m venv venv
}

# 의존성 설치
.\venv\Scripts\python.exe -m pip install -r requirements.txt

# 테스트 실행 (PowerShell에서는 직접 python 실행)
.\venv\Scripts\python.exe -m pytest tests/ -v
```

**예상 결과**: `16 passed` 메시지 확인

---

### 2단계: 프론트엔드 테스트 실행

```powershell
cd "C:\Cursor Project\new_challange\frontend"
npm test
```

**예상 결과**: 모든 테스트 통과 확인

---

### 3단계: 실제 앱 테스트 (수동)

#### 서버 실행 (3개 터미널 필요)

**터미널 1 - PostgreSQL**:
```powershell
cd "C:\Cursor Project\new_challange"
docker-compose up -d postgres
```

**터미널 2 - 백엔드**:
```powershell
cd "C:\Cursor Project\new_challange\backend"
.\venv\Scripts\activate
uvicorn app.main:app --reload
```

**터미널 3 - 프론트엔드**:
```powershell
cd "C:\Cursor Project\new_challange\frontend"
npm run dev
```

#### 브라우저에서 테스트

1. http://localhost:3000/ar-nav 접속
2. "도보 AR 네비 시작" 클릭
3. 목적지 선택
4. AR 네비게이션 테스트
5. 도착 화면 확인

---

## 📋 자동화 스크립트 사용

### PowerShell 스크립트 실행

```powershell
cd "C:\Cursor Project\new_challange"
.\scripts\test.ps1
```

**선택 옵션**:
- `1`: 백엔드 테스트만
- `2`: 프론트엔드 테스트만
- `3`: 전체 테스트 실행
- `4`: 백엔드 서버 실행
- `5`: 프론트엔드 서버 실행
- `6`: 전체 시스템 실행 (Docker + Backend + Frontend)

---

## ✅ 체크리스트

### 백엔드 테스트
- [ ] `pytest tests/ -v` 실행
- [ ] 모든 테스트 통과 확인 (15개)
- [ ] 에러 없음 확인

### 프론트엔드 테스트
- [ ] `npm test` 실행
- [ ] 모든 테스트 통과 확인
- [ ] 에러 없음 확인

### 수동 테스트
- [ ] 시작 화면 로드 확인
- [ ] 목적지 선택 화면 확인
- [ ] AR 네비게이션 화면 확인
- [ ] 도착 화면 확인

### 실제 기기 테스트 (선택사항)
- [ ] 모바일 기기에서 접속
- [ ] GPS 권한 확인
- [ ] 카메라 권한 확인
- [ ] 실제 네비게이션 테스트

---

## 🐛 문제 해결

### 백엔드 테스트 실패
```powershell
# 가상환경 재생성
cd backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m pytest tests/ -v
```

**PowerShell 주의사항**:
- `.\venv\Scripts\activate` 대신 `.\venv\Scripts\python.exe` 직접 사용 권장
- 또는 `.\venv\Scripts\Activate.ps1` 사용 (실행 정책 확인 필요)

### 프론트엔드 테스트 실패
```powershell
# node_modules 재설치
cd frontend
rm -rf node_modules
npm install
npm test
```

### 서버 실행 실패
```powershell
# 포트 확인
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# 포트가 사용 중이면 다른 프로세스 종료
```

---

## 📚 상세 가이드

더 자세한 내용은 `TEST_GUIDE_COMPLETE.md` 파일을 참조하세요.

---

**마지막 업데이트**: 2024년 12월 22일

