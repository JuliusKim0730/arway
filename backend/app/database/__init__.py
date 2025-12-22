# Database utilities
from sqlalchemy import create_engine, text, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError, DisconnectionError
from app.config import settings
import logging
import urllib.parse
import subprocess
import re
import time
from functools import wraps
from typing import Callable, Any

logger = logging.getLogger(__name__)

def resolve_supabase_hostname(hostname):
    """Supabase 호스트 이름을 IP 주소로 해결 (Windows DNS 문제 우회)"""
    # Supabase 호스트 이름인 경우에만 처리
    if "supabase.co" not in hostname:
        return None
    
    try:
        # nslookup을 사용하여 IP 주소 찾기
        result = subprocess.run(
            ["nslookup", hostname],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            # 모든 Address 라인 찾기
            addresses = re.findall(r'Address:\s+([^\s]+)', result.stdout)
            
            if addresses:
                # 첫 번째 주소는 DNS 서버 주소일 수 있으므로 제외
                # 호스트 이름 다음에 나오는 주소들을 확인
                lines = result.stdout.split('\n')
                hostname_found = False
                
                for line in lines:
                    # 호스트 이름이 발견된 후의 주소만 사용
                    if hostname.lower() in line.lower() or 'Name:' in line:
                        hostname_found = True
                        continue
                    
                    if hostname_found:
                        # IPv4 주소 찾기 (우선)
                        ipv4_match = re.search(r'Address:\s+(\d+\.\d+\.\d+\.\d+)', line)
                        if ipv4_match:
                            ipv4 = ipv4_match.group(1)
                            # DNS 서버 주소가 아닌지 확인 (일반적인 DNS 서버 주소 패턴 제외)
                            if not ipv4.startswith(('127.', '169.254.', '192.168.', '10.', '172.')):
                                logger.info(f"DNS 해결 (IPv4): {hostname} -> {ipv4}")
                                return ipv4
                        
                        # IPv6 주소 찾기
                        ipv6_match = re.search(r'Address:\s+([0-9a-fA-F:]+)', line)
                        if ipv6_match:
                            ipv6 = ipv6_match.group(1)
                            logger.info(f"DNS 해결 (IPv6): {hostname} -> {ipv6}")
                            # IPv6 주소는 대괄호로 감싸야 함 (URL 형식)
                            return f"[{ipv6}]"
                
                # 위 방법이 실패하면 마지막 주소 사용 (DNS 서버 주소 제외)
                for addr in reversed(addresses):
                    # IPv4 주소인지 확인
                    if re.match(r'^\d+\.\d+\.\d+\.\d+$', addr):
                        # DNS 서버 주소가 아닌지 확인
                        if not addr.startswith(('127.', '169.254.', '192.168.', '10.', '172.')):
                            logger.info(f"DNS 해결 (IPv4, fallback): {hostname} -> {addr}")
                            return addr
                    # IPv6 주소인지 확인
                    elif ':' in addr:
                        logger.info(f"DNS 해결 (IPv6, fallback): {hostname} -> {addr}")
                        return f"[{addr}]"
        
        logger.warning(f"DNS 해결 실패: IPv4/IPv6 주소를 찾을 수 없음")
    except Exception as e:
        logger.warning(f"DNS 해결 실패: {e}")
    
    return None

# 연결 풀 설정 추가 (안정적인 연결 관리)
connect_args = {
    "connect_timeout": 30,  # 연결 타임아웃 30초 (Supabase 연결에 충분한 시간 제공)
    "keepalives": 1,        # Keepalive 활성화
    "keepalives_idle": 30,  # Keepalive idle 시간
    "keepalives_interval": 10,  # Keepalive 간격
    "keepalives_count": 5,  # Keepalive 재시도 횟수
}

# DATABASE_URL 처리
database_url = settings.database_url
if "supabase.co" in database_url:
    parsed = urllib.parse.urlparse(database_url)
    hostname = parsed.hostname
    
    # 연결 풀러 호스트인 경우 DNS 해결 시도하지 않음 (IPv4 제공 가능)
    if "pooler.supabase.com" in hostname:
        logger.info(f"Supabase 연결 풀러 사용: {hostname} (호스트 이름 직접 사용)")
    else:
        # 직접 연결 호스트인 경우에만 DNS 해결 시도
        # 하지만 Windows DNS 문제로 인해 호스트 이름 직접 사용 권장
        logger.info(f"Supabase 직접 연결: {hostname} (호스트 이름 직접 사용)")
        # DNS 해결은 비활성화 (호스트 이름 직접 사용)
        # resolved_ip = resolve_supabase_hostname(hostname)
        # if resolved_ip and not resolved_ip.startswith('['):
        #     # IPv4만 사용 (IPv6는 네트워크에서 차단될 수 있음)
        #     database_url = database_url.replace(hostname, resolved_ip)
        #     logger.info(f"Supabase 연결: {hostname} -> {resolved_ip} (IPv4 DNS 해결 완료)")
    
    # 연결 옵션 추가
    if "?" not in database_url:
        # SSL 모드 및 연결 타임아웃 설정
        database_url += "?sslmode=require&connect_timeout=30"
    elif "sslmode" not in database_url:
        # SSL 모드가 없으면 추가
        database_url += "&sslmode=require"
    
    # 연결 풀러 사용 시 (포트 6543) 추가 설정
    if ":6543" in database_url:
        logger.info("Supabase 연결 풀러 사용 중 (포트 6543)")
    elif ":5432" in database_url:
        logger.info("Supabase 직접 연결 사용 중 (포트 5432)")

engine = create_engine(
    database_url,
    poolclass=None,      # 연결 풀 비활성화
    echo=settings.debug, # 디버그 모드에서 SQL 쿼리 출력
    connect_args=connect_args
)

# 연결 이벤트 리스너
@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    logger.debug("데이터베이스 연결 생성")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def retry_db_connection(max_retries: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """
    데이터베이스 연결 재시도 데코레이터
    
    Args:
        max_retries: 최대 재시도 횟수
        delay: 초기 재시도 지연 시간 (초)
        backoff: 재시도 간격 배수 (exponential backoff)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            current_delay = delay
            
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except (OperationalError, DisconnectionError) as e:
                    last_exception = e
                    error_msg = str(e)
                    
                    # 재시도 가능한 오류인지 확인
                    retryable_errors = [
                        "could not translate host name",
                        "Name or service not known",
                        "connection timeout",
                        "connection closed",
                        "server closed the connection",
                        "connection was closed",
                        "lost connection"
                    ]
                    
                    is_retryable = any(err in error_msg.lower() for err in retryable_errors)
                    
                    if not is_retryable or attempt == max_retries - 1:
                        # 재시도 불가능하거나 마지막 시도인 경우
                        raise
                    
                    logger.warning(
                        f"데이터베이스 연결 실패 (시도 {attempt + 1}/{max_retries}): {error_msg}"
                    )
                    logger.info(f"{current_delay}초 후 재시도...")
                    
                    time.sleep(current_delay)
                    current_delay *= backoff  # Exponential backoff
                    
                    # 연결 풀 재설정 시도
                    try:
                        engine.dispose()
                        logger.info("연결 풀 재설정 완료")
                    except Exception as pool_error:
                        logger.warning(f"연결 풀 재설정 실패: {pool_error}")
            
            # 모든 재시도 실패
            if last_exception:
                raise last_exception
            
        return wrapper
    return decorator

def get_db():
    """
    데이터베이스 세션 생성 (의존성 주입용)
    매번 새로운 연결 생성 (연결 풀 없음)
    """
    db = SessionLocal()
    try:
        # 연결 테스트
        db.execute(text("SELECT 1"))
        yield db
    except Exception as e:
        logger.error(f"데이터베이스 세션 오류: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def test_connection() -> bool:
    """
    데이터베이스 연결 테스트
    
    Returns:
        bool: 연결 성공 여부
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("데이터베이스 연결 테스트 성공")
        return True
    except Exception as e:
        logger.error(f"데이터베이스 연결 테스트 실패: {e}")
        return False

# 연결 오류 이벤트 핸들러 추가
@event.listens_for(engine, "invalidate")
def receive_invalidate(dbapi_conn, connection_record, exception):
    """연결 무효화 이벤트 처리"""
    logger.warning(f"데이터베이스 연결이 무효화되었습니다: {exception}")

__all__ = ["Base", "SessionLocal", "get_db", "engine", "test_connection", "retry_db_connection"]

