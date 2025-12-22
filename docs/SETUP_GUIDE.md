# ARWay Lite 프로젝트 설정 가이드

## 📋 현재 상태

✅ **완료된 작업**:
- 프로젝트 구조 생성 완료
- 프론트엔드/백엔드 코드 구현 완료
- SCQ 엔진 라이브러리 설치 완료
- 모든 Python 의존성 설치 완료 (psycopg2-binary 포함)

⚠️ **필요한 작업**:
- PostgreSQL 데이터베이스 실행
- 데이터베이스 마이그레이션 실행
- 환경 변수 파일 생성

---

## 🚀 빠른 시작 가이드

### 1. 환경 변수 파일 생성

**백엔드**:
```bash
cd backend
# .env 파일 생성 (없는 경우)
echo DATABASE_URL=postgresql://arway_user:password@localhost:5432/arway_lite > .env
echo SECRET_KEY=your-secret-key-here-change-in-production >> .env
echo DEBUG=True >> .env
```

또는 수동으로 `backend/.env` 파일 생성:
```
DATABASE_URL=postgresql://arway_user:password@localhost:5432/arway_lite
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
```

**프론트엔드**:
```bash
cd frontend
# .env.local 파일 생성 (필요한 경우)
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
```

---

### 2. PostgreSQL 데이터베이스 실행

#### 옵션 A: Docker 사용 (권장)

```bash
# 프로젝트 루트에서
docker-compose up -d postgres

# 데이터베이스 상태 확인
docker-compose ps
```

#### 옵션 B: 로컬 PostgreSQL 사용

1. PostgreSQL 서비스가 실행 중인지 확인
2. 데이터베이스 및 사용자 생성:
```sql
CREATE DATABASE arway_lite;
CREATE USER arway_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE arway_lite TO arway_user;
```

---

### 3. 데이터베이스 마이그레이션 실행

```bash
cd backend

# 마이그레이션 실행
alembic upgrade head

# 시드 데이터 생성
python app/database/seeds.py
```

또는 자동화 스크립트 사용:
```bash
# 프로젝트 루트에서
python setup_database.py
```

---

### 4. 백엔드 서버 실행

```bash
cd backend
uvicorn app.main:app --reload
```

**확인**:
- API 문서: http://localhost:8000/docs
- Health check: http://localhost:8000/health

---

### 5. 프론트엔드 개발 서버 실행

**새 터미널에서**:
```bash
cd frontend
npm install  # 처음 실행 시
npm run dev
```

**확인**:
- 프론트엔드: http://localhost:3000/ar-nav
- 관리자: http://localhost:3001 (admin 폴더에서 실행)

---

## 🔍 문제 해결

### PostgreSQL 연결 실패

**증상**: `psycopg2.OperationalError` 또는 연결 타임아웃

**해결 방법**:
1. PostgreSQL이 실행 중인지 확인
   ```bash
   # Docker 사용 시
   docker-compose ps
   
   # 로컬 PostgreSQL
   # Windows: 서비스 관리자에서 확인
   # Linux/Mac: sudo systemctl status postgresql
   ```

2. 연결 정보 확인 (`backend/.env` 파일)
   ```
   DATABASE_URL=postgresql://arway_user:password@localhost:5432/arway_lite
   ```

3. 포트 확인 (기본값: 5432)

### 마이그레이션 실패

**증상**: `alembic upgrade head` 실행 시 오류

**해결 방법**:
1. 데이터베이스가 존재하는지 확인
2. 사용자 권한 확인
3. 마이그레이션 파일 확인: `backend/alembic/versions/001_initial_migration.py`

### 백엔드 서버 실행 실패

**증상**: `uvicorn` 실행 시 모듈을 찾을 수 없음

**해결 방법**:
1. 가상환경 활성화 확인
2. 의존성 설치 확인:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

### 프론트엔드 빌드 실패

**증상**: `npm run dev` 실행 시 오류

**해결 방법**:
1. Node.js 버전 확인 (권장: 18.x 이상)
2. 의존성 재설치:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## 📝 체크리스트

### 초기 설정
- [ ] 환경 변수 파일 생성 (`.env`)
- [ ] PostgreSQL 실행 확인
- [ ] 데이터베이스 마이그레이션 실행
- [ ] 시드 데이터 생성

### 서버 실행
- [ ] 백엔드 서버 실행 (http://localhost:8000)
- [ ] 프론트엔드 서버 실행 (http://localhost:3000)
- [ ] API 문서 접속 확인 (http://localhost:8000/docs)

### 테스트
- [ ] 백엔드 API 엔드포인트 테스트
- [ ] 프론트엔드 화면 동작 확인
- [ ] 통합 테스트 실행

---

## 🎯 다음 단계

설정이 완료되면:

1. **API 테스트**: http://localhost:8000/docs 에서 API 테스트
2. **프론트엔드 테스트**: http://localhost:3000/ar-nav 에서 화면 확인
3. **SCQ 모델 학습**: `backend/experiments/nav_ar/train_scq_nav.py` 실행
4. **통합 테스트**: `pytest` 및 `npm test` 실행

---

## 📚 추가 문서

- `DEVELOPMENT_STATUS_REPORT.md` - 개발 상태 상세 보고서
- `NEXT_STEPS_COMPLETED.md` - 완료된 작업 보고서
- `PRD.md` - 제품 요구사항 문서
- `workflow.md` - 기술 워크플로우 문서

