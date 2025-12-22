"""프로젝트 상태 체크 스크립트"""
import sys
import os
from pathlib import Path

def check_file_exists(path, description):
    """파일 존재 여부 확인"""
    exists = os.path.exists(path)
    status = "[OK]" if exists else "[FAIL]"
    print(f"{status} {description}: {path}")
    return exists

def check_directory_exists(path, description):
    """디렉토리 존재 여부 확인"""
    exists = os.path.isdir(path)
    status = "[OK]" if exists else "[FAIL]"
    print(f"{status} {description}: {path}")
    return exists

print("=" * 70)
print("ARWay Lite 프로젝트 상태 체크")
print("=" * 70)

results = []

# 프로젝트 구조 확인
print("\n[1] 프로젝트 구조 확인")
results.append(check_directory_exists("frontend", "프론트엔드 디렉토리"))
results.append(check_directory_exists("backend", "백엔드 디렉토리"))
results.append(check_directory_exists("admin", "관리자 디렉토리"))

# 프론트엔드 확인
print("\n[2] 프론트엔드 확인")
results.append(check_file_exists("frontend/package.json", "프론트엔드 package.json"))
results.append(check_directory_exists("frontend/node_modules", "프론트엔드 node_modules"))
results.append(check_directory_exists("frontend/app/ar-nav", "AR 네비게이션 화면"))

# 백엔드 확인
print("\n[3] 백엔드 확인")
results.append(check_file_exists("backend/requirements.txt", "백엔드 requirements.txt"))
results.append(check_file_exists("backend/app/main.py", "백엔드 main.py"))
results.append(check_file_exists("backend/alembic.ini", "Alembic 설정"))
results.append(check_file_exists("backend/alembic/versions/001_initial_migration.py", "마이그레이션 파일"))

# SCQ 엔진 확인
print("\n[4] SCQ 엔진 확인")
results.append(check_file_exists("backend/app/scq/scq_layer.py", "SCQ Layer"))
results.append(check_file_exists("backend/app/scq/scq_autoencoder.py", "SCQ Autoencoder"))
results.append(check_file_exists("backend/app/scq/test_scq.py", "SCQ 테스트"))

# 환경 변수 확인
print("\n[5] 환경 변수 확인")
env_exists = check_file_exists("backend/.env", "백엔드 .env 파일")
if not env_exists:
    env_example = check_file_exists("backend/.env.example", "백엔드 .env.example")
    if env_example:
        print("  [INFO] .env.example 파일이 있습니다. .env 파일을 생성하세요.")

# Docker 설정 확인
print("\n[6] Docker 설정 확인")
results.append(check_file_exists("docker-compose.yml", "Docker Compose 설정"))

print("\n" + "=" * 70)
if all(results):
    print("[OK] 모든 필수 파일과 디렉토리가 존재합니다!")
else:
    print("[WARN] 일부 파일이나 디렉토리가 없습니다.")
print("=" * 70)

# 라이브러리 설치 확인
print("\n[7] Python 라이브러리 확인")
try:
    import torch
    print(f"[OK] PyTorch: {torch.__version__}")
except ImportError:
    print("[FAIL] PyTorch: 설치되지 않음")

try:
    import cvxpy
    print(f"[OK] CVXPY: {cvxpy.__version__}")
except ImportError:
    print("[FAIL] CVXPY: 설치되지 않음")

try:
    import cvxpylayers
    print(f"[OK] CVXPYLayers: {cvxpylayers.__version__}")
except ImportError:
    print("[FAIL] CVXPYLayers: 설치되지 않음")

try:
    import fastapi
    print(f"[OK] FastAPI: {fastapi.__version__}")
except ImportError:
    print("[FAIL] FastAPI: 설치되지 않음")

print("\n" + "=" * 70)

