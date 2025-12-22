# Backend 빠른 시작 가이드

## 1. 의존성 설치

```bash
cd backend

# 가상환경 생성 (아직 없다면)
python -m venv venv

# 가상환경 활성화
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
venv\Scripts\activate.bat
# Linux/Mac:
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt
```

## 2. 환경 변수 설정

`.env` 파일이 없다면 `.env.example`을 복사:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

`.env` 파일에서 `DATABASE_URL`을 확인하고 필요시 수정하세요.

## 3. 데이터베이스 마이그레이션

### PostgreSQL이 실행 중이어야 합니다

```bash
# 마이그레이션 실행
alembic upgrade head

# 시드 데이터 생성
python -m app.database.seeds
```

## 4. 서버 실행

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 5. API 문서 확인

브라우저에서 다음 URL 접속:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 문제 해결

### psycopg2 모듈 오류
```bash
pip install psycopg2-binary
```

### 데이터베이스 연결 오류
- PostgreSQL이 실행 중인지 확인
- `.env` 파일의 `DATABASE_URL` 확인
- 데이터베이스와 사용자가 생성되었는지 확인

### Import 오류
- 가상환경이 활성화되었는지 확인
- `pip install -r requirements.txt` 실행 확인

