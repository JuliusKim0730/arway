# ARWay Lite 테스트 세팅 및 구동 가이드

**최종 업데이트**: 2024년 12월  
**프로젝트**: ARWay Lite (SCQ 기반 AR 도보 네비 MVP)

---

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [환경 설정](#환경-설정)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [백엔드 테스트](#백엔드-테스트)
5. [프론트엔드 테스트](#프론트엔드-테스트)
6. [통합 테스트](#통합-테스트)
7. [서버 실행 및 확인](#서버-실행-및-확인)
8. [문제 해결](#문제-해결)

---

## 프로젝트 개요

ARWay Lite는 SCQ(Soft Convex Quantization) 엔진을 기반으로 한 AR 도보 네비게이션 MVP입니다.

### 기술 스택

- **백엔드**: FastAPI, SQLAlchemy, PostgreSQL, Alembic
- **프론트엔드**: Next.js 14, React 18, TypeScript, TailwindCSS
- **데이터베이스**: PostgreSQL 15
- **테스트**: pytest, Jest

---

## 환경 설정

### 1. 사전 요구사항

- Python 3.8 이상
- Node.js 18 이상
- PostgreSQL 15 (또는 Docker)
- Git

### 2. 프로젝트 클론 및 이동

```bash
cd "C:\Cursor Project\new_challange"
```

### 3. 프로젝트 상태 확인

프로젝트의 기본 상태를 확인하는 디버깅 스크립트를 실행합니다:

```powershell
# Windows PowerShell
$env:PYTHONIOENCODING="utf-8"
python debug_check.py
```

이 스크립트는 다음을 확인합니다:
- ✅ Python 버전
- ✅ 프로젝트 구조
- ✅ 백엔드 의존성
- ✅ 백엔드 설정
- ✅ 데이터베이스 연결
- ✅ 프론트엔드 의존성

---

## 데이터베이스 설정

### 1. PostgreSQL 실행 (Docker 사용)

```powershell
# 프로젝트 루트에서 실행
docker-compose up -d postgres
```

**확인**:
```powershell
docker ps
# arway-postgres 컨테이너가 실행 중이어야 합니다
```

### 2. 데이터베이스 마이그레이션

```powershell
cd backend
$env:PYTHONIOENCODING="utf-8"
..\venv\Scripts\python.exe -m alembic upgrade head
```

**예상 출력**:
```
INFO  [alembic.runtime.migration] Running upgrade  -> 001, Initial migration
```

### 3. 시드 데이터 생성

```powershell
cd backend
$env:PYTHONIOENCODING="utf-8"
..\venv\Scripts\python.exe -m app.database.seeds
```

**생성되는 데이터**:
- 테스트 사용자: `test@arway.com`
- 테스트 목적지 2개 (서울시 강남구, 서울시 중구)

---

## 백엔드 테스트

### 1. 환경 설정

```powershell
cd backend

# 가상환경 활성화 (이미 생성되어 있다면)
..\venv\Scripts\Activate.ps1

# 의존성 설치 확인
pip install -r requirements.txt
```

### 2. 테스트 실행

#### 모든 테스트 실행

```powershell
cd backend
$env:PYTHONIOENCODING="utf-8"
..\venv\Scripts\python.exe -m pytest tests/ -v
```

#### 특정 테스트 파일 실행

```powershell
# 목적지 API 테스트
..\venv\Scripts\python.exe -m pytest tests/test_destinations.py -v

# 세션 API 테스트
..\venv\Scripts\python.exe -m pytest tests/test_sessions.py -v

# 통합 테스트
..\venv\Scripts\python.exe -m pytest tests/test_integration.py -v
```

#### 특정 테스트 함수 실행

```powershell
..\venv\Scripts\python.exe -m pytest tests/test_destinations.py::test_create_destination -v
```

#### 커버리지 리포트 생성

```powershell
..\venv\Scripts\python.exe -m pytest tests/ --cov=app --cov-report=html
```

생성된 리포트는 `htmlcov/index.html`에서 확인할 수 있습니다.

### 3. 테스트 구조

```
backend/tests/
├── conftest.py              # pytest 설정 및 공통 픽스처
├── test_destinations.py     # 목적지 API 테스트
├── test_sessions.py         # 세션 API 테스트
├── test_users.py            # 사용자 API 테스트
├── test_analytics.py        # 분석 API 테스트
└── test_integration.py      # 통합 테스트
```

### 4. 테스트 데이터베이스

- **유닛 테스트**: 인메모리 SQLite 데이터베이스 사용
- **실제 PostgreSQL 연결 불필요**
- 각 테스트마다 새로운 데이터베이스 세션 생성

### 5. 테스트 예시

```python
def test_create_destination(client, db_session, test_user_id):
    """목적지 생성 테스트"""
    response = client.post(
        "/api/v1/destinations/",
        json={
            "name": "테스트 목적지",
            "description": "테스트용 목적지입니다",
            "latitude": 37.511,
            "longitude": 127.029,
            "address": "서울시 강남구",
            "created_by": test_user_id,
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "테스트 목적지"
    assert data["latitude"] == 37.511
```

---

## 프론트엔드 테스트

### 1. 환경 설정

```powershell
cd frontend

# 의존성 설치
npm install
```

### 2. 테스트 실행

#### 모든 테스트 실행

```powershell
cd frontend
npm test
```

#### Watch 모드로 실행

```powershell
npm run test:watch
```

### 3. 테스트 구조

```
frontend/
├── __tests__/
│   ├── ar-nav/
│   │   └── page.test.tsx    # 시작 화면 테스트
│   └── integration/
│       └── navigation.test.tsx  # 통합 테스트
├── jest.config.js           # Jest 설정
└── jest.setup.js            # Jest 초기 설정
```

---

## 통합 테스트

### 1. 수동 테스트 체크리스트

#### 백엔드 서버 실행

```powershell
cd backend
$env:PYTHONIOENCODING="utf-8"
..\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**확인 사항**:
- 서버 실행: http://localhost:8000
- API 문서: http://localhost:8000/docs
- Health check: http://localhost:8000/health

#### 프론트엔드 서버 실행

```powershell
cd frontend
npm run dev
```

**확인 사항**:
- 프론트엔드 실행: http://localhost:3000
- AR 네비 화면: http://localhost:3000/ar-nav

### 2. 기능별 테스트

#### 1. 시작 화면 (`/ar-nav`)

- [ ] 시작 화면이 정상적으로 표시됨
- [ ] "도보 AR 네비 시작" 버튼 클릭 시 목적지 선택 화면으로 이동

#### 2. 목적지 선택 화면 (`/ar-nav/select`)

- [ ] 목적지 목록이 정상적으로 표시됨
- [ ] 목적지 선택 시 AR 네비 화면으로 이동

#### 3. AR 네비 화면 (`/ar-nav/run`)

- [ ] GPS 위치 추적이 정상 작동
- [ ] 방향 화살표가 정상적으로 회전
- [ ] 거리 정보가 정상적으로 표시됨
- [ ] 상태 텍스트가 정상적으로 업데이트됨

**주의**: 실제 GPS 및 카메라 권한이 필요합니다.

#### 4. 도착 화면 (`/ar-nav/arrived`)

- [ ] 도착 메시지가 정상적으로 표시됨
- [ ] 피드백 제출이 정상 작동
- [ ] 재시작 버튼이 정상 작동

#### 5. Admin 대시보드 (`http://localhost:3001`)

- [ ] 통계 데이터가 정상적으로 표시됨
- [ ] 세션 목록이 정상적으로 표시됨
- [ ] 목적지 관리 기능이 정상 작동

### 3. API 테스트 (Swagger UI)

1. 백엔드 서버 실행
2. 브라우저에서 http://localhost:8000/docs 접속
3. 각 API 엔드포인트를 직접 테스트

**주요 엔드포인트**:
- `GET /api/v1/destinations/` - 목적지 목록 조회
- `POST /api/v1/sessions/` - 세션 생성
- `POST /api/v1/navigation-points/` - 네비게이션 포인트 저장
- `POST /api/v1/feedback/` - 피드백 제출
- `GET /api/v1/analytics/stats` - 통계 조회

### 4. cURL 예시

```powershell
# 목적지 목록 조회
curl http://localhost:8000/api/v1/destinations/

# 세션 생성
curl -X POST http://localhost:8000/api/v1/sessions/ `
  -H "Content-Type: application/json" `
  -d '{\"user_id\": \"00000000-0000-0000-0000-000000000000\", \"destination_id\": \"목적지-ID\", \"start_latitude\": 37.510, \"start_longitude\": 127.028}'
```

---

## 서버 실행 및 확인

### 전체 서버 실행 순서

#### 1단계: PostgreSQL 실행

```powershell
cd "C:\Cursor Project\new_challange"
docker-compose up -d postgres
```

#### 2단계: 백엔드 서버 실행

```powershell
cd backend
$env:PYTHONIOENCODING="utf-8"
..\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**확인**: http://localhost:8000/docs

#### 3단계: 프론트엔드 서버 실행 (새 터미널)

```powershell
cd frontend
npm run dev
```

**확인**: http://localhost:3000/ar-nav

#### 4단계: Admin 대시보드 실행 (선택사항, 새 터미널)

```powershell
cd admin
npm run dev
```

**확인**: http://localhost:3001

### Docker Compose로 전체 실행 (선택사항)

```powershell
cd "C:\Cursor Project\new_challange"
docker-compose up
```

이 방법은 모든 서비스(PostgreSQL, 백엔드, 프론트엔드, Admin)를 한 번에 실행합니다.

---

## 문제 해결

### 1. 데이터베이스 연결 오류

**증상**: `psycopg2.OperationalError: could not connect to server`

**해결 방법**:
1. PostgreSQL 컨테이너가 실행 중인지 확인:
   ```powershell
   docker ps
   ```

2. 컨테이너 재시작:
   ```powershell
   docker-compose restart postgres
   ```

3. `.env` 파일의 `DATABASE_URL` 확인:
   ```
   DATABASE_URL=postgresql://arway_user:password@localhost:5433/arway_lite
   ```

### 2. 모듈 Import 오류

**증상**: `ModuleNotFoundError: No module named 'app'`

**해결 방법**:
1. 가상환경이 활성화되었는지 확인
2. 백엔드 디렉토리에서 실행하는지 확인
3. 의존성 재설치:
   ```powershell
   cd backend
   pip install -r requirements.txt
   ```

### 3. 테스트 실패

**증상**: 테스트가 실패하거나 에러 발생

**해결 방법**:
1. 테스트 로그 확인:
   ```powershell
   ..\venv\Scripts\python.exe -m pytest tests/ -v --tb=long
   ```

2. 데이터베이스 상태 확인 (테스트는 인메모리 SQLite 사용)

3. 코드 변경사항 확인

### 4. 프론트엔드 빌드 오류

**증상**: `npm run dev` 실행 시 오류

**해결 방법**:
1. 의존성 재설치:
   ```powershell
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Next.js 캐시 삭제:
   ```powershell
   rm -rf .next
   ```

### 5. 포트 충돌

**증상**: `Address already in use`

**해결 방법**:
1. 해당 포트를 사용하는 프로세스 확인:
   ```powershell
   # Windows
   netstat -ano | findstr :8000
   ```

2. 프로세스 종료 또는 다른 포트 사용

### 6. Windows 콘솔 인코딩 문제

**증상**: 한글이 깨져서 표시됨

**해결 방법**:
```powershell
$env:PYTHONIOENCODING="utf-8"
```

또는 PowerShell 프로필에 추가:
```powershell
$env:PYTHONIOENCODING="utf-8"
```

---

## 테스트 결과 요약

### 백엔드 테스트 결과

**최종 테스트 결과** (2024년 12월):
```
============================= test session starts =============================
collected 15 items

tests/test_analytics.py::test_get_stats PASSED
tests/test_destinations.py::test_create_destination PASSED
tests/test_destinations.py::test_get_destinations PASSED
tests/test_destinations.py::test_get_destination_by_id PASSED
tests/test_destinations.py::test_update_destination PASSED
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

============================= 15 passed in 0.34s ==============================
```

**통과율**: 15/15 (100%)

### 수정된 사항

1. **Decimal 직렬화 문제 해결**
   - `DestinationResponse` 스키마에 `field_serializer` 추가
   - `SessionResponse` 스키마에 `field_serializer` 추가
   - Decimal 타입이 float로 직렬화되도록 수정

2. **Destinations API PUT 엔드포인트 추가**
   - 목적지 수정 기능 구현
   - 테스트 통과 확인

---

## 다음 단계

### 개발 환경에서의 작업

1. **백엔드 개발**
   - API 엔드포인트 추가/수정
   - 데이터베이스 모델 변경 시 마이그레이션 생성:
     ```powershell
     alembic revision --autogenerate -m "설명"
     alembic upgrade head
     ```

2. **프론트엔드 개발**
   - 컴포넌트 추가/수정
   - API 통합 테스트

3. **통합 테스트**
   - 전체 플로우 테스트
   - 성능 테스트

### 프로덕션 배포 전 체크리스트

- [ ] 모든 테스트 통과
- [ ] 환경 변수 설정 확인
- [ ] 데이터베이스 백업
- [ ] 로그 설정 확인
- [ ] 보안 설정 확인
- [ ] 성능 테스트 완료

---

## 참고 자료

- [백엔드 테스트 README](backend/tests/README.md)
- [프로젝트 상태 보고서](DEVELOPMENT_STATUS_REPORT.md)
- [API 문서](api.md)
- [프로젝트 PRD](PRD.md)

---

**문의사항이나 문제가 발생하면 이 가이드를 참고하여 해결하세요!** 🚀

