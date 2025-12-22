#!/bin/bash

echo "🚀 ARWay Lite 의존성 설치 시작..."

# 1. Backend 의존성 설치
echo ""
echo "📦 Backend 의존성 설치 중..."
cd backend

# 가상환경 확인 및 생성
if [ ! -d "venv" ]; then
    echo "가상환경 생성 중..."
    python3 -m venv venv
fi

# 가상환경 활성화
echo "가상환경 활성화 중..."
source venv/bin/activate

# 의존성 설치
echo "Python 패키지 설치 중..."
pip install -r requirements.txt --quiet

echo "✅ Backend 의존성 설치 완료"
cd ..

# 2. Frontend 의존성 설치
echo ""
echo "📦 Frontend 의존성 설치 중..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "npm 패키지 설치 중..."
    npm install --silent
else
    echo "node_modules가 이미 존재합니다. 건너뜁니다."
fi

echo "✅ Frontend 의존성 설치 완료"
cd ..

# 3. Admin 의존성 설치
echo ""
echo "📦 Admin 의존성 설치 중..."
cd admin

if [ ! -d "node_modules" ]; then
    echo "npm 패키지 설치 중..."
    npm install --silent
else
    echo "node_modules가 이미 존재합니다. 건너뜁니다."
fi

echo "✅ Admin 의존성 설치 완료"
cd ..

# 4. 환경 변수 파일 확인
echo ""
echo "🔧 환경 변수 파일 확인 중..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    echo "backend/.env 파일이 없습니다. .env.example을 복사합니다..."
    cp backend/.env.example backend/.env
    echo "⚠️ backend/.env 파일을 확인하고 DATABASE_URL을 수정하세요."
else
    echo "✅ backend/.env 파일 존재"
fi

# Frontend .env.local
if [ ! -f "frontend/.env.local" ]; then
    echo "frontend/.env.local 파일이 없습니다. .env.example을 복사합니다..."
    cp frontend/.env.example frontend/.env.local
    echo "✅ frontend/.env.local 파일 생성 완료"
else
    echo "✅ frontend/.env.local 파일 존재"
fi

# Admin .env.local
if [ ! -f "admin/.env.local" ]; then
    echo "admin/.env.local 파일이 없습니다. .env.example을 복사합니다..."
    cp admin/.env.example admin/.env.local
    echo "✅ admin/.env.local 파일 생성 완료"
else
    echo "✅ admin/.env.local 파일 존재"
fi

echo ""
echo "✅ 모든 의존성 설치 완료!"
echo ""
echo "다음 단계:"
echo "1. backend/.env 파일에서 DATABASE_URL 확인 및 수정"
echo "2. 데이터베이스 마이그레이션 실행: cd backend && alembic upgrade head"
echo "3. 시드 데이터 생성: python -m app.database.seeds"
echo "4. 서버 실행:"
echo "   - Backend: cd backend && uvicorn app.main:app --reload"
echo "   - Frontend: cd frontend && npm run dev"
echo "   - Admin: cd admin && npm run dev"

