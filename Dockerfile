# MLOps 환경 Dockerfile
FROM python:3.10-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 프로젝트 파일 복사
COPY . .

# MLFlow 포트 노출
EXPOSE 5000

# 기본 명령어
CMD ["python", "run_mlops.py"]

