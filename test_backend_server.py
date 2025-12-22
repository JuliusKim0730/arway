"""백엔드 서버 테스트 스크립트"""
import sys
import time
import subprocess
import requests
from pathlib import Path

backend_dir = Path(__file__).parent / "backend"

def check_server_running():
    """서버가 실행 중인지 확인"""
    try:
        response = requests.get("http://localhost:8000/docs", timeout=2)
        if response.status_code == 200:
            return True
    except:
        pass
    return False

def start_backend_server():
    """백엔드 서버 시작"""
    print("[INFO] 백엔드 서버를 시작합니다...")
    print("[INFO] 서버는 백그라운드에서 실행됩니다.")
    print("[INFO] 중지하려면 Ctrl+C를 누르세요.\n")
    
    os.chdir(backend_dir)
    try:
        subprocess.run(
            ["uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
            cwd=str(backend_dir)
        )
    except KeyboardInterrupt:
        print("\n[INFO] 서버를 중지합니다...")

def test_api_endpoints():
    """API 엔드포인트 테스트"""
    base_url = "http://localhost:8000"
    
    endpoints = [
        "/docs",
        "/api/v1/destinations",
        "/api/v1/sessions",
    ]
    
    print("\n[API 엔드포인트 테스트]")
    print("=" * 70)
    
    for endpoint in endpoints:
        try:
            url = f"{base_url}{endpoint}"
            response = requests.get(url, timeout=5)
            status = "[OK]" if response.status_code < 400 else "[FAIL]"
            print(f"{status} {endpoint}: {response.status_code}")
        except Exception as e:
            print(f"[FAIL] {endpoint}: 연결 실패 - {e}")

if __name__ == "__main__":
    import os
    
    print("=" * 70)
    print("백엔드 서버 테스트")
    print("=" * 70)
    
    # 서버 실행 상태 확인
    if check_server_running():
        print("[OK] 서버가 이미 실행 중입니다.")
        test_api_endpoints()
    else:
        print("[INFO] 서버가 실행되지 않았습니다.")
        print("[INFO] 서버를 시작하려면 다음 명령을 실행하세요:")
        print("  cd backend")
        print("  uvicorn app.main:app --reload")
        print("\n또는 이 스크립트를 실행하면 서버가 시작됩니다.")
        
        response = input("\n서버를 지금 시작하시겠습니까? (y/n): ")
        if response.lower() == 'y':
            start_backend_server()
        else:
            print("[INFO] 서버 시작을 건너뜁니다.")

