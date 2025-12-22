# 🚀 ARWay Lite - 빠른 시작 가이드

## 📋 목차
1. [사전 준비](#사전-준비)
2. [백엔드 서버 시작](#1-백엔드-서버-시작)
3. [프론트엔드 서버 시작](#2-프론트엔드-서버-시작)
4. [서비스 테스트](#3-서비스-테스트)
5. [문제 해결](#문제-해결)

---

## 사전 준비

### ✅ 필수 확인사항
- [ ] Docker Desktop 실행 중
- [ ] PostgreSQL 컨테이너 실행 중
- [ ] Node.js 18+ 설치
- [ ] Python 3.11+ 설치

### 🔍 PostgreSQL 확인
```powershell
# Docker 컨테이너 확인
docker ps

# arway-postgres 컨테이너가 실행 중이어야 함
# STATUS: Up X hours (healthy)
```

---

## 1. 백엔드 서버 시작

### 📂 터미널 1: 백엔드

```powershell
# 1. 백엔드 폴더로 이동
cd backend

# 2. 가상환경 활성화
.\venv\Scripts\activate

# 3. 서버 시작
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 또는 Python 모듈로 실행
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### ✅ 백엔드 시작 확인
서버가 정상적으로 시작되면 다음과 같은 메시지가 표시됩니다:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
2025-12-22 22:00:00,000 - app.main - INFO - ============================================================
2025-12-22 22:00:00,000 - app.main - INFO - ARWay Lite API 서버 시작
2025-12-22 22:00:00,000 - app.main - INFO - 버전: 0.1.0
2025-12-22 22:00:00,000 - app.main - INFO - 디버그 모드: True
2025-12-22 22:00:00,000 - app.main - INFO - CORS Origins: http://localhost:3000, http://localhost:3001
INFO:     Application startup complete.
```

### 🌐 백엔드 접속 확인
브라우저에서 다음 URL을 열어 확인:
- **API 문서**: http://localhost:8000/docs
- **헬스 체크**: http://localhost:8000/health
- **루트**: http://localhost:8000

---

## 2. 프론트엔드 서버 시작

### 📂 터미널 2: 프론트엔드 (새 터미널 열기)

```powershell
# 1. 프론트엔드 폴더로 이동
cd frontend

# 2. 의존성 설치 (최초 1회만)
npm install

# 3. 개발 서버 시작
npm run dev
```

### ✅ 프론트엔드 시작 확인
서버가 정상적으로 시작되면 다음과 같은 메시지가 표시됩니다:

```
> frontend@0.1.0 dev
> next dev

   ▲ Next.js 14.x.x
   - Local:        http://localhost:3000
   - Environments: .env.local

 ✓ Ready in 2.5s
```

### 🌐 프론트엔드 접속 확인
브라우저에서 다음 URL을 열어 확인:
- **메인 페이지**: http://localhost:3000
- **AR 네비게이션**: http://localhost:3000/ar-nav

---

## 3. 서비스 테스트

### 🧪 기본 기능 테스트

#### 1️⃣ **백엔드 API 테스트**
```powershell
# PowerShell에서 실행
Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing

# 응답 예시:
# StatusCode: 200
# Content: {"status":"healthy","database":"connected","version":"0.1.0"}
```

#### 2️⃣ **프론트엔드 접속 테스트**
1. 브라우저에서 http://localhost:3000/ar-nav 접속
2. Google 로그인 버튼 확인
3. 로그인 후 목적지 선택 화면 확인

#### 3️⃣ **AR 네비게이션 테스트**
1. **로그인**: Google 계정으로 로그인
2. **목적지 선택**: 
   - 지도에서 시작점 클릭 → "시작 위치로 설정"
   - 지도에서 도착점 클릭 → "도착 위치로 설정"
   - 또는 검색창에서 장소 검색
3. **네비게이션 시작**: "AR 네비게이션 시작" 버튼 클릭
4. **GPS 권한 허용**: 브라우저에서 위치 권한 허용
5. **카메라 권한 허용**: 브라우저에서 카메라 권한 허용
6. **AR 화면 확인**: 
   - 중앙에 방향 화살표 표시
   - 상단에 남은 거리 표시
   - 방향 안내 메시지 확인

### 🔍 디버그 모드 (개발자 도구)

브라우저 개발자 도구(F12)를 열고 콘솔에서 실행:

```javascript
// AR 네비게이션 종합 테스트
debugARNav()

// 결과:
// ✅ 카메라 API: 사용 가능
// ✅ GPS API: 사용 가능
// ✅ DeviceOrientation API: 사용 가능
// ✅ API 연결: 성공
```

---

## 4. 전체 플로우 테스트

### 📱 완전한 사용자 시나리오

```
1. 시작 화면 (/)
   ↓ Google 로그인
   
2. AR 네비게이션 메인 (/ar-nav)
   ↓ "네비 시작" 클릭
   
3. 목적지 선택 (/ar-nav/select)
   ↓ 지도에서 시작/도착 위치 설정
   ↓ "AR 네비게이션 시작" 클릭
   
4. AR 실행 화면 (/ar-nav/run)
   ↓ GPS 추적 시작
   ↓ 방향 화살표 표시
   ↓ 목적지까지 이동
   
5. 도착 화면 (/ar-nav/arrived)
   ✅ 완료!
```

---

## 문제 해결

### ❌ 백엔드 서버가 시작되지 않을 때

#### 문제 1: 포트 8000이 이미 사용 중
```powershell
# 포트 사용 중인 프로세스 확인
netstat -ano | findstr :8000

# 프로세스 종료 (PID 확인 후)
taskkill /PID <PID> /F
```

#### 문제 2: 데이터베이스 연결 실패
```powershell
# PostgreSQL 컨테이너 확인
docker ps | findstr postgres

# 컨테이너가 없으면 시작
docker-compose up -d postgres

# 컨테이너 로그 확인
docker logs arway-postgres
```

#### 문제 3: 가상환경 활성화 실패
```powershell
# 가상환경 재생성
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### ❌ 프론트엔드 서버가 시작되지 않을 때

#### 문제 1: 포트 3000이 이미 사용 중
```powershell
# 포트 사용 중인 프로세스 확인
netstat -ano | findstr :3000

# 프로세스 종료 (PID 확인 후)
taskkill /PID <PID> /F
```

#### 문제 2: 의존성 설치 오류
```powershell
# node_modules 삭제 후 재설치
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

#### 문제 3: 환경 변수 누락
```powershell
# .env.local 파일 확인
cd frontend
cat .env.local

# 파일이 없으면 생성
cp .env.example .env.local
# .env.local 파일 편집하여 API 키 입력
```

### ❌ CORS 에러가 발생할 때

#### 해결 방법
1. 백엔드 서버가 실행 중인지 확인
2. 백엔드 `.env` 파일에서 CORS 설정 확인:
   ```
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000
   ```
3. 백엔드 서버 재시작

### ❌ Google Maps API 오류

#### 문제: "Google Maps API 키가 설정되지 않았습니다"
```powershell
# 프론트엔드 .env.local 확인
cd frontend
cat .env.local | findstr GOOGLE_MAPS

# 출력 예시:
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

#### 해결 방법
1. Google Cloud Console에서 API 키 발급
2. `.env.local` 파일에 추가:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key
   ```
3. 프론트엔드 서버 재시작

### ❌ GPS 권한 오류

#### 문제: "위치 권한이 거부되었습니다"

#### 해결 방법
1. **Chrome**: 주소창 왼쪽 자물쇠 아이콘 → 사이트 설정 → 위치 → 허용
2. **Edge**: 주소창 왼쪽 자물쇠 아이콘 → 권한 → 위치 → 허용
3. **Firefox**: 주소창 왼쪽 자물쇠 아이콘 → 권한 → 위치 → 허용

**참고**: HTTPS 또는 localhost에서만 GPS API 사용 가능

---

## 🎯 빠른 명령어 요약

### 백엔드 시작
```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload
```

### 프론트엔드 시작
```powershell
cd frontend
npm run dev
```

### 서비스 확인
- 백엔드: http://localhost:8000/docs
- 프론트엔드: http://localhost:3000/ar-nav

### 서버 중지
- **백엔드**: `Ctrl + C`
- **프론트엔드**: `Ctrl + C`

---

## 📞 추가 도움말

### 로그 확인
```powershell
# 백엔드 로그는 터미널에 실시간 표시
# 프론트엔드 로그는 브라우저 개발자 도구(F12) 콘솔에서 확인
```

### 데이터베이스 초기화
```powershell
cd backend
.\venv\Scripts\activate

# 마이그레이션 실행
alembic upgrade head

# 시드 데이터 삽입
python -m app.database.seeds
```

### 전체 재시작
```powershell
# 1. 모든 서버 중지 (Ctrl + C)
# 2. Docker 컨테이너 재시작
docker-compose restart postgres
# 3. 백엔드 재시작
# 4. 프론트엔드 재시작
```

---

**작성일**: 2025-12-22  
**버전**: 1.0  
**문의**: 이슈 등록 또는 README.md 참조