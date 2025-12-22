# 테스트 가이드

## 백엔드 테스트

### 환경 설정

```bash
cd backend
pip install -r requirements.txt
```

### 테스트 실행

```bash
# 모든 테스트 실행
pytest tests/ -v

# 특정 테스트 파일 실행
pytest tests/test_destinations.py -v

# 커버리지 리포트 생성
pytest tests/ --cov=app --cov-report=html
```

### 테스트 구조

- `tests/conftest.py`: 공통 픽스처 및 설정
- `tests/test_destinations.py`: 목적지 API 테스트
- `tests/test_sessions.py`: 세션 API 테스트
- `tests/test_analytics.py`: 분석 API 테스트

### 테스트 예시

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
```

## 프론트엔드 테스트

### 환경 설정

```bash
cd frontend
npm install
```

### 테스트 실행

```bash
# 모든 테스트 실행
npm test

# Watch 모드로 실행
npm run test:watch
```

### 테스트 구조

- `__tests__/ar-nav/page.test.tsx`: 시작 화면 테스트

## 통합 테스트

### 수동 테스트 체크리스트

#### 1. 시작 화면
- [ ] 시작 화면이 정상적으로 표시됨
- [ ] "도보 AR 네비 시작" 버튼 클릭 시 목적지 선택 화면으로 이동

#### 2. 목적지 선택 화면
- [ ] 목적지 목록이 정상적으로 표시됨
- [ ] 목적지 선택 시 AR 네비 화면으로 이동

#### 3. AR 네비 화면
- [ ] GPS 위치 추적이 정상 작동
- [ ] 방향 화살표가 정상적으로 회전
- [ ] 거리 정보가 정상적으로 표시됨
- [ ] 상태 텍스트가 정상적으로 업데이트됨

#### 4. 도착 화면
- [ ] 도착 메시지가 정상적으로 표시됨
- [ ] 피드백 제출이 정상 작동
- [ ] 재시작 버튼이 정상 작동

#### 5. Admin 대시보드
- [ ] 통계 데이터가 정상적으로 표시됨
- [ ] 세션 목록이 정상적으로 표시됨
- [ ] 목적지 관리 기능이 정상 작동

## API 테스트

### Swagger UI 사용

1. 백엔드 서버 실행: `cd backend && uvicorn app.main:app --reload`
2. 브라우저에서 http://localhost:8000/docs 접속
3. 각 API 엔드포인트를 직접 테스트

### cURL 예시

```bash
# 목적지 목록 조회
curl http://localhost:8000/api/v1/destinations/

# 세션 생성
curl -X POST http://localhost:8000/api/v1/sessions/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "00000000-0000-0000-0000-000000000000",
    "destination_id": "목적지-ID",
    "start_latitude": 37.510,
    "start_longitude": 127.028
  }'
```

## 성능 테스트

### 백엔드 성능

- API 응답 시간: <200ms 목표
- 동시 요청 처리: 100+ 요청/초 목표

### 프론트엔드 성능

- 화면 렌더링: 30fps 이상 목표
- GPS 업데이트 주기: 1초 간격
- 메모리 사용량: <100MB 목표

## 문제 해결

### 테스트 실행 오류

1. **데이터베이스 연결 오류**
   - 백엔드 테스트는 인메모리 SQLite 사용
   - 실제 PostgreSQL 연결 불필요

2. **모듈 import 오류**
   - 가상환경이 활성화되었는지 확인
   - `pip install -r requirements.txt` 실행 확인

3. **테스트 실패**
   - 테스트 로그 확인
   - 데이터베이스 상태 확인
   - API 서버 실행 상태 확인

