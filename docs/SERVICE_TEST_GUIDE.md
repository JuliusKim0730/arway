# ARWay Lite 서비스 테스트 안내서

**작성일**: 2024년 12월 22일  
**프로젝트**: ARWay Lite (SCQ 기반 AR 도보 네비게이션 MVP)

---

## 📋 목차

1. [빠른 시작](#빠른-시작)
2. [서비스 실행 방법](#서비스-실행-방법)
3. [기능별 테스트 가이드](#기능별-테스트-가이드)
4. [접속 URL 및 엔드포인트](#접속-url-및-엔드포인트)
5. [테스트 시나리오](#테스트-시나리오)
6. [문제 해결](#문제-해결)

---

## 🚀 빠른 시작

### 방법 1: 자동화 스크립트 사용 (가장 쉬움)

```powershell
cd "C:\Cursor Project\new_challange"
.\scripts\test.ps1
```

**옵션 6 선택**: 전체 시스템 실행 (Docker + Backend + Frontend)

이 방법은 자동으로:
1. PostgreSQL 컨테이너 시작
2. 백엔드 서버 실행 (새 창)
3. 프론트엔드 서버 실행 (새 창)

### 방법 2: 수동 실행 (3개 터미널)

#### 터미널 1: PostgreSQL 시작
```powershell
cd "C:\Cursor Project\new_challange"
docker-compose up -d postgres
```

#### 터미널 2: 백엔드 서버 실행
```powershell
cd "C:\Cursor Project\new_challange\backend"

# 가상환경이 없으면 생성
if (-not (Test-Path "venv\Scripts\python.exe")) {
    python -m venv venv
}

# 의존성 설치
.\venv\Scripts\python.exe -m pip install -r requirements.txt

# 데이터베이스 마이그레이션 (처음 한 번만)
.\venv\Scripts\python.exe -m alembic upgrade head

# 서버 실행
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

#### 터미널 3: 프론트엔드 서버 실행
```powershell
cd "C:\Cursor Project\new_challange\frontend"

# 의존성이 없으면 설치
if (-not (Test-Path "node_modules")) {
    npm install
}

# 서버 실행
npm run dev
```

---

## 🎯 서비스 실행 방법

### 사전 준비

#### 1. 환경 변수 확인

**백엔드** (`backend/.env`):
```env
DATABASE_URL=postgresql://arway_user:password@localhost:5433/arway_lite
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
```

**프론트엔드** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### 2. 데이터베이스 준비

**Docker 사용 (권장)**:
```powershell
cd "C:\Cursor Project\new_challange"
docker-compose up -d postgres

# 상태 확인
docker-compose ps
```

**로컬 PostgreSQL 사용**:
```powershell
# PostgreSQL 서비스 실행 확인
# 데이터베이스 및 사용자 생성 (setup_postgres.ps1 참조)
```

---

## 📍 접속 URL 및 엔드포인트

### 사용자 서비스

| 서비스 | URL | 설명 |
|--------|-----|------|
| **시작 화면** | http://localhost:3000/ar-nav | AR 네비게이션 시작 화면 |
| **목적지 선택** | http://localhost:3000/ar-nav/select | 목적지 선택 화면 |
| **AR 네비게이션** | http://localhost:3000/ar-nav/run | AR 네비게이션 실행 화면 |
| **도착 화면** | http://localhost:3000/ar-nav/arrived | 도착 확인 화면 |
| **경로 히스토리** | http://localhost:3000/ar-nav/history | 과거 네비게이션 기록 |

### 관리자 서비스

| 서비스 | URL | 설명 |
|--------|-----|------|
| **Admin 대시보드** | http://localhost:3001 | 관리자 대시보드 |

### 백엔드 API

| 서비스 | URL | 설명 |
|--------|-----|------|
| **API 루트** | http://localhost:8000 | API 기본 정보 |
| **Swagger UI** | http://localhost:8000/docs | API 문서 및 테스트 |
| **ReDoc** | http://localhost:8000/redoc | API 문서 (ReDoc 형식) |
| **Health Check** | http://localhost:8000/health | 서버 상태 확인 |

### 주요 API 엔드포인트

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/destinations/` | 목적지 목록 조회 |
| GET | `/api/v1/destinations/?search={검색어}` | 목적지 검색 |
| GET | `/api/v1/destinations/{id}` | 목적지 상세 조회 |
| POST | `/api/v1/sessions/` | 네비게이션 세션 생성 |
| GET | `/api/v1/sessions/?user_id={user_id}` | 사용자 세션 히스토리 |
| POST | `/api/v1/favorites/` | 즐겨찾기 추가 |
| DELETE | `/api/v1/favorites/{destination_id}` | 즐겨찾기 제거 |
| GET | `/api/v1/favorites/?user_id={user_id}` | 즐겨찾기 목록 |
| GET | `/api/v1/analytics/` | 통계 정보 |

---

## 🧪 기능별 테스트 가이드

### 1. 시작 화면 테스트

**접속**: http://localhost:3000/ar-nav

**테스트 항목**:
- [ ] 화면이 정상적으로 로드됨
- [ ] "도보 AR 네비 시작" 버튼 표시
- [ ] "경로 히스토리" 버튼 표시 (있는 경우)
- [ ] 버튼 클릭 시 다음 화면으로 이동

**예상 결과**:
- 서비스 소개 텍스트 표시
- 시작 버튼 클릭 시 목적지 선택 화면으로 이동

---

### 2. 목적지 선택 화면 테스트

**접속**: http://localhost:3000/ar-nav/select

**테스트 항목**:
- [ ] 목적지 목록이 정상적으로 표시됨
- [ ] 스켈레톤 UI가 로딩 중 표시됨
- [ ] 검색 기능 작동 (이름, 주소, 설명으로 검색)
- [ ] 검색 중 스켈레톤 UI 표시
- [ ] 즐겨찾기 탭 전환 작동
- [ ] 즐겨찾기 추가/제거 작동 (별 아이콘 클릭)
- [ ] 목적지 카드 클릭 시 AR 네비 화면으로 이동
- [ ] 뒤로 가기 버튼 작동

**테스트 시나리오**:
1. 검색창에 "강남" 입력 → 검색 결과 확인
2. 즐겨찾기 탭 클릭 → 즐겨찾기 목록 확인
3. 목적지 카드의 별 아이콘 클릭 → 즐겨찾기 추가/제거 확인
4. 목적지 카드의 "이 위치로 안내" 버튼 클릭 → AR 네비 화면으로 이동 확인

---

### 3. AR 네비게이션 화면 테스트

**접속**: http://localhost:3000/ar-nav/run

**주의사항**: 
- GPS 권한 필요
- 카메라 권한 필요 (선택사항)
- 실제 위치 정보가 필요하므로 브라우저에서 위치 권한 허용 필요

**테스트 항목**:
- [ ] GPS 위치 권한 요청 정상 작동
- [ ] 카메라 권한 요청 정상 작동 (있는 경우)
- [ ] 카메라 프리뷰 정상 작동
- [ ] 거리 정보 정상 표시 (상단 HUD)
- [ ] 방향 화살표 정상 회전
- [ ] 상태 텍스트 정상 업데이트
- [ ] 햅틱 피드백 동작 (방향 변경 시 진동)
- [ ] 도착 감지 정상 작동 (5m 이내)
- [ ] 도착 시 햅틱 피드백 동작
- [ ] 뒤로 가기 버튼 작동

**테스트 시나리오**:
1. 위치 권한 허용 → GPS 위치 업데이트 확인
2. 카메라 권한 허용 → 카메라 프리뷰 확인
3. 기기를 회전 → 화살표 방향 변경 확인
4. 이동 → 거리 정보 업데이트 확인
5. 목적지 근처 도착 → 도착 감지 및 화면 전환 확인

**개발용 테스트**:
- "도착 테스트" 버튼 클릭 → 도착 화면으로 바로 이동 (GPS 없이 테스트 가능)

---

### 4. 도착 화면 테스트

**접속**: http://localhost:3000/ar-nav/arrived

**테스트 항목**:
- [ ] 도착 메시지 정상 표시
- [ ] 피드백 입력 폼 정상 작동
- [ ] 피드백 제출 정상 작동
- [ ] 재시작 버튼 정상 작동
- [ ] 홈으로 가기 버튼 정상 작동

**테스트 시나리오**:
1. 피드백 입력 → 제출 버튼 클릭 → 제출 확인
2. "다시 안내받기" 버튼 클릭 → 목적지 선택 화면으로 이동
3. "홈으로" 버튼 클릭 → 시작 화면으로 이동

---

### 5. 경로 히스토리 화면 테스트

**접속**: http://localhost:3000/ar-nav/history

**테스트 항목**:
- [ ] 히스토리 목록 정상 표시
- [ ] 필터 기능 작동 (전체/완료됨)
- [ ] 통계 정보 정상 표시
- [ ] 재시작 기능 작동
- [ ] 날짜 포맷팅 정상 작동

**테스트 시나리오**:
1. 히스토리 목록 확인 → 과거 네비게이션 기록 표시 확인
2. "완료됨" 필터 클릭 → 완료된 세션만 표시 확인
3. 히스토리 항목의 "다시 안내받기" 클릭 → 해당 목적지로 네비게이션 시작 확인

---

### 6. Admin 대시보드 테스트

**접속**: http://localhost:3001

**테스트 항목**:
- [ ] 통계 대시보드 정상 표시
- [ ] 세션 목록 정상 표시
- [ ] 목적지 관리 기능 작동
- [ ] CRUD 기능 정상 작동

**테스트 시나리오**:
1. 통계 카드 확인 → 총 세션 수, 완료된 세션 수 등 확인
2. 세션 목록 확인 → 세션 정보 표시 확인
3. 목적지 관리 → 목적지 추가/수정/삭제 확인

---

## 🔗 API 테스트 (Swagger UI)

### Swagger UI 사용 방법

1. **접속**: http://localhost:8000/docs
2. **API 엔드포인트 선택**: 테스트할 API 클릭
3. **"Try it out" 버튼 클릭**
4. **파라미터 입력** (필요한 경우)
5. **"Execute" 버튼 클릭**
6. **응답 확인**

### 주요 테스트 API

#### 1. 목적지 목록 조회
```
GET /api/v1/destinations/
```
- 파라미터 없음
- 응답: 목적지 목록 배열

#### 2. 목적지 검색
```
GET /api/v1/destinations/?search=강남
```
- 파라미터: `search` (검색어)
- 응답: 검색 결과 목록

#### 3. 세션 생성
```
POST /api/v1/sessions/
```
- Body 예시:
```json
{
  "user_id": "00000000-0000-0000-0000-000000000000",
  "destination_id": "목적지-ID",
  "start_latitude": 37.510,
  "start_longitude": 127.028
}
```

#### 4. 사용자 세션 히스토리
```
GET /api/v1/sessions/?user_id=00000000-0000-0000-0000-000000000000
```
- 파라미터: `user_id` (사용자 ID)
- 응답: 해당 사용자의 세션 목록

#### 5. 즐겨찾기 추가
```
POST /api/v1/favorites/
```
- Body 예시:
```json
{
  "user_id": "00000000-0000-0000-0000-000000000000",
  "destination_id": "목적지-ID"
}
```

---

## 📱 실제 기기 테스트

### 모바일 기기에서 접속하기

#### 1. 네트워크 설정

**PC의 IP 주소 확인**:
```powershell
ipconfig
# IPv4 주소 확인 (예: 192.168.0.100)
```

**프론트엔드 환경 변수 수정** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://192.168.0.100:8000
```

**방화벽 설정**:
- Windows 방화벽에서 포트 3000, 8000 허용

#### 2. 모바일 기기에서 접속

**iOS (Safari)**:
1. Safari 브라우저 열기
2. `http://192.168.0.100:3000/ar-nav` 접속
3. 위치 권한 허용
4. 카메라 권한 허용

**Android (Chrome)**:
1. Chrome 브라우저 열기
2. `http://192.168.0.100:3000/ar-nav` 접속
3. 위치 권한 허용
4. 카메라 권한 허용

#### 3. 모바일 테스트 체크리스트

- [ ] GPS 위치 추적 정상 작동
- [ ] 카메라 프리뷰 정상 작동
- [ ] 방향 화살표 회전 정상 작동
- [ ] 햅틱 피드백 동작 확인
- [ ] 도착 감지 정확도 확인
- [ ] 배터리 소모 확인

---

## 🎬 전체 테스트 시나리오

### 시나리오 1: 기본 네비게이션 플로우

1. **시작 화면** 접속
   - http://localhost:3000/ar-nav
   - "도보 AR 네비 시작" 클릭

2. **목적지 선택**
   - 목적지 목록 확인
   - 목적지 선택 (또는 검색 후 선택)
   - "이 위치로 안내" 클릭

3. **AR 네비게이션**
   - 위치 권한 허용
   - 카메라 권한 허용 (선택)
   - 화살표 방향 확인
   - 거리 정보 확인
   - 이동 시 화살표 회전 확인

4. **도착**
   - 목적지 근처 도착 시 자동 전환
   - 또는 "도착 테스트" 버튼 클릭

5. **피드백 제출**
   - 피드백 입력
   - 제출 버튼 클릭

### 시나리오 2: 즐겨찾기 기능 테스트

1. **목적지 선택 화면** 접속
2. **즐겨찾기 추가**
   - 목적지 카드의 별 아이콘 클릭
   - 즐겨찾기 탭에서 확인
3. **즐겨찾기에서 선택**
   - 즐겨찾기 탭 클릭
   - 즐겨찾기 목록 확인
   - 목적지 선택하여 네비게이션 시작

### 시나리오 3: 경로 히스토리 테스트

1. **여러 번 네비게이션 실행**
   - 시나리오 1을 여러 번 반복
2. **히스토리 확인**
   - 시작 화면에서 "경로 히스토리" 클릭
   - 과거 기록 확인
   - 통계 정보 확인
3. **재시작**
   - 히스토리 항목의 "다시 안내받기" 클릭
   - 해당 목적지로 네비게이션 시작

---

## 🐛 문제 해결

### 서버가 시작되지 않는 경우

#### 백엔드 서버 오류
```powershell
# 포트 확인
netstat -ano | findstr :8000

# 포트가 사용 중이면 프로세스 종료
# 또는 다른 포트 사용: uvicorn app.main:app --reload --port 8001
```

#### 프론트엔드 서버 오류
```powershell
# 포트 확인
netstat -ano | findstr :3000

# node_modules 재설치
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### 데이터베이스 연결 오류

```powershell
# Docker 컨테이너 상태 확인
docker-compose ps

# 컨테이너 재시작
docker-compose restart postgres

# 로그 확인
docker-compose logs postgres
```

### GPS 권한 오류

- 브라우저 설정에서 위치 권한 확인
- HTTPS 또는 localhost에서만 GPS 작동 (일부 브라우저)
- Chrome: 설정 → 개인정보 및 보안 → 사이트 설정 → 위치

### 카메라 권한 오류

- 브라우저 설정에서 카메라 권한 확인
- HTTPS 또는 localhost에서만 카메라 작동
- Safari (iOS): 설정 → Safari → 카메라

### API 연결 오류

```powershell
# 백엔드 서버 실행 확인
curl http://localhost:8000/health

# CORS 오류인 경우 backend/app/main.py 확인
# origins에 프론트엔드 URL 포함 확인
```

---

## ✅ 테스트 체크리스트

### 기본 기능
- [ ] 시작 화면 로드
- [ ] 목적지 선택 화면 로드
- [ ] AR 네비게이션 화면 로드
- [ ] 도착 화면 로드
- [ ] 경로 히스토리 화면 로드

### 고급 기능
- [ ] 검색 기능 작동
- [ ] 즐겨찾기 추가/제거
- [ ] 경로 히스토리 조회
- [ ] 통계 정보 표시

### API 기능
- [ ] 목적지 목록 조회
- [ ] 목적지 검색
- [ ] 세션 생성
- [ ] 세션 히스토리 조회
- [ ] 즐겨찾기 관리

### 모바일 기능
- [ ] GPS 위치 추적
- [ ] 카메라 프리뷰
- [ ] 방향 화살표 회전
- [ ] 햅틱 피드백
- [ ] 도착 감지

---

## 📚 추가 리소스

- [테스트 가이드](./TEST_GUIDE_COMPLETE.md) - 상세 테스트 가이드
- [빠른 테스트 가이드](./QUICK_TEST_GUIDE.md) - 빠른 참조
- [PowerShell 테스트 스크립트](./scripts/test.ps1) - 자동화 스크립트

---

**마지막 업데이트**: 2024년 12월 22일

