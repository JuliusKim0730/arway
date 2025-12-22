# ARWay Lite

> 📚 **문서**: 프로젝트 관련 참고 문서는 [`docs/`](./docs/) 폴더를 참고하세요. - SCQ 기반 AR 도보 네비게이션 MVP

ARWay Lite는 SCQ 기반 AR 도보 네비게이션 MVP로, 카메라 화면 위에 방향 화살표와 거리 정보를 표시하여 직관적인 방향 안내를 제공합니다.

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+ (또는 Docker)
- Docker & Docker Compose (선택사항)

### Docker를 사용한 빠른 시작

```bash
# 1. 프로젝트 클론
git clone <repository-url>
cd new_challange

# 2. 환경 변수 설정
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp admin/.env.example admin/.env.local

# 3. 배포 스크립트 실행
# Windows PowerShell:
.\scripts\deploy.ps1

# Linux/Mac:
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 수동 설치 및 실행

#### 1. 데이터베이스 설정

```bash
# Docker 사용
docker-compose up -d postgres

# 또는 로컬 PostgreSQL
createdb arway_lite
createuser arway_user
psql arway_lite -c "ALTER USER arway_user WITH PASSWORD 'password';"
psql arway_lite -c "GRANT ALL PRIVILEGES ON DATABASE arway_lite TO arway_user;"
```

#### 2. 백엔드 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일에서 DATABASE_URL 확인 및 수정

# 데이터베이스 마이그레이션
alembic upgrade head
python -m app.database.seeds

# 서버 실행
uvicorn app.main:app --reload
```

#### 3. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local에서 NEXT_PUBLIC_API_URL 확인

# 개발 서버 실행
npm run dev
```

#### 4. Admin 설정

```bash
cd admin

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local

# 개발 서버 실행
npm run dev
```

## 📍 접속 정보

- **Frontend**: http://localhost:3000/ar-nav
- **Backend API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs
- **Admin**: http://localhost:3001

## 🏗️ 프로젝트 구조

```
new_challange/
├── frontend/          # Next.js 프론트엔드
│   ├── app/          # App Router 페이지
│   ├── components/   # React 컴포넌트
│   ├── hooks/        # Custom Hooks
│   └── lib/          # 유틸리티 및 API 클라이언트
├── backend/          # FastAPI 백엔드
│   ├── app/
│   │   ├── api/      # API 라우터
│   │   ├── models/   # SQLAlchemy 모델
│   │   ├── schemas/  # Pydantic 스키마
│   │   └── database/ # 데이터베이스 설정
│   ├── alembic/      # 마이그레이션
│   └── tests/        # 테스트
├── admin/            # Next.js Admin 대시보드
│   ├── app/          # Admin 페이지
│   └── components/   # Admin 컴포넌트
└── docker-compose.yml
```

## 🧪 테스트

### 백엔드 테스트

```bash
cd backend
pytest tests/ -v
```

### 프론트엔드 테스트

```bash
cd frontend
npm test
```

자세한 내용은 [TESTING_GUIDE.md](./TESTING_GUIDE.md)를 참조하세요.

## 📚 주요 기능

### 사용자 기능
- ✅ 시작 화면
- ✅ 목적지 선택
- ✅ AR 네비게이션 (GPS 추적, 방향 화살표, 거리 표시)
- ✅ 도착 화면 및 피드백

### 관리자 기능
- ✅ 통계 대시보드
- ✅ 세션 관리
- ✅ 목적지 관리 (CRUD)

## 🔧 기술 스택

### Frontend
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- geolib (지리 계산)
- Zustand (상태 관리)

### Backend
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- Pydantic

### Infrastructure
- Docker & Docker Compose
- PostgreSQL 15+

## 📖 문서

- [구현 계획](./01_지식베이스/00_구현_계획.md)
- [ERD](./01_지식베이스/00_프로젝트_ERD.md)
- [PRD](./01_지식베이스/00_프로젝트_PRD.md)
- [테스트 가이드](./TESTING_GUIDE.md)
- [Admin 설정 가이드](./ADMIN_SETUP.md)
- [구현 상태](./IMPLEMENTATION_STATUS.md)

## 🎯 워크플로우

각 워크플로우별 상세 문서:
- [1.00 프로젝트 초기 설정](./01_지식베이스/1.00_프로젝트_초기_설정.md)
- [2.00 데이터베이스 설계 및 마이그레이션](./01_지식베이스/2.00_데이터베이스_설계_마이그레이션.md)
- [3.00 백엔드 API 서버 구축](./01_지식베이스/3.00_백엔드_API_서버_구축.md)
- [4.00 프론트엔드 시작화면 구현](./01_지식베이스/4.00_프론트엔드_시작화면_구현.md)
- [5.00 목적지 선택 화면 구현](./01_지식베이스/5.00_목적지_선택_화면_구현.md)
- [6.00 AR 네비 실행 화면 구현](./01_지식베이스/6.00_AR_네비_실행_화면_구현.md)
- [7.00 도착 화면 구현](./01_지식베이스/7.00_도착_화면_구현.md)
- [8.00 Admin 관리자 화면 구현](./01_지식베이스/8.00_Admin_관리자_화면_구현.md)
- [9.00 통합 테스트 및 배포](./01_지식베이스/9.00_통합_테스트_및_배포.md)

## 🐛 문제 해결

### 데이터베이스 연결 오류
- PostgreSQL이 실행 중인지 확인
- `.env` 파일의 `DATABASE_URL` 확인
- 데이터베이스와 사용자가 생성되었는지 확인

### API 연결 오류
- 백엔드 서버가 실행 중인지 확인
- CORS 설정 확인
- 환경 변수 확인

### GPS 권한 오류
- 브라우저에서 위치 권한 허용
- HTTPS 또는 localhost에서 실행 (GPS API 요구사항)

## 📝 라이선스

이 프로젝트는 MVP 단계의 실험용 프로젝트입니다.

## 🤝 기여

이 프로젝트는 SCQ 기반 AR 네비게이션 기술 검증을 위한 PoC입니다.

## 📞 문의

프로젝트 관련 문의사항은 이슈를 등록해주세요.
