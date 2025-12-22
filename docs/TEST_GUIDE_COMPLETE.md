# ARWay Lite 테스트 가이드 (완전판)

**작성일**: 2024년 12월 22일  
**프로젝트**: ARWay Lite (SCQ 기반 AR 도보 네비 MVP)

---

## 📋 목차

1. [사전 준비](#사전-준비)
2. [백엔드 테스트](#백엔드-테스트)
3. [프론트엔드 테스트](#프론트엔드-테스트)
4. [통합 테스트](#통합-테스트)
5. [실제 기기 테스트](#실제-기기-테스트)
6. [수동 테스트 체크리스트](#수동-테스트-체크리스트)
7. [문제 해결](#문제-해결)

---

## 🚀 사전 준비

### 1. 환경 확인

```powershell
# Python 버전 확인 (3.11+ 필요)
python --version

# Node.js 버전 확인 (18+ 필요)
node --version

# Docker Desktop 실행 확인 (선택사항)
docker --version
```

### 2. 의존성 설치

#### 백엔드
```powershell
cd "C:\Cursor Project\new_challange\backend"

# 가상환경 생성 (처음 한 번만)
python -m venv venv

# 가상환경 활성화
.\venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
```

#### 프론트엔드
```powershell
cd "C:\Cursor Project\new_challange\frontend"

# 의존성 설치
npm install
```

### 3. 환경 변수 설정

#### 백엔드 환경 변수 (`backend/.env`)
```env
DATABASE_URL=postgresql://arway_user:password@localhost:5433/arway_lite
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
```

#### 프론트엔드 환경 변수 (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🧪 백엔드 테스트

### 1. 단위 테스트 실행

```powershell
cd "C:\Cursor Project\new_challange\backend"

# 가상환경 활성화
.\venv\Scripts\activate

# 모든 테스트 실행
pytest tests/ -v

# 특정 테스트 파일 실행
pytest tests/test_destinations.py -v
pytest tests/test_sessions.py -v
pytest tests/test_analytics.py -v

# 특정 테스트 함수 실행
pytest tests/test_destinations.py::test_create_destination -v

# 커버리지 리포트 생성
pytest tests/ --cov=app --cov-report=html
# 리포트 확인: backend/htmlcov/index.html
```

### 2. 테스트 결과 확인

**성공 예시**:
```
tests/test_destinations.py::test_create_destination PASSED
tests/test_sessions.py::test_create_session PASSED
...
========================= 15 passed in 2.34s =========================
```

**실패 시**:
- 에러 메시지 확인
- `conftest.py`의 테스트 데이터 확인
- 데이터베이스 연결 확인

### 3. 백엔드 서버 실행 (API 테스트용)

```powershell
cd "C:\Cursor Project\new_challange\backend"
.\venv\Scripts\activate

# 서버 실행
uvicorn app.main:app --reload

# 브라우저에서 확인
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/redoc (ReDoc)
```

---

## 🎨 프론트엔드 테스트

### 1. 단위 테스트 실행

```powershell
cd "C:\Cursor Project\new_challange\frontend"

# 모든 테스트 실행
npm test

# Watch 모드 (파일 변경 시 자동 재실행)
npm run test:watch

# 특정 테스트 파일 실행
npm test -- ar-nav/page.test.tsx

# 커버리지 리포트 생성
npm test -- --coverage
```

### 2. 린트 검사

```powershell
cd "C:\Cursor Project\new_challange\frontend"

# 린트 실행
npm run lint

# 자동 수정
npm run lint -- --fix
```

### 3. 프론트엔드 개발 서버 실행

```powershell
cd "C:\Cursor Project\new_challange\frontend"

# 개발 서버 실행
npm run dev

# 브라우저에서 확인
# http://localhost:3000/ar-nav
```

---

## 🔗 통합 테스트

### 1. 전체 시스템 실행

#### 터미널 1: PostgreSQL (Docker)
```powershell
cd "C:\Cursor Project\new_challange"

# PostgreSQL 컨테이너 실행
docker-compose up -d postgres

# 상태 확인
docker-compose ps
```

#### 터미널 2: 백엔드 서버
```powershell
cd "C:\Cursor Project\new_challange\backend"
.\venv\Scripts\activate

# 데이터베이스 마이그레이션 (처음 한 번만)
alembic upgrade head

# 서버 실행
uvicorn app.main:app --reload
```

#### 터미널 3: 프론트엔드 서버
```powershell
cd "C:\Cursor Project\new_challange\frontend"

# 개발 서버 실행
npm run dev
```

### 2. 통합 테스트 실행

```powershell
cd "C:\Cursor Project\new_challange\backend"
.\venv\Scripts\activate

# 통합 테스트 실행 (실제 DB 연결 필요)
pytest tests/test_integration.py -v -m integration
```

### 3. API 엔드포인트 테스트 (Swagger UI)

1. 브라우저에서 http://localhost:8000/docs 접속
2. 각 API 엔드포인트 클릭
3. "Try it out" 버튼 클릭
4. 파라미터 입력 후 "Execute" 클릭
5. 응답 확인

**주요 테스트 엔드포인트**:
- `GET /api/v1/destinations/` - 목적지 목록 조회
- `POST /api/v1/sessions/` - 세션 생성
- `GET /api/v1/sessions/?user_id={user_id}` - 사용자 세션 조회
- `POST /api/v1/favorites/` - 즐겨찾기 추가
- `GET /api/v1/analytics/` - 통계 조회

---

## 📱 실제 기기 테스트

### 1. 네트워크 설정

#### 옵션 A: 같은 Wi-Fi 네트워크 사용 (권장)

1. **PC와 모바일 기기가 같은 Wi-Fi에 연결되어 있는지 확인**
2. **PC의 로컬 IP 주소 확인**:
   ```powershell
   ipconfig
   # IPv4 주소 확인 (예: 192.168.0.100)
   ```
3. **프론트엔드 환경 변수 수정** (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://192.168.0.100:8000
   ```
4. **방화벽 설정**:
   - Windows 방화벽에서 포트 3000, 8000 허용
   - 또는 개발 모드에서 방화벽 비활성화 (임시)

#### 옵션 B: ngrok 사용 (외부 접근)

```powershell
# ngrok 설치 후
ngrok http 3000

# 생성된 URL 사용 (예: https://abc123.ngrok.io)
```

### 2. 모바일 기기에서 접속

#### iOS (Safari)
1. Safari 브라우저 열기
2. `http://192.168.0.100:3000/ar-nav` 접속
3. 위치 권한 허용
4. 카메라 권한 허용

#### Android (Chrome)
1. Chrome 브라우저 열기
2. `http://192.168.0.100:3000/ar-nav` 접속
3. 위치 권한 허용
4. 카메라 권한 허용

### 3. 실제 기기 테스트 체크리스트

#### GPS 기능 테스트
- [ ] 위치 권한 요청 정상 작동
- [ ] GPS 위치 업데이트 정상 작동
- [ ] 위치 정확도 표시 정상 작동
- [ ] 실내/실외 환경에서 GPS 동작 확인

#### 카메라 기능 테스트
- [ ] 카메라 권한 요청 정상 작동
- [ ] 후면 카메라 접근 정상 작동
- [ ] 카메라 프리뷰 정상 작동
- [ ] 카메라 전환 기능 확인 (있는 경우)

#### 방향 감지 테스트
- [ ] DeviceOrientation API 정상 작동
- [ ] 방향 권한 요청 (iOS) 확인
- [ ] 방향 업데이트 정확도 확인
- [ ] 화살표 회전 애니메이션 확인

#### AR 네비게이션 테스트
- [ ] 화살표 표시 정확도 확인
- [ ] 거리 계산 정확도 확인
- [ ] 도착 감지 정확도 확인
- [ ] 햅틱 피드백 동작 확인
- [ ] UI 반응성 확인

#### 성능 테스트
- [ ] 메모리 사용량 확인 (개발자 도구)
- [ ] 배터리 소모 확인
- [ ] GPS 업데이트 주기 확인 (1초 간격)
- [ ] 화면 프레임레이트 확인 (30fps 이상)

---

## ✅ 수동 테스트 체크리스트

### 1. 시작 화면 (`/ar-nav`)

- [ ] 화면이 정상적으로 로드됨
- [ ] 서비스 소개 텍스트 표시
- [ ] "도보 AR 네비 시작" 버튼 표시
- [ ] "경로 히스토리" 버튼 표시 (있는 경우)
- [ ] 버튼 클릭 시 다음 화면으로 이동

### 2. 목적지 선택 화면 (`/ar-nav/select`)

- [ ] 목적지 목록이 정상적으로 표시됨
- [ ] 스켈레톤 UI가 로딩 중 표시됨
- [ ] 검색 입력창 정상 작동
- [ ] 검색 중 스켈레톤 UI 표시
- [ ] 검색 결과 필터링 정상 작동
- [ ] 즐겨찾기 탭 전환 정상 작동
- [ ] 즐겨찾기 추가/제거 정상 작동
- [ ] 목적지 카드 클릭 시 AR 네비 화면으로 이동
- [ ] 뒤로 가기 버튼 정상 작동

### 3. AR 네비 실행 화면 (`/ar-nav/run`)

- [ ] 카메라 프리뷰 정상 작동
- [ ] GPS 위치 추적 정상 작동
- [ ] 거리 정보 정상 표시
- [ ] 방향 화살표 정상 회전
- [ ] 상태 텍스트 정상 업데이트
- [ ] 햅틱 피드백 동작 (방향 변경 시)
- [ ] 도착 감지 정상 작동
- [ ] 도착 시 햅틱 피드백 동작
- [ ] 뒤로 가기 버튼 정상 작동

### 4. 도착 화면 (`/ar-nav/arrived`)

- [ ] 도착 메시지 정상 표시
- [ ] 피드백 입력 폼 정상 작동
- [ ] 피드백 제출 정상 작동
- [ ] 재시작 버튼 정상 작동
- [ ] 홈으로 가기 버튼 정상 작동

### 5. 경로 히스토리 화면 (`/ar-nav/history`)

- [ ] 히스토리 목록 정상 표시
- [ ] 필터 기능 정상 작동 (전체/완료됨)
- [ ] 통계 정보 정상 표시
- [ ] 재시작 기능 정상 작동
- [ ] 날짜 포맷팅 정상 작동

### 6. Admin 대시보드 (`/admin`)

- [ ] 통계 대시보드 정상 표시
- [ ] 세션 목록 정상 표시
- [ ] 목적지 관리 기능 정상 작동
- [ ] CRUD 기능 정상 작동

---

## 🐛 문제 해결

### 백엔드 테스트 오류

#### 문제: `ModuleNotFoundError`
```powershell
# 해결: 가상환경 활성화 및 의존성 재설치
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
```

#### 문제: `email-validator` 오류
```powershell
# 해결: email-validator 설치
pip install email-validator
# 또는
pip install 'pydantic[email]'
```

#### 문제: 데이터베이스 연결 오류
```powershell
# 해결: 테스트는 인메모리 SQLite 사용하므로 실제 DB 불필요
# conftest.py에서 테스트 DB 설정 확인
```

### 프론트엔드 테스트 오류

#### 문제: `Cannot find module`
```powershell
# 해결: node_modules 재설치
cd frontend
rm -rf node_modules
npm install
```

#### 문제: Jest 설정 오류
```powershell
# 해결: jest.config.js 확인
# jest.setup.js 파일 존재 확인
```

### 통합 테스트 오류

#### 문제: PostgreSQL 연결 실패
```powershell
# 해결 1: Docker 컨테이너 실행 확인
docker-compose ps

# 해결 2: PostgreSQL 수동 실행
# Windows 서비스에서 PostgreSQL 시작

# 해결 3: 포트 확인 (5433 사용 중)
netstat -ano | findstr :5433
```

#### 문제: CORS 오류
```powershell
# 해결: backend/app/main.py에서 CORS 설정 확인
# origins에 프론트엔드 URL 포함 확인
```

### 실제 기기 테스트 오류

#### 문제: 모바일에서 접속 불가
```powershell
# 해결 1: PC IP 주소 확인
ipconfig

# 해결 2: 방화벽 설정 확인
# Windows 방화벽에서 포트 3000, 8000 허용

# 해결 3: 같은 Wi-Fi 네트워크 확인
```

#### 문제: GPS 권한 오류
- 브라우저 설정에서 위치 권한 확인
- HTTPS 또는 localhost에서만 GPS 작동 (일부 브라우저)
- ngrok 사용 시 HTTPS 자동 적용

#### 문제: 카메라 권한 오류
- 브라우저 설정에서 카메라 권한 확인
- HTTPS 또는 localhost에서만 카메라 작동
- Safari (iOS)는 사용자 제스처 필요

---

## 📊 테스트 결과 기록

### 테스트 실행 로그 예시

```markdown
## 테스트 실행 일시: 2024-12-22 10:00

### 백엔드 테스트
- ✅ test_destinations.py: 5/5 통과
- ✅ test_sessions.py: 4/4 통과
- ✅ test_analytics.py: 3/3 통과
- ✅ test_users.py: 3/3 통과
- **총 15개 테스트 모두 통과**

### 프론트엔드 테스트
- ✅ ar-nav/page.test.tsx: 3/3 통과
- ✅ integration/navigation-flow.test.tsx: 2/2 통과
- **총 5개 테스트 모두 통과**

### 수동 테스트
- ✅ 시작 화면: 통과
- ✅ 목적지 선택: 통과
- ✅ AR 네비게이션: 통과
- ✅ 도착 화면: 통과
- ⚠️ 실제 기기 테스트: 미완료 (테스트 필요)

### 발견된 이슈
1. 없음
```

---

## 🎯 빠른 테스트 명령어 모음

```powershell
# 백엔드 테스트
cd backend; .\venv\Scripts\activate; pytest tests/ -v

# 프론트엔드 테스트
cd frontend; npm test

# 백엔드 서버 실행
cd backend; .\venv\Scripts\activate; uvicorn app.main:app --reload

# 프론트엔드 서버 실행
cd frontend; npm run dev

# Docker PostgreSQL 실행
cd "C:\Cursor Project\new_challange"; docker-compose up -d postgres

# 전체 시스템 실행 (3개 터미널 필요)
# 터미널 1: docker-compose up -d postgres
# 터미널 2: cd backend; .\venv\Scripts\activate; uvicorn app.main:app --reload
# 터미널 3: cd frontend; npm run dev
```

---

## 📚 추가 리소스

- [FastAPI 테스트 문서](https://fastapi.tiangolo.com/tutorial/testing/)
- [Jest 공식 문서](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Docker Compose 문서](https://docs.docker.com/compose/)

---

**마지막 업데이트**: 2024년 12월 22일

