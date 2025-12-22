#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
프로젝트 디버깅 및 상태 확인 스크립트
"""
import sys
import os
from pathlib import Path

# Windows 콘솔 인코딩 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def check_python_version():
    """Python 버전 확인"""
    print("=" * 60)
    print("1. Python 버전 확인")
    print("=" * 60)
    version = sys.version_info
    print(f"Python 버전: {version.major}.{version.minor}.{version.micro}")
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("[WARN] 경고: Python 3.8 이상이 필요합니다.")
        return False
    print("[OK] Python 버전 확인 완료\n")
    return True

def check_backend_dependencies():
    """백엔드 의존성 확인"""
    print("=" * 60)
    print("2. 백엔드 의존성 확인")
    print("=" * 60)
    
    backend_path = Path(__file__).parent / "backend"
    requirements_file = backend_path / "requirements.txt"
    
    if not requirements_file.exists():
        print("[ERROR] requirements.txt 파일을 찾을 수 없습니다.")
        return False
    
    print(f"[OK] requirements.txt 파일 존재: {requirements_file}")
    
    # 주요 패키지 확인
    required_packages = [
        "fastapi",
        "uvicorn",
        "sqlalchemy",
        "psycopg2",
        "alembic",
        "pydantic",
        "pydantic_settings",
    ]
    
    try:
        import importlib
        missing_packages = []
        for package in required_packages:
            try:
                # 패키지 이름 변환 (psycopg2-binary -> psycopg2)
                import_name = package.replace("-", "_").replace("_binary", "")
                importlib.import_module(import_name)
                print(f"  [OK] {package}")
            except ImportError:
                print(f"  [ERROR] {package} (설치 필요)")
                missing_packages.append(package)
        
        if missing_packages:
            print(f"\n[WARN] 누락된 패키지: {', '.join(missing_packages)}")
            print("   설치 명령: pip install -r backend/requirements.txt")
            return False
        
        print("[OK] 모든 필수 패키지 설치 확인 완료\n")
        return True
    except Exception as e:
        print(f"[ERROR] 의존성 확인 중 오류: {e}")
        return False

def check_backend_config():
    """백엔드 설정 확인"""
    print("=" * 60)
    print("3. 백엔드 설정 확인")
    print("=" * 60)
    
    backend_path = Path(__file__).parent / "backend"
    env_file = backend_path / ".env"
    config_file = backend_path / "app" / "config.py"
    
    # .env 파일 확인
    if env_file.exists():
        print(f"[OK] .env 파일 존재: {env_file}")
        try:
            with open(env_file, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'DATABASE_URL' in content or 'database_url' in content:
                    print("  [OK] DATABASE_URL 설정 확인")
                else:
                    print("  [WARN] DATABASE_URL 설정이 없습니다.")
        except Exception as e:
            print(f"  [WARN] .env 파일 읽기 오류: {e}")
    else:
        print(f"[WARN] .env 파일 없음: {env_file}")
        print("  기본값 사용 (config.py의 기본값)")
    
    # config.py 확인
    if config_file.exists():
        print(f"[OK] config.py 파일 존재: {config_file}")
    else:
        print(f"[ERROR] config.py 파일 없음: {config_file}")
        return False
    
    # 설정 로드 테스트
    try:
        sys.path.insert(0, str(backend_path))
        from app.config import settings
        print(f"  [OK] 데이터베이스 URL: {settings.database_url[:50]}...")
        print(f"  [OK] 디버그 모드: {settings.debug}")
        print("[OK] 설정 로드 성공\n")
        return True
    except Exception as e:
        print(f"[ERROR] 설정 로드 실패: {e}\n")
        return False

def check_database_connection():
    """데이터베이스 연결 확인"""
    print("=" * 60)
    print("4. 데이터베이스 연결 확인")
    print("=" * 60)
    
    backend_path = Path(__file__).parent / "backend"
    sys.path.insert(0, str(backend_path))
    
    try:
        from app.config import settings
        from app.database import engine
        
        # 연결 테스트
        with engine.connect() as conn:
            from sqlalchemy import text
            result = conn.execute(text("SELECT 1"))
            print("[OK] 데이터베이스 연결 성공")
            print(f"  데이터베이스 URL: {settings.database_url[:50]}...")
            print("[OK] 데이터베이스 연결 확인 완료\n")
            return True
    except Exception as e:
        print(f"[ERROR] 데이터베이스 연결 실패: {e}")
        print("  확인 사항:")
        print("  1. PostgreSQL이 실행 중인지 확인")
        print("  2. docker-compose up -d postgres 실행")
        print("  3. .env 파일의 DATABASE_URL 확인")
        print("")
        return False

def check_frontend_dependencies():
    """프론트엔드 의존성 확인"""
    print("=" * 60)
    print("5. 프론트엔드 의존성 확인")
    print("=" * 60)
    
    frontend_path = Path(__file__).parent / "frontend"
    package_json = frontend_path / "package.json"
    node_modules = frontend_path / "node_modules"
    
    if not package_json.exists():
        print(f"[ERROR] package.json 파일 없음: {package_json}")
        return False
    
    print(f"[OK] package.json 파일 존재: {package_json}")
    
    if node_modules.exists():
        print(f"[OK] node_modules 폴더 존재")
        # 주요 패키지 확인
        required_modules = ["next", "react", "react-dom"]
        missing_modules = []
        for module in required_modules:
            module_path = node_modules / module
            if module_path.exists():
                print(f"  [OK] {module}")
            else:
                print(f"  [ERROR] {module} (설치 필요)")
                missing_modules.append(module)
        
        if missing_modules:
            print(f"\n[WARN] 누락된 모듈: {', '.join(missing_modules)}")
            print("   설치 명령: cd frontend && npm install")
            return False
    else:
        print("[WARN] node_modules 폴더 없음")
        print("   설치 명령: cd frontend && npm install")
        return False
    
    print("[OK] 프론트엔드 의존성 확인 완료\n")
    return True

def check_project_structure():
    """프로젝트 구조 확인"""
    print("=" * 60)
    print("6. 프로젝트 구조 확인")
    print("=" * 60)
    
    base_path = Path(__file__).parent
    
    required_dirs = [
        "backend",
        "backend/app",
        "backend/app/api",
        "backend/app/models",
        "backend/app/schemas",
        "frontend",
        "frontend/app",
        "frontend/components",
    ]
    
    all_exist = True
    for dir_path in required_dirs:
        full_path = base_path / dir_path
        if full_path.exists():
            print(f"  [OK] {dir_path}")
        else:
            print(f"  [ERROR] {dir_path} (없음)")
            all_exist = False
    
    if all_exist:
        print("[OK] 프로젝트 구조 확인 완료\n")
    else:
        print("[WARN] 일부 디렉토리가 없습니다.\n")
    
    return all_exist

def main():
    """메인 함수"""
    print("\n" + "=" * 60)
    print("ARWay Lite 프로젝트 디버깅 및 상태 확인")
    print("=" * 60 + "\n")
    
    results = []
    
    # 각 항목 확인
    results.append(("Python 버전", check_python_version()))
    results.append(("프로젝트 구조", check_project_structure()))
    results.append(("백엔드 의존성", check_backend_dependencies()))
    results.append(("백엔드 설정", check_backend_config()))
    results.append(("데이터베이스 연결", check_database_connection()))
    results.append(("프론트엔드 의존성", check_frontend_dependencies()))
    
    # 결과 요약
    print("=" * 60)
    print("결과 요약")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "[OK] 통과" if result else "[ERROR] 실패"
        print(f"{name}: {status}")
    
    print(f"\n총 {passed}/{total} 항목 통과")
    
    if passed == total:
        print("\n[SUCCESS] 모든 확인 항목이 통과했습니다!")
        return 0
    else:
        print(f"\n[WARN] {total - passed}개 항목을 확인하고 수정해주세요.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

