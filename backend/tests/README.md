# 백엔드 테스트 가이드

## 개요

백엔드 API의 유닛 테스트 및 통합 테스트를 제공합니다.

## 테스트 실행

### 모든 테스트 실행
```bash
cd backend
pytest tests/
```

### 특정 테스트 파일 실행
```bash
pytest tests/test_destinations.py
```

### 상세 출력과 함께 실행
```bash
pytest tests/ -v
```

### 커버리지 리포트 생성
```bash
pytest tests/ --cov=app --cov-report=html
```

## 테스트 구조

- `conftest.py`: pytest 설정 및 공통 픽스처
- `test_destinations.py`: 목적지 API 테스트
- `test_sessions.py`: 세션 API 테스트
- `test_analytics.py`: 분석 API 테스트

## 테스트 데이터베이스

### 유닛 테스트
- 인메모리 SQLite 데이터베이스 사용
- 실제 PostgreSQL 연결 없이도 테스트 가능
- 각 테스트마다 새로운 데이터베이스 세션 생성

## 테스트 예시

```python
def test_create_destination(client, db_session, test_user_id):
    """목적지 생성 테스트"""
    response = client.post(
        "/api/v1/destinations/",
        json={
            "name": "테스트 목적지",
            "latitude": 37.511,
            "longitude": 127.029,
            "created_by": test_user_id,
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "테스트 목적지"
```

