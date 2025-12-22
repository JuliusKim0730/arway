"""
세션 API 테스트
"""
import pytest
from uuid import uuid4
from datetime import datetime
from app.models.user import User
from app.models.destination import Destination
from app.models.navigation_session import NavigationSession, SessionStatus
from decimal import Decimal


def test_create_session(client, db_session, test_user_id):
    """세션 생성 테스트"""
    # 테스트 사용자 생성
    test_user = User(id=test_user_id, email="test@arway.com", name="Test User")
    db_session.add(test_user)
    
    # 테스트 목적지 생성
    dest_id = uuid4()
    destination = Destination(
        id=dest_id,
        name="테스트 목적지",
        latitude=Decimal("37.511"),
        longitude=Decimal("127.029"),
        created_by=test_user_id,
        is_active=True
    )
    db_session.add(destination)
    db_session.commit()
    
    response = client.post(
        "/api/v1/sessions/",
        json={
            "user_id": test_user_id,
            "destination_id": str(dest_id),
            "start_latitude": 37.510,
            "start_longitude": 127.028,
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == test_user_id
    assert data["destination_id"] == str(dest_id)
    assert data["status"] == "active"


def test_get_session(client, db_session, test_user_id):
    """세션 조회 테스트"""
    # 테스트 사용자 생성
    test_user = User(id=test_user_id, email="test@arway.com", name="Test User")
    db_session.add(test_user)
    
    # 테스트 목적지 생성
    dest_id = uuid4()
    destination = Destination(
        id=dest_id,
        name="테스트 목적지",
        latitude=Decimal("37.511"),
        longitude=Decimal("127.029"),
        created_by=test_user_id,
        is_active=True
    )
    db_session.add(destination)
    
    # 테스트 세션 생성
    session_id = uuid4()
    session = NavigationSession(
        id=session_id,
        user_id=test_user_id,
        destination_id=dest_id,
        start_latitude=Decimal("37.510"),
        start_longitude=Decimal("127.028"),
        status=SessionStatus.ACTIVE,
    )
    db_session.add(session)
    db_session.commit()
    
    response = client.get(f"/api/v1/sessions/{session_id}")
    assert response.status_code == 200
    data = response.json()
    assert str(data["id"]) == str(session_id)
    assert data["status"] == "active"


def test_list_sessions(client, db_session, test_user_id):
    """세션 목록 조회 테스트"""
    # 테스트 사용자 생성
    test_user = User(id=test_user_id, email="test@arway.com", name="Test User")
    db_session.add(test_user)
    
    # 테스트 목적지 생성
    dest_id = uuid4()
    destination = Destination(
        id=dest_id,
        name="테스트 목적지",
        latitude=Decimal("37.511"),
        longitude=Decimal("127.029"),
        created_by=test_user_id,
        is_active=True
    )
    db_session.add(destination)
    
    # 테스트 세션 생성
    session = NavigationSession(
        id=uuid4(),
        user_id=test_user_id,
        destination_id=dest_id,
        start_latitude=Decimal("37.510"),
        start_longitude=Decimal("127.028"),
        status=SessionStatus.ACTIVE,
    )
    db_session.add(session)
    db_session.commit()
    
    response = client.get("/api/v1/sessions/?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_update_session(client, db_session, test_user_id):
    """세션 업데이트 테스트"""
    # 테스트 사용자 생성
    test_user = User(id=test_user_id, email="test@arway.com", name="Test User")
    db_session.add(test_user)
    
    # 테스트 목적지 생성
    dest_id = uuid4()
    destination = Destination(
        id=dest_id,
        name="테스트 목적지",
        latitude=Decimal("37.511"),
        longitude=Decimal("127.029"),
        created_by=test_user_id,
        is_active=True
    )
    db_session.add(destination)
    
    # 테스트 세션 생성
    session_id = uuid4()
    session = NavigationSession(
        id=session_id,
        user_id=test_user_id,
        destination_id=dest_id,
        start_latitude=Decimal("37.510"),
        start_longitude=Decimal("127.028"),
        status=SessionStatus.ACTIVE,
    )
    db_session.add(session)
    db_session.commit()
    
    # 세션 완료 처리
    response = client.patch(
        f"/api/v1/sessions/{session_id}",
        json={
            "status": "completed",
            "end_latitude": 37.511,
            "end_longitude": 127.029,
            "total_distance": 100.5,
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["total_distance"] == 100.5

