"""
전체 시스템 디버깅 스크립트
"""
import sys
import os
import subprocess
import re
import json
from datetime import datetime

# Windows 콘솔 인코딩 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def print_section(title):
    """섹션 헤더 출력"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def print_status(status, message):
    """상태 출력"""
    icon = "✅" if status == "success" else "❌" if status == "error" else "⚠️"
    print(f"{icon} {message}")

def check_environment_variables():
    """환경 변수 확인"""
    print_section("1. 환경 변수 확인")
    
    try:
        from app.config import settings
        
        # DATABASE_URL 확인
        db_url = settings.database_url
        masked_url = re.sub(r':([^:@]+)@', r':****@', db_url)
        print_status("success", f"DATABASE_URL: {masked_url}")
        
        # 포트 확인
        if ":6543" in db_url:
            print_status("info", "연결 풀러 사용 중 (포트 6543)")
        elif ":5432" in db_url:
            print_status("info", "직접 연결 사용 중 (포트 5432)")
        
        # SUPABASE_URL 확인
        if settings.supabase_url:
            print_status("success", f"SUPABASE_URL: {settings.supabase_url}")
        else:
            print_status("warning", "SUPABASE_URL이 설정되지 않았습니다")
        
        # DEBUG 모드 확인
        print_status("info", f"DEBUG 모드: {settings.debug}")
        
        return True
    except Exception as e:
        print_status("error", f"환경 변수 로드 실패: {e}")
        return False

def check_dns_resolution():
    """DNS 해결 확인"""
    print_section("2. DNS 해결 확인")
    
    hostname = "db.zjesefcqdxuawinbvghh.supabase.co"
    
    # 방법 1: nslookup
    try:
        result = subprocess.run(
            ["nslookup", hostname],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            print_status("success", "nslookup 성공")
            
            # IPv4 찾기
            ipv4_match = re.search(r'Address:\s+(\d+\.\d+\.\d+\.\d+)', result.stdout)
            if ipv4_match:
                ipv4 = ipv4_match.group(1)
                print_status("success", f"IPv4 주소: {ipv4}")
            
            # IPv6 찾기
            ipv6_matches = re.findall(r'Address:\s+([0-9a-f:]+)', result.stdout, re.IGNORECASE)
            if ipv6_matches:
                for ipv6 in ipv6_matches[:2]:
                    if ':' in ipv6:
                        print_status("info", f"IPv6 주소: {ipv6}")
        else:
            print_status("error", f"nslookup 실패: {result.stderr}")
    except Exception as e:
        print_status("error", f"nslookup 실행 실패: {e}")
    
    # 방법 2: Python socket
    try:
        import socket
        addrinfo = socket.getaddrinfo(hostname, None)
        print_status("success", f"Python socket 해결 성공: {len(addrinfo)}개 주소")
    except Exception as e:
        print_status("warning", f"Python socket 해결 실패 (예상됨): {e}")

def check_database_connection():
    """데이터베이스 연결 확인"""
    print_section("3. 데이터베이스 연결 확인")
    
    try:
        from app.database import SessionLocal, engine
        from sqlalchemy import text, inspect
        
        print_status("info", "데이터베이스 모듈 로드 성공")
        
        # 연결 테스트
        print_status("info", "연결 시도 중...")
        db = SessionLocal()
        
        try:
            # 간단한 쿼리 실행
            result = db.execute(text("SELECT 1"))
            print_status("success", "데이터베이스 연결 성공!")
            
            # 테이블 목록 확인
            print_status("info", "테이블 목록 확인 중...")
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            
            expected_tables = [
                "users",
                "destinations",
                "navigation_sessions",
                "navigation_points",
                "favorites",
                "analytics_events",
                "feedback"
            ]
            
            print(f"\n발견된 테이블 ({len(tables)}개):")
            for table in sorted(tables):
                status = "✅" if table in expected_tables else "⚠️"
                print(f"  {status} {table}")
            
            print(f"\n예상 테이블 ({len(expected_tables)}개):")
            missing_tables = []
            for table in expected_tables:
                if table in tables:
                    print(f"  ✅ {table}")
                else:
                    print(f"  ❌ {table} (누락)")
                    missing_tables.append(table)
            
            if missing_tables:
                print_status("warning", f"누락된 테이블: {', '.join(missing_tables)}")
                print_status("info", "→ Supabase SQL Editor에서 스키마를 생성해야 합니다.")
                return False
            else:
                print_status("success", "모든 필요한 테이블이 존재합니다!")
                return True
                
        finally:
            db.close()
            
    except Exception as e:
        print_status("error", f"데이터베이스 연결 실패: {e}")
        import traceback
        print("\n상세 오류:")
        print(traceback.format_exc())
        return False

def check_backend_server():
    """백엔드 서버 상태 확인"""
    print_section("4. 백엔드 서버 상태 확인")
    
    try:
        import urllib.request
        import json
        
        # Health check
        try:
            with urllib.request.urlopen("http://localhost:8000/health", timeout=5) as response:
                data = json.loads(response.read().decode())
                if isinstance(data, list):
                    data = data[0] if data else {}
                
                status = data.get("status", "unknown")
                database = data.get("database", "unknown")
                
                if status == "healthy" and database == "connected":
                    print_status("success", "백엔드 서버 정상 작동")
                    print_status("success", f"데이터베이스 상태: {database}")
                    return True
                else:
                    print_status("warning", f"백엔드 서버 상태: {status}")
                    print_status("warning", f"데이터베이스 상태: {database}")
                    if "error" in data:
                        print(f"  오류: {data['error']}")
                    return False
        except urllib.error.URLError as e:
            print_status("error", f"백엔드 서버에 연결할 수 없습니다: {e}")
            print_status("info", "→ 백엔드 서버가 실행 중인지 확인하세요")
            return False
            
    except Exception as e:
        print_status("error", f"백엔드 서버 확인 실패: {e}")
        return False

def check_api_endpoints():
    """API 엔드포인트 확인"""
    print_section("5. API 엔드포인트 확인")
    
    endpoints = [
        ("GET", "/", "루트"),
        ("GET", "/health", "헬스 체크"),
        ("GET", "/docs", "API 문서"),
    ]
    
    for method, path, name in endpoints:
        try:
            import urllib.request
            url = f"http://localhost:8000{path}"
            req = urllib.request.Request(url, method=method)
            
            with urllib.request.urlopen(req, timeout=5) as response:
                status_code = response.getcode()
                if status_code == 200:
                    print_status("success", f"{method} {path} ({name}): {status_code}")
                else:
                    print_status("warning", f"{method} {path} ({name}): {status_code}")
        except Exception as e:
            print_status("error", f"{method} {path} ({name}): 연결 실패 - {e}")

def check_frontend_config():
    """프론트엔드 설정 확인"""
    print_section("6. 프론트엔드 설정 확인")
    
    frontend_env_path = os.path.join("..", "frontend", ".env.local")
    
    if os.path.exists(frontend_env_path):
        print_status("success", ".env.local 파일 존재")
        
        try:
            with open(frontend_env_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # 주요 환경 변수 확인
                checks = [
                    ("NEXT_PUBLIC_API_URL", "백엔드 API URL"),
                    ("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "Google Maps API 키"),
                    ("NEXT_PUBLIC_SUPABASE_URL", "Supabase URL"),
                    ("GOOGLE_CLIENT_ID", "Google OAuth Client ID"),
                    ("NEXTAUTH_SECRET", "NextAuth Secret"),
                ]
                
                for var_name, description in checks:
                    if var_name in content:
                        # 값 마스킹
                        lines = content.split('\n')
                        for line in lines:
                            if line.startswith(var_name):
                                value = line.split('=', 1)[1].strip() if '=' in line else ""
                                if "SECRET" in var_name or "KEY" in var_name:
                                    masked = value[:10] + "****" if len(value) > 10 else "****"
                                    print_status("success", f"{var_name}: {masked}")
                                else:
                                    print_status("success", f"{var_name}: {value}")
                                break
                    else:
                        print_status("warning", f"{var_name} ({description}) 없음")
        except Exception as e:
            print_status("error", f".env.local 파일 읽기 실패: {e}")
    else:
        print_status("warning", ".env.local 파일이 없습니다")

def generate_summary(results):
    """요약 생성"""
    print_section("7. 요약")
    
    total = len(results)
    passed = sum(1 for r in results.values() if r)
    failed = total - passed
    
    print(f"\n전체 검사: {total}개")
    print(f"✅ 통과: {passed}개")
    print(f"❌ 실패: {failed}개")
    
    if failed > 0:
        print("\n실패한 항목:")
        for name, result in results.items():
            if not result:
                print(f"  ❌ {name}")
    
    print("\n" + "=" * 70)
    if failed == 0:
        print_status("success", "모든 검사 통과!")
    else:
        print_status("warning", "일부 검사 실패. 위의 오류를 확인하세요.")

def main():
    """메인 함수"""
    print("\n" + "=" * 70)
    print("  전체 시스템 디버깅")
    print(f"  실행 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    results = {}
    
    # 1. 환경 변수 확인
    results["환경 변수"] = check_environment_variables()
    
    # 2. DNS 해결 확인
    check_dns_resolution()
    results["DNS 해결"] = True  # DNS는 확인만 하고 실패해도 계속 진행
    
    # 3. 데이터베이스 연결 확인
    results["데이터베이스 연결"] = check_database_connection()
    
    # 4. 백엔드 서버 확인
    results["백엔드 서버"] = check_backend_server()
    
    # 5. API 엔드포인트 확인
    if results["백엔드 서버"]:
        check_api_endpoints()
    
    # 6. 프론트엔드 설정 확인
    check_frontend_config()
    
    # 7. 요약
    generate_summary(results)
    
    print("\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n디버깅이 중단되었습니다.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n치명적 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

