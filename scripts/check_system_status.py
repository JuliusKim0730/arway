#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
전체 시스템 상태 체크 스크립트
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from urllib.parse import urlparse

# 색상 출력을 위한 ANSI 코드
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    GRAY = '\033[90m'
    RESET = '\033[0m'

def print_header(text):
    print(f"\n{Colors.CYAN}{'='*50}{Colors.RESET}")
    print(f"{Colors.CYAN}  {text}{Colors.RESET}")
    print(f"{Colors.CYAN}{'='*50}{Colors.RESET}\n")

def print_success(text):
    print(f"{Colors.GREEN}[OK] {text}{Colors.RESET}")

def print_warning(text):
    print(f"{Colors.YELLOW}[WARN] {text}{Colors.RESET}")

def print_error(text):
    print(f"{Colors.RED}[ERROR] {text}{Colors.RESET}")

def print_info(text):
    print(f"{Colors.GRAY}   {text}{Colors.RESET}")

errors = []
warnings = []
success = []

# 프로젝트 루트 경로
project_root = Path(__file__).parent.parent
backend_path = project_root / "backend"
frontend_path = project_root / "frontend"

print_header("전체 시스템 상태 체크")

# 1. Supabase 연결 정보 확인
print(f"{Colors.YELLOW}1. Supabase 연결 정보 확인{Colors.RESET}")
print(f"{Colors.GRAY}{'-'*50}{Colors.RESET}")

env_path = backend_path / ".env"
if env_path.exists():
    env_content = env_path.read_text(encoding='utf-8', errors='ignore')
    
    # DATABASE_URL 확인
    if 'DATABASE_URL=' in env_content:
        for line in env_content.split('\n'):
            if line.strip().startswith('DATABASE_URL=') and not line.strip().startswith('#'):
                db_url = line.split('=', 1)[1].strip()
                # 비밀번호 마스킹
                masked_url = db_url.split('@')[0].split(':')[0] + ':***@' + '@'.join(db_url.split('@')[1:])
                print_success("DATABASE_URL 설정됨")
                print_info(masked_url)
                
                if 'pooler.supabase.com' in db_url:
                    print_success("연결 풀러 사용 중")
                    success.append("연결 풀러 사용")
                else:
                    print_warning("직접 연결 사용 중 (연결 풀러 권장)")
                    warnings.append("직접 연결 사용")
                break
    else:
        print_error("DATABASE_URL 없음")
        errors.append("DATABASE_URL 설정 필요")
    
    # SUPABASE_URL 확인
    if 'SUPABASE_URL=' in env_content:
        for line in env_content.split('\n'):
            if line.strip().startswith('SUPABASE_URL=') and not line.strip().startswith('#'):
                supabase_url = line.split('=', 1)[1].strip()
                print_success(f"SUPABASE_URL 설정됨: {supabase_url}")
                success.append("Supabase URL 설정")
                break
    else:
        print_warning("SUPABASE_URL 없음")
        warnings.append("SUPABASE_URL 설정 권장")
else:
    print_error(".env 파일 없음")
    errors.append(".env 파일 생성 필요")

print()

# 2. 데이터베이스 연결 테스트
print(f"{Colors.YELLOW}2. 데이터베이스 연결 테스트{Colors.RESET}")
print(f"{Colors.GRAY}{'-'*50}{Colors.RESET}")

