from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
from app.database import get_db
from app import models
from app.schemas import user, auth
from app.config import settings
import psycopg2
import logging
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

def get_direct_db_connection():
    """직접 psycopg2 연결 사용 (SQLAlchemy 우회)"""
    try:
        conn = psycopg2.connect(settings.database_url)
        return conn
    except Exception as e:
        logger.error(f"Direct database connection failed: {e}")
        raise HTTPException(status_code=503, detail=f"데이터베이스 연결 실패: {str(e)}")

@router.post("/sync-user", response_model=user.UserResponse)
def sync_user_from_google(
    user_data: auth.SyncUserRequest
):
    """
    Google 로그인 후 사용자 정보 동기화
    Google ID로 사용자를 찾거나 생성
    직접 psycopg2 연결 사용 (SQLAlchemy 연결 문제 우회)
    """
    conn = None
    cursor = None
    
    try:
        logger.info(f"사용자 동기화 시작: {user_data.email} (Google ID: {user_data.google_id})")
        
        # 데이터베이스 연결
        conn = get_direct_db_connection()
        cursor = conn.cursor()
        
        # 테이블 존재 확인
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        """)
        table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            logger.error("users 테이블이 존재하지 않습니다.")
            raise HTTPException(
                status_code=503, 
                detail="데이터베이스 테이블이 초기화되지 않았습니다. 마이그레이션을 실행해주세요."
            )
        
        # Google ID로 기존 사용자 찾기
        logger.debug(f"Google ID로 사용자 검색: {user_data.google_id}")
        cursor.execute(
            "SELECT id, email, name, google_id, avatar_url, created_at, updated_at FROM users WHERE google_id = %s",
            (user_data.google_id,)
        )
        existing_user = cursor.fetchone()
        
        if existing_user:
            logger.info(f"기존 사용자 발견 (Google ID): {existing_user[1]}")
            # 사용자 정보 업데이트
            cursor.execute(
                """UPDATE users SET 
                   email = %s, 
                   name = %s, 
                   avatar_url = %s, 
                   updated_at = NOW() 
                   WHERE google_id = %s 
                   RETURNING id, email, name, google_id, avatar_url, created_at, updated_at""",
                (user_data.email, user_data.name, user_data.avatar_url, user_data.google_id)
            )
            updated_user = cursor.fetchone()
            conn.commit()
            
            logger.info(f"사용자 정보 업데이트 완료: {updated_user[1]}")
            return create_user_response(updated_user)
        
        # 이메일로 기존 사용자 찾기
        logger.debug(f"이메일로 사용자 검색: {user_data.email}")
        cursor.execute(
            "SELECT id, email, name, google_id, avatar_url, created_at, updated_at FROM users WHERE email = %s",
            (user_data.email,)
        )
        existing_by_email = cursor.fetchone()
        
        if existing_by_email:
            logger.info(f"기존 사용자 발견 (이메일): {existing_by_email[1]}")
            # Google ID 추가
            cursor.execute(
                """UPDATE users SET 
                   google_id = %s, 
                   name = %s, 
                   avatar_url = %s, 
                   updated_at = NOW() 
                   WHERE email = %s 
                   RETURNING id, email, name, google_id, avatar_url, created_at, updated_at""",
                (user_data.google_id, user_data.name, user_data.avatar_url, user_data.email)
            )
            updated_user = cursor.fetchone()
            conn.commit()
            
            logger.info(f"Google ID 추가 완료: {updated_user[1]}")
            return create_user_response(updated_user)
        
        # 새 사용자 생성
        logger.info(f"새 사용자 생성: {user_data.email}")
        new_user_id = str(uuid.uuid4())
        cursor.execute(
            """INSERT INTO users (id, email, name, google_id, avatar_url, created_at, updated_at) 
               VALUES (%s, %s, %s, %s, %s, NOW(), NOW()) 
               RETURNING id, email, name, google_id, avatar_url, created_at, updated_at""",
            (new_user_id, user_data.email, user_data.name, user_data.google_id, user_data.avatar_url)
        )
        new_user = cursor.fetchone()
        conn.commit()
        
        logger.info(f"새 사용자 생성 완료: {new_user[1]} (ID: {new_user[0]})")
        return create_user_response(new_user)
        
    except HTTPException:
        # HTTPException은 그대로 전달
        raise
    except psycopg2.Error as e:
        # PostgreSQL 관련 에러
        error_msg = str(e)
        logger.error(f"PostgreSQL 에러: {error_msg}")
        
        if conn:
            conn.rollback()
        
        if "could not translate host name" in error_msg or "Name or service not known" in error_msg:
            raise HTTPException(
                status_code=503,
                detail="데이터베이스 서버에 연결할 수 없습니다. PostgreSQL 컨테이너가 실행 중인지 확인해주세요."
            )
        elif "password authentication failed" in error_msg:
            raise HTTPException(
                status_code=503,
                detail="데이터베이스 인증에 실패했습니다. 환경 변수를 확인해주세요."
            )
        elif "Connection refused" in error_msg:
            raise HTTPException(
                status_code=503,
                detail="데이터베이스 포트에 연결할 수 없습니다. PostgreSQL이 실행 중인지 확인해주세요."
            )
        else:
            raise HTTPException(
                status_code=500, 
                detail=f"데이터베이스 오류: {error_msg}"
            )
    except Exception as e:
        # 기타 예외
        import traceback
        error_msg = str(e)
        logger.error(f"사용자 동기화 중 예외 발생: {error_msg}")
        logger.error(traceback.format_exc())
        
        if conn:
            conn.rollback()
        
        raise HTTPException(
            status_code=500, 
            detail=f"사용자 동기화 실패: {error_msg}"
        )
    finally:
        # 리소스 정리
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def create_user_response(user_row):
    """사용자 응답 객체 생성 헬퍼 함수"""
    return {
        "id": str(user_row[0]),
        "email": user_row[1],
        "name": user_row[2],
        "google_id": user_row[3],
        "avatar_url": user_row[4],
        "created_at": user_row[5],
        "updated_at": user_row[6]
    }

@router.get("/user/{user_id}", response_model=user.UserResponse)
def get_user_by_id(user_id: str):
    """사용자 ID로 조회 - 직접 psycopg2 연결 사용"""
    try:
        conn = get_direct_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, email, name, google_id, avatar_url, created_at, updated_at FROM users WHERE id = %s",
            (user_id,)
        )
        user_row = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": str(user_row[0]),
            "email": user_row[1],
            "name": user_row[2],
            "google_id": user_row[3],
            "avatar_url": user_row[4],
            "created_at": user_row[5],
            "updated_at": user_row[6]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_user_by_id: {e}")
        raise HTTPException(status_code=500, detail=f"사용자 조회 실패: {str(e)}")

