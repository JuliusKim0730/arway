---
title: "ARWay Lite ERD - 데이터베이스 설계"
type: "implementation"
tags: ["database", "erd", "schema", "postgresql"]
dependencies: ["sqlalchemy", "postgresql", "alembic"]
---

# ARWay Lite - Entity Relationship Diagram

## 데이터베이스 개요

로컬 PostgreSQL 데이터베이스를 사용한 MVP PoC 환경

## 엔티티 관계도

### 1. Users (사용자)
```
users
├── id (UUID, PK)
├── email (VARCHAR, UNIQUE)
├── name (VARCHAR)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### 2. Destinations (목적지)
```
destinations
├── id (UUID, PK)
├── name (VARCHAR)
├── description (TEXT)
├── latitude (DECIMAL)
├── longitude (DECIMAL)
├── address (VARCHAR)
├── is_active (BOOLEAN)
├── created_by (UUID, FK -> users.id)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### 3. Navigation Sessions (네비게이션 세션)
```
navigation_sessions
├── id (UUID, PK)
├── user_id (UUID, FK -> users.id)
├── destination_id (UUID, FK -> destinations.id)
├── start_latitude (DECIMAL)
├── start_longitude (DECIMAL)
├── end_latitude (DECIMAL)
├── end_longitude (DECIMAL)
├── status (ENUM: 'active', 'completed', 'cancelled')
├── started_at (TIMESTAMP)
├── completed_at (TIMESTAMP)
└── total_distance (DECIMAL)
```

### 4. Navigation Points (네비게이션 포인트 - GPS 추적)
```
navigation_points
├── id (UUID, PK)
├── session_id (UUID, FK -> navigation_sessions.id)
├── latitude (DECIMAL)
├── longitude (DECIMAL)
├── heading (DECIMAL)
├── accuracy (DECIMAL)
├── distance_to_target (DECIMAL)
├── bearing (DECIMAL)
├── relative_angle (DECIMAL)
├── recorded_at (TIMESTAMP)
└── INDEX (session_id, recorded_at)
```

### 5. Feedback (피드백)
```
feedback
├── id (UUID, PK)
├── session_id (UUID, FK -> navigation_sessions.id)
├── user_id (UUID, FK -> users.id)
├── rating (INTEGER, 1-5)
├── comment (TEXT)
├── created_at (TIMESTAMP)
└── INDEX (session_id)
```

### 6. Analytics Events (분석 이벤트)
```
analytics_events
├── id (UUID, PK)
├── session_id (UUID, FK -> navigation_sessions.id)
├── event_type (VARCHAR: 'arrive', 'heading_update', 'distance_update')
├── event_data (JSONB)
├── recorded_at (TIMESTAMP)
└── INDEX (session_id, event_type, recorded_at)
```

## 관계도

```
users (1) ──< (N) navigation_sessions
users (1) ──< (N) feedback
users (1) ──< (N) destinations

destinations (1) ──< (N) navigation_sessions

navigation_sessions (1) ──< (N) navigation_points
navigation_sessions (1) ──< (N) feedback
navigation_sessions (1) ──< (N) analytics_events
```

## 인덱스 전략

1. **navigation_points**: session_id + recorded_at (복합 인덱스)
2. **analytics_events**: session_id + event_type + recorded_at (복합 인덱스)
3. **navigation_sessions**: user_id + status (복합 인덱스)
4. **destinations**: latitude + longitude (지리적 검색용)

## 데이터베이스 설정

### 로컬 PostgreSQL 설정
- Host: localhost
- Port: 5432
- Database: arway_lite
- User: arway_user
- Password: (로컬 개발용)

### 마이그레이션 도구
- Alembic 사용
- 초기 마이그레이션 파일 포함

## 확장 계획

향후 추가 예정:
- 실시간 위치 공유 (WebSocket)
- 경로 히스토리 분석
- 사용자 선호도 학습