if backend_path.exists():
    python_exe = backend_path / "venv" / "Scripts" / "python.exe"
    if python_exe.exists():
        try:
            result = subprocess.run(
                [str(python_exe), "-c", 
                 "from app.database import engine; from sqlalchemy import text; "
                 "conn = engine.connect(); result = conn.execute(text('SELECT version()')); "
                 "print('Connected:', result.fetchone()[0][:50]); conn.close()"],
                cwd=str(backend_path),
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                print_success("데이터베이스 연결 성공")
                if result.stdout:
                    print_info(result.stdout.strip())
                success.append("데이터베이스 연결")
            else:
                print_error("데이터베이스 연결 실패")
                if result.stderr:
                    error_msg = result.stderr.split('\n')[-2] if result.stderr else "알 수 없는 오류"
                    print_info(error_msg)
                errors.append("데이터베이스 연결 실패")
        except Exception as e:
            print_error(f"연결 테스트 실패: {e}")
            errors.append("데이터베이스 연결 테스트 실패")
    else:
        print_warning("Python 가상환경 없음")
        warnings.append("가상환경 설정 필요")
else:
    print_error("backend 폴더 없음")
    errors.append("backend 폴더 없음")

print()

# 3. 백엔드 서버 상태 확인
print(f"{Colors.YELLOW}3. 백엔드 서버 상태 확인{Colors.RESET}")
print(f"{Colors.GRAY}{'-'*50}{Colors.RESET}")

try:
    import urllib.request
    import urllib.error
    
    req = urllib.request.Request("http://localhost:8000/health")
    with urllib.request.urlopen(req, timeout=5) as response:
        health_data = json.loads(response.read().decode())
        
        if health_data.get('status') == 'healthy' and health_data.get('database') == 'connected':
            print_success("백엔드 서버 실행 중")
            print_success(f"Health Check: {health_data.get('status')}")
            print_success(f"데이터베이스: {health_data.get('database')}")
            success.append("백엔드 서버 실행 중")
        else:
            print_warning(f"백엔드 서버 상태: {health_data.get('status')}")
            print_warning(f"데이터베이스: {health_data.get('database')}")
            if health_data.get('error'):
                print_error(f"오류: {health_data.get('error')}")
            warnings.append("백엔드 서버 상태 불안정")
except urllib.error.URLError:
    print_error("백엔드 서버 연결 실패")
    print_info("서버가 실행 중이지 않거나 포트 8000이 사용 중입니다")
    errors.append("백엔드 서버 미실행")
except Exception as e:
    print_error(f"서버 확인 실패: {e}")
    errors.append("백엔드 서버 확인 실패")

print()

# 4. API 엔드포인트 확인
print(f"{Colors.YELLOW}4. API 엔드포인트 확인{Colors.RESET}")
print(f"{Colors.GRAY}{'-'*50}{Colors.RESET}")

endpoints = [
    {"path": "/", "name": "Root"},
    {"path": "/health", "name": "Health Check"},
    {"path": "/docs", "name": "API Documentation"}
]

for endpoint in endpoints:
    try:
        req = urllib.request.Request(f"http://localhost:8000{endpoint['path']}")
        with urllib.request.urlopen(req, timeout=3) as response:
            status_code = response.getcode()
            print_success(f"{endpoint['name']}: {endpoint['path']} (Status: {status_code})")
            success.append(f"API 엔드포인트: {endpoint['path']}")
    except Exception as e:
        print_error(f"{endpoint['name']}: {endpoint['path']} - 연결 실패")
        errors.append(f"API 엔드포인트 실패: {endpoint['path']}")

print()

# 5. Python 라이브러리 설치 확인
print(f"{Colors.YELLOW}5. Python 라이브러리 설치 확인{Colors.RESET}")
print(f"{Colors.GRAY}{'-'*50}{Colors.RESET}")

if backend_path.exists():
    python_exe = backend_path / "venv" / "Scripts" / "python.exe"
    if python_exe.exists():
        required_libs = {
            "fastapi": "fastapi",
            "uvicorn": "uvicorn",
            "sqlalchemy": "sqlalchemy",
            "psycopg2": "psycopg2",
            "pydantic": "pydantic",
            "alembic": "alembic"
        }
        
        for lib_name, import_name in required_libs.items():
            try:
                result = subprocess.run(
                    [str(python_exe), "-c", f"import {import_name}; print({import_name}.__version__)"],
                    cwd=str(backend_path),
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                if result.returncode == 0:
                    version = result.stdout.strip()
                    print_success(f"{lib_name}: {version}")
                    success.append(f"라이브러리: {lib_name}")
                else:
                    print_error(f"{lib_name}: 설치되지 않음")
                    errors.append(f"라이브러리 누락: {lib_name}")
            except Exception as e:
                print_error(f"{lib_name}: 확인 실패 - {e}")
                errors.append(f"라이브러리 확인 실패: {lib_name}")
    else:
        print_warning("Python 가상환경 없음")
        warnings.append("가상환경 설정 필요")

print()

# 6. 프론트엔드 설정 확인
print(f"{Colors.YELLOW}6. 프론트엔드 설정 확인{Colors.RESET}")
print(f"{Colors.GRAY}{'-'*50}{Colors.RESET}")

if frontend_path.exists():
    frontend_env_path = frontend_path / ".env.local"
    if frontend_env_path.exists():
        frontend_env = frontend_env_path.read_text(encoding='utf-8', errors='ignore')
        
        if 'NEXT_PUBLIC_API_URL' in frontend_env:
            print_success("NEXT_PUBLIC_API_URL 설정됨")
            success.append("프론트엔드 API URL 설정")
        else:
            print_warning("NEXT_PUBLIC_API_URL 없음")
            warnings.append("프론트엔드 API URL 설정 필요")
        
        if 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY' in frontend_env:
            print_success("Google Maps API Key 설정됨")
            success.append("Google Maps API Key 설정")
        else:
            print_warning("Google Maps API Key 없음")
            warnings.append("Google Maps API Key 설정 필요")
    else:
        print_warning(".env.local 파일 없음")
        warnings.append("프론트엔드 .env.local 파일 생성 필요")
else:
    print_warning("frontend 폴더 없음")
    warnings.append("frontend 폴더 없음")

print()

# 7. 요약
print_header("체크 결과 요약")

print(f"{Colors.GREEN}✅ 성공: {len(success)}개{Colors.RESET}")
for item in success:
    print_info(item)

print(f"\n{Colors.YELLOW}⚠️  경고: {len(warnings)}개{Colors.RESET}")
for item in warnings:
    print_info(item)

print(f"\n{Colors.RED}❌ 오류: {len(errors)}개{Colors.RESET}")
for item in errors:
    print_info(item)

print()

if len(errors) == 0:
    print_success("모든 체크 통과!")
    sys.exit(0)
else:
    print_error("일부 체크 실패. 위의 오류를 확인하세요.")
    sys.exit(1)

