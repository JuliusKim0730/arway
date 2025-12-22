#!/bin/bash

echo "🚀 ARWay Lite 프로젝트 설정 시작..."

# 1. Frontend 의존성 설치
echo "📦 Frontend 의존성 설치 중..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..

# 2. Backend 가상환경 및 의존성 설치
echo "🐍 Backend 가상환경 설정 중..."
cd backend
if [ ! -d "venv" ]; then
    python -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
cd ..

# 3. 환경 변수 파일 복사
echo "⚙️ 환경 변수 파일 설정 중..."
if [ ! -f "frontend/.env.local" ]; then
    cp frontend/.env.example frontend/.env.local
fi
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
fi

echo "✅ 설정 완료!"
echo ""
echo "다음 단계:"
echo "1. PostgreSQL 데이터베이스 생성"
echo "2. backend/.env 파일 수정 (DATABASE_URL 확인)"
echo "3. docker-compose up -d (또는 로컬 PostgreSQL 사용)"
echo "4. alembic upgrade head (데이터베이스 마이그레이션)"
echo "5. npm run dev (frontend)"
echo "6. uvicorn app.main:app --reload (backend)"

