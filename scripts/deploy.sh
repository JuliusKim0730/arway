#!/bin/bash

echo "🚀 ARWay Lite 배포 시작..."

# 1. 데이터베이스 마이그레이션
echo "📦 데이터베이스 마이그레이션 실행..."
cd backend
alembic upgrade head

# 2. 시드 데이터 생성
echo "🌱 시드 데이터 생성..."
python -m app.database.seeds

# 3. Docker Compose 시작
echo "🐳 Docker Compose 시작..."
cd ..
docker-compose up -d

echo "✅ 배포 완료!"
echo ""
echo "서비스 접속 정보:"
echo "- Frontend: http://localhost:3000/ar-nav"
echo "- Backend API: http://localhost:8000"
echo "- API 문서: http://localhost:8000/docs"
echo "- Admin: http://localhost:3001"

