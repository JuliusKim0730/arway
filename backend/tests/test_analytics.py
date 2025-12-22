"""
분석 API 테스트
"""
import pytest
from uuid import uuid4
from app.models.user import User
from app.models.destination import Destination
from app.models.navigation_session import NavigationSession, SessionStatus
from app.models.feedback import Feedback
from decimal import Decimal


def test_get_stats(client, db_session, test_user_id):
    """통계 조회 테스트"""
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
    session1 = NavigationSession(
        id=uuid4(),
        user_id=test_user_id,
        destination_id=dest_id,
        status=SessionStatus.ACTIVE,
    )
    session2 = NavigationSession(
        id=uuid4(),
        user_id=test_user_id,
        destination_id=dest_id,
        status=SessionStatus.COMPLETED,
    )
    db_session.add(session1)
    db_session.add(session2)
    
    # 테스트 피드백 생성
    feedback = Feedback(
        id=uuid4(),
        session_id=session2.id,
        user_id=test_user_id,
        rating=5,
    )
    db_session.add(feedback)
    db_session.commit()
    
    response = client.get("/api/v1/analytics/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["totalSessions"] == 2
    assert data["activeSessions"] == 1
    assert data["completedSessions"] == 1
    assert data["averageRating"] == 5.0

