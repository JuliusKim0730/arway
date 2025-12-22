"""
사용자 API 테스트
"""
import pytest
from uuid import uuid4
from app.models.user import User


def test_create_user(client, db_session):
    """사용자 생성 테스트"""
    response = client.post(
        "/api/v1/users/",
        json={
            "email": "newuser@arway.com",
            "name": "New User"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@arway.com"
    assert data["name"] == "New User"
    assert "id" in data


def test_create_duplicate_user(client, db_session):
    """중복 사용자 생성 테스트 (이메일 기준)"""
    # 첫 번째 사용자 생성
    test_user = User(
        id=uuid4(),
        email="duplicate@arway.com",
        name="First User"
    )
    db_session.add(test_user)
    db_session.commit()
    
    # 같은 이메일로 다시 생성 시도 (기존 사용자 반환)
    response = client.post(
        "/api/v1/users/",
        json={
            "email": "duplicate@arway.com",
            "name": "Second User"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "duplicate@arway.com"
    assert data["name"] == "First User"  # 기존 이름 유지


def test_get_user(client, db_session):
    """사용자 조회 테스트"""
    # 테스트 사용자 생성
    user_id = uuid4()
    test_user = User(
        id=user_id,
        email="getuser@arway.com",
        name="Get User"
    )
    db_session.add(test_user)
    db_session.commit()
    
    response = client.get(f"/api/v1/users/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "getuser@arway.com"
    assert str(data["id"]) == str(user_id)


def test_get_nonexistent_user(client, db_session):
    """존재하지 않는 사용자 조회 테스트"""
    fake_id = uuid4()
    response = client.get(f"/api/v1/users/{fake_id}")
    assert response.status_code == 404

