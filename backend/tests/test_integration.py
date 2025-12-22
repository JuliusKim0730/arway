"""
통합 테스트: 전체 플로우 테스트
"""
import pytest
from uuid import uuid4
from decimal import Decimal
from app.models.user import User
from app.models.destination import Destination
from app.models.navigation_session import NavigationSession, SessionStatus
from app.models.navigation_point import NavigationPoint
from app.models.feedback import Feedback


def test_full_navigation_flow(client, db_session):
    """전체 네비게이션 플로우 테스트"""
    # 1. 사용자 생성
    user_response = client.post(
        "/api/v1/users/",
        json={
            "email": "integration@arway.com",
            "name": "Integration Test User"
        }
    )
    assert user_response.status_code == 200
    user_data = user_response.json()
    user_id = user_data["id"]
    
    # 2. 목적지 생성
    dest_response = client.post(
        "/api/v1/destinations/",
        json={
            "name": "통합 테스트 목적지",
            "description": "통합 테스트용",
            "latitude": 37.511,
            "longitude": 127.029,
            "address": "서울시 강남구",
            "created_by": user_id,
        }
    )
    assert dest_response.status_code == 200
    dest_data = dest_response.json()
    dest_id = dest_data["id"]
    
    # 3. 네비게이션 세션 생성
    session_response = client.post(
        "/api/v1/sessions/",
        json={
            "user_id": user_id,
            "destination_id": dest_id,
            "start_latitude": 37.510,
            "start_longitude": 127.028,
        }
    )
    assert session_response.status_code == 200
    session_data = session_response.json()
    session_id = session_data["id"]
    assert session_data["status"] == "active"
    
    # 4. 네비게이션 포인트 저장
    point_response = client.post(
        "/api/v1/navigation-points/",
        json={
            "session_id": session_id,
            "latitude": 37.5105,
            "longitude": 127.0285,
            "heading": 45.0,
            "accuracy": 10.0,
            "distance_to_target": 100.5,
            "bearing": 90.0,
            "relative_angle": 45.0,
        }
    )
    assert point_response.status_code == 200
    point_data = point_response.json()
    assert point_data["session_id"] == session_id
    
    # 5. 분석 이벤트 생성
    analytics_response = client.post(
        "/api/v1/analytics/",
        json={
            "session_id": session_id,
            "event_type": "navigation_point_saved",
            "event_data": {
                "distance": 100.5,
                "heading": 45.0
            }
        }
    )
    assert analytics_response.status_code == 200
    analytics_data = analytics_response.json()
    assert analytics_data["event_type"] == "navigation_point_saved"
    
    # 6. 세션 완료 처리
    update_response = client.patch(
        f"/api/v1/sessions/{session_id}",
        json={
            "status": "completed",
            "end_latitude": 37.511,
            "end_longitude": 127.029,
            "total_distance": 100.5,
        }
    )
    assert update_response.status_code == 200
    updated_session = update_response.json()
    assert updated_session["status"] == "completed"
    
    # 7. 피드백 제출
    feedback_response = client.post(
        "/api/v1/feedback/",
        json={
            "session_id": session_id,
            "user_id": user_id,
            "rating": 5,
            "comment": "통합 테스트 피드백"
        }
    )
    assert feedback_response.status_code == 200
    feedback_data = feedback_response.json()
    assert feedback_data["rating"] == 5
    assert feedback_data["comment"] == "통합 테스트 피드백"
    
    # 8. 세션 조회하여 모든 데이터 확인
    final_session = client.get(f"/api/v1/sessions/{session_id}")
    assert final_session.status_code == 200
    final_data = final_session.json()
    assert final_data["status"] == "completed"
    assert final_data["total_distance"] == 100.5


def test_user_session_relationship(client, db_session):
    """사용자-세션 관계 테스트"""
    # 사용자 생성
    user_response = client.post(
        "/api/v1/users/",
        json={
            "email": "relationship@arway.com",
            "name": "Relationship Test"
        }
    )
    user_id = user_response.json()["id"]
    
    # 목적지 생성
    dest_response = client.post(
        "/api/v1/destinations/",
        json={
            "name": "관계 테스트 목적지",
            "latitude": 37.511,
            "longitude": 127.029,
            "created_by": user_id,
        }
    )
    dest_id = dest_response.json()["id"]
    
    # 세션 생성
    session_response = client.post(
        "/api/v1/sessions/",
        json={
            "user_id": user_id,
            "destination_id": dest_id,
            "start_latitude": 37.510,
            "start_longitude": 127.028,
        }
    )
    session_id = session_response.json()["id"]
    
    # 세션 조회하여 사용자 ID 확인
    session = client.get(f"/api/v1/sessions/{session_id}")
    assert session.json()["user_id"] == user_id
    assert session.json()["destination_id"] == dest_id

