"""
목적지 API 테스트
"""
import pytest
from uuid import uuid4
from app.models.user import User
from app.models.destination import Destination
from decimal import Decimal


def test_create_destination(client, db_session, test_user_id):
    """목적지 생성 테스트"""
    # 테스트 사용자 생성
    test_user = User(id=test_user_id, email="test@arway.com", name="Test User")
    db_session.add(test_user)
    db_session.commit()
    
    response = client.post(
        "/api/v1/destinations/",
        json={
            "name": "테스트 목적지",
            "description": "테스트용 목적지입니다",
            "latitude": 37.511,
            "longitude": 127.029,
            "address": "서울시 강남구",
            "created_by": test_user_id,
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "테스트 목적지"
    assert data["latitude"] == 37.511
    assert data["longitude"] == 127.029


def test_get_destinations(client, db_session, test_user_id):
    """목적지 목록 조회 테스트"""
    # 테스트 사용자 생성
    test_user = User(id=test_user_id, email="test@arway.com", name="Test User")
    db_session.add(test_user)
    
    # 테스트 목적지 생성
    destination = Destination(
        id=uuid4(),
        name="테스트 목적지 1",
        latitude=Decimal("37.511"),
        longitude=Decimal("127.029"),
        created_by=test_user_id,
        is_active=True
    )
    db_session.add(destination)
    db_session.commit()
    
    response = client.get("/api/v1/destinations/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["name"] == "테스트 목적지 1"


def test_get_destination_by_id(client, db_session, test_user_id):
    """목적지 상세 조회 테스트"""
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
    
    response = client.get(f"/api/v1/destinations/{dest_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "테스트 목적지"
    assert str(data["id"]) == str(dest_id)


def test_update_destination(client, db_session, test_user_id):
    """목적지 수정 테스트"""
    # 테스트 사용자 생성
    test_user = User(id=test_user_id, email="test@arway.com", name="Test User")
    db_session.add(test_user)
    
    # 테스트 목적지 생성
    dest_id = uuid4()
    destination = Destination(
        id=dest_id,
        name="원래 이름",
        latitude=Decimal("37.511"),
        longitude=Decimal("127.029"),
        created_by=test_user_id,
        is_active=True
    )
    db_session.add(destination)
    db_session.commit()
    
    # 목적지 수정
    response = client.put(
        f"/api/v1/destinations/{dest_id}",
        json={
            "name": "수정된 이름",
            "description": "수정된 설명",
            "latitude": 37.512,
            "longitude": 127.030,
            "address": "수정된 주소",
            "is_active": True,
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "수정된 이름"
    assert data["latitude"] == 37.512


def test_search_destinations(client, db_session, test_user_id):
    """목적지 검색 테스트"""
    # 테스트 사용자 생성
    test_user = User(id=test_user_id, email="test@arway.com", name="Test User")
    db_session.add(test_user)
    
    # 여러 테스트 목적지 생성
    destination1 = Destination(
        id=uuid4(),
        name="강남역",
        description="서울시 강남구 강남역",
        address="서울시 강남구 강남대로",
        latitude=Decimal("37.4979"),
        longitude=Decimal("127.0276"),
        created_by=test_user_id,
        is_active=True
    )
    destination2 = Destination(
        id=uuid4(),
        name="홍대입구역",
        description="서울시 마포구 홍대입구역",
        address="서울시 마포구 양화로",
        latitude=Decimal("37.5563"),
        longitude=Decimal("126.9234"),
        created_by=test_user_id,
        is_active=True
    )
    destination3 = Destination(
        id=uuid4(),
        name="명동",
        description="서울시 중구 명동",
        address="서울시 중구 명동길",
        latitude=Decimal("37.5636"),
        longitude=Decimal("126.9826"),
        created_by=test_user_id,
        is_active=True
    )
    
    db_session.add_all([destination1, destination2, destination3])
    db_session.commit()
    
    # 이름으로 검색
    response = client.get("/api/v1/destinations/?search=강남")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "강남역"
    
    # 주소로 검색
    response = client.get("/api/v1/destinations/?search=마포구")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "홍대입구역"
    
    # 설명으로 검색
    response = client.get("/api/v1/destinations/?search=중구")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "명동"
    
    # 검색 결과 없음
    response = client.get("/api/v1/destinations/?search=부산")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0
    
    # 검색어 없이 전체 조회
    response = client.get("/api/v1/destinations/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
