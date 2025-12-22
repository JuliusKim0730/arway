"""데이터베이스 설정 및 마이그레이션 스크립트"""
import sys
import os
from pathlib import Path

# 백엔드 디렉토리를 경로에 추가
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

def check_database_connection():
    """데이터베이스 연결 확인"""
    try:
        from app.database import engine
        from sqlalchemy import text
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("[OK] 데이터베이스 연결 성공!")
            return True
    except Exception as e:
        print(f"[FAIL] 데이터베이스 연결 실패: {e}")
        print("\n[INFO] PostgreSQL이 실행 중인지 확인하세요:")
        print("  - Docker 사용: docker-compose up -d postgres")
        print("  - 로컬 PostgreSQL: 서비스가 실행 중인지 확인")
        return False

def run_migrations():
    """마이그레이션 실행"""
    try:
        import subprocess
        os.chdir(backend_dir)
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        
        if result.returncode == 0:
            print("[OK] 마이그레이션 실행 완료!")
            print(result.stdout)
            return True
        else:
            print(f"[FAIL] 마이그레이션 실행 실패:")
            print(result.stderr)
            return False
    except Exception as e:
        print(f"[FAIL] 마이그레이션 실행 중 오류: {e}")
        return False

def seed_data():
    """시드 데이터 생성"""
    try:
        from app.database.seeds import seed_initial_data
        seed_initial_data()
        return True
    except Exception as e:
        print(f"[FAIL] 시드 데이터 생성 실패: {e}")
        return False

if __name__ == "__main__":
    print("=" * 70)
    print("데이터베이스 설정 및 마이그레이션")
    print("=" * 70)
    
    # 1. 데이터베이스 연결 확인
    print("\n[1] 데이터베이스 연결 확인...")
    if not check_database_connection():
        print("\n[WARN] 데이터베이스 연결에 실패했습니다.")
        print("PostgreSQL을 먼저 실행한 후 다시 시도하세요.")
        sys.exit(1)
    
    # 2. 마이그레이션 실행
    print("\n[2] 마이그레이션 실행...")
    if not run_migrations():
        print("\n[WARN] 마이그레이션 실행에 실패했습니다.")
        sys.exit(1)
    
    # 3. 시드 데이터 생성
    print("\n[3] 시드 데이터 생성...")
    if not seed_data():
        print("\n[WARN] 시드 데이터 생성에 실패했습니다.")
        sys.exit(1)
    
    print("\n" + "=" * 70)
    print("[OK] 데이터베이스 설정 완료!")
    print("=" * 70)

