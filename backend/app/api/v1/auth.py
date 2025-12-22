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
    try:
        conn = get_direct_db_connection()
        cursor = conn.cursor()
        
        # Google ID로 기존 사용자 찾기
        cursor.execute(
            "SELECT id, email, name, google_id, avatar_url, created_at, updated_at FROM users WHERE google_id = %s",
            (user_data.google_id,)
        )
        existing_user = cursor.fetchone()
        
        if existing_user:
            # 사용자 정보 업데이트
            cursor.execute(
                "UPDATE users SET email = %s, name = %s, avatar_url = %s, updated_at = NOW() WHERE google_id = %s RETURNING id, email, name, google_id, avatar_url, created_at, updated_at",
                (user_data.email, user_data.name, user_data.avatar_url, user_data.google_id)
            )
            updated_user = cursor.fetchone()
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                "id": str(updated_user[0]),
                "email": updated_user[1],
                "name": updated_user[2],
                "google_id": updated_user[3],
                "avatar_url": updated_user[4],
                "created_at": updated_user[5],
                "updated_at": updated_user[6]
            }
        
        # 이메일로 기존 사용자 찾기
        cursor.execute(
            "SELECT id, email, name, google_id, avatar_url, created_at, updated_at FROM users WHERE email = %s",
            (user_data.email,)
        )
        existing_by_email = cursor.fetchone()
        
        if existing_by_email:
            # Google ID 추가
            cursor.execute(
                "UPDATE users SET google_id = %s, name = %s, avatar_url = %s, updated_at = NOW() WHERE email = %s RETURNING id, email, name, google_id, avatar_url, created_at, updated_at",
                (user_data.google_id, user_data.name, user_data.avatar_url, user_data.email)
            )
            updated_user = cursor.fetchone()
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                "id": str(updated_user[0]),
                "email": updated_user[1],
                "name": updated_user[2],
                "google_id": updated_user[3],
                "avatar_url": updated_user[4],
                "created_at": updated_user[5],
                "updated_at": updated_user[6]
            }
        
        # 새 사용자 생성
        new_user_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO users (id, email, name, google_id, avatar_url, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, NOW(), NOW()) RETURNING id, email, name, google_id, avatar_url, created_at, updated_at",
            (new_user_id, user_data.email, user_data.name, user_data.google_id, user_data.avatar_url)
        )
        new_user = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "id": str(new_user[0]),
            "email": new_user[1],
            "name": new_user[2],
            "google_id": new_user[3],
            "avatar_url": new_user[4],
            "created_at": new_user[5],
            "updated_at": new_user[6]
        }
        
    except Exception as e:
        import traceback
        error_msg = str(e)
        logger.error(f"Error in sync_user_from_google: {error_msg}")
        logger.error(traceback.format_exc())
        
        # 데이터베이스 연결 에러인 경우 더 명확한 메시지 제공
        if "could not translate host name" in error_msg or "Name or service not known" in error_msg:
            raise HTTPException(
                status_code=503,
                detail="데이터베이스 서버에 연결할 수 없습니다. 네트워크 연결을 확인하거나 백엔드 서버를 재시작해주세요."
            )
        elif "password authentication failed" in error_msg:
            raise HTTPException(
                status_code=503,
                detail="데이터베이스 인증에 실패했습니다. 환경 변수를 확인해주세요."
            )
        else:
            raise HTTPException(status_code=500, detail=f"사용자 동기화 실패: {error_msg}")

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

