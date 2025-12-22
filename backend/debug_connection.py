"""
데이터베이스 연결 디버깅 스크립트
"""
import sys
import os
import socket
import subprocess
import re

# Windows 콘솔 인코딩 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

print("=" * 60)
print("데이터베이스 연결 디버깅")
print("=" * 60)

# 1. 환경 변수 확인
print("\n1. 환경 변수 확인")
print("-" * 60)
try:
    from app.config import settings
    db_url = settings.database_url
    # 비밀번호 마스킹
    masked_url = re.sub(r':([^:@]+)@', r':****@', db_url)
    print(f"✅ DATABASE_URL: {masked_url}")
    print(f"✅ SUPABASE_URL: {settings.supabase_url}")
except Exception as e:
    print(f"❌ 환경 변수 로드 실패: {e}")
    sys.exit(1)

# 2. DNS 해결 테스트
print("\n2. DNS 해결 테스트")
print("-" * 60)
hostname = "db.zjesefcqdxuawinbvghh.supabase.co"

# 방법 1: socket.getaddrinfo
print("\n방법 1: socket.getaddrinfo")
try:
    addrinfo = socket.getaddrinfo(hostname, None)
    print(f"✅ 해결 성공: {len(addrinfo)} 개의 주소 발견")
    for addr in addrinfo[:3]:  # 처음 3개만 출력
        print(f"   - {addr[4][0]} ({'IPv6' if addr[0] == socket.AF_INET6 else 'IPv4'})")
except Exception as e:
    print(f"❌ 실패: {e}")

# 방법 2: nslookup
print("\n방법 2: nslookup")
try:
    result = subprocess.run(
        ["nslookup", hostname],
        capture_output=True,
        text=True,
        timeout=5
    )
    if result.returncode == 0:
        print("✅ nslookup 성공")
        # IPv4 찾기
        ipv4_match = re.search(r'Address:\s+(\d+\.\d+\.\d+\.\d+)', result.stdout)
        if ipv4_match:
            print(f"   - IPv4: {ipv4_match.group(1)}")
        # IPv6 찾기
        ipv6_matches = re.findall(r'Address:\s+([0-9a-f:]+)', result.stdout, re.IGNORECASE)
        for ipv6 in ipv6_matches[:2]:
            print(f"   - IPv6: {ipv6}")
    else:
        print(f"❌ nslookup 실패: {result.stderr}")
except Exception as e:
    print(f"❌ nslookup 실행 실패: {e}")

# 방법 3: ping 테스트
print("\n3. 네트워크 연결 테스트")
print("-" * 60)
try:
    result = subprocess.run(
        ["ping", "-n", "1", hostname],
        capture_output=True,
        text=True,
        timeout=5
    )
    if result.returncode == 0:
        print("✅ ping 성공")
    else:
        print(f"⚠️ ping 실패 (일부 방화벽에서는 ping이 차단될 수 있음)")
except Exception as e:
    print(f"⚠️ ping 실행 실패: {e}")

# 4. 데이터베이스 연결 테스트
print("\n4. 데이터베이스 연결 테스트")
print("-" * 60)
try:
    from app.database import SessionLocal, engine
    print("✅ 데이터베이스 모듈 로드 성공")
    
    # 연결 테스트
    print("연결 시도 중...")
    db = SessionLocal()
    try:
        from sqlalchemy import text
        result = db.execute(text("SELECT 1"))
        print("✅ 데이터베이스 연결 성공!")
        
        # 테이블 목록 확인
        print("\n5. Supabase 테이블 확인")
        print("-" * 60)
        from sqlalchemy import inspect
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
        
        print(f"✅ 발견된 테이블 ({len(tables)}개):")
        for table in sorted(tables):
            status = "✅" if table in expected_tables else "⚠️"
            print(f"   {status} {table}")
        
        print(f"\n예상 테이블 ({len(expected_tables)}개):")
        for table in expected_tables:
            status = "✅" if table in tables else "❌"
            print(f"   {status} {table}")
        
        # 누락된 테이블 확인
        missing = [t for t in expected_tables if t not in tables]
        if missing:
            print(f"\n⚠️ 누락된 테이블: {', '.join(missing)}")
            print("   → Supabase SQL Editor에서 스키마를 생성해야 합니다.")
        else:
            print("\n✅ 모든 필요한 테이블이 존재합니다!")
            
    finally:
        db.close()
        
except Exception as e:
    print(f"❌ 데이터베이스 연결 실패: {e}")
    import traceback
    print("\n상세 오류:")
    traceback.print_exc()

print("\n" + "=" * 60)
print("디버깅 완료")
print("=" * 60)

