---
title: "ARWay Lite PRD - 상세 제품 요구사항"
type: "implementation"
tags: ["prd", "product", "requirements", "poc"]
dependencies: ["nextjs", "react", "typescript", "postgresql", "fastapi"]
---

# ARWay Lite - Product Requirements Document

## 1. 프로젝트 개요

### 1.1 제품명
**ARWay Lite** - SCQ 기반 AR 도보 네비게이션 MVP

### 1.2 버전
- Version: 0.1.0 (MVP PoC)
- 배포 환경: 로컬 웹 (localhost)

### 1.3 목적
현실 카메라 영상 위에 AR 방향 화살표와 거리 정보를 표시하여, 지도를 열지 않고도 직감적인 방향 안내를 제공하는 PoC 구현

## 2. 시스템 아키텍처

### 2.1 전체 구조
```
┌─────────────────────────────────────────┐
│         Frontend (Next.js)              │
│  - 사용자 UI (모바일 웹)                 │
│  - Admin 관리자 화면                     │
└──────────────┬──────────────────────────┘
               │ HTTP/REST API
┌──────────────▼──────────────────────────┐
│      Backend API (FastAPI)              │
│  - RESTful API 서버                     │
│  - 비즈니스 로직                        │
└──────────────┬──────────────────────────┘
               │ SQL
┌──────────────▼──────────────────────────┐
│    Database (PostgreSQL)                │
│  - 로컬 PostgreSQL 인스턴스              │
└─────────────────────────────────────────┘
```

### 2.2 기술 스택

#### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: React Context / Zustand
- **AR 라이브러리**: geolib, DeviceOrientation API

#### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **ORM**: SQLAlchemy
- **Database**: PostgreSQL 15+
- **Migration**: Alembic

#### Infrastructure
- **Database**: PostgreSQL (Docker 또는 로컬 설치)
- **Development**: Docker Compose (선택사항)

## 3. 기능 요구사항

### 3.1 사용자 기능 (Frontend)

#### FR-001: 시작 화면
- 서비스 소개 및 시작 버튼
- 권한 안내 문구
- 라우팅: `/ar-nav`

#### FR-002: 목적지 선택 화면
- 목적지 목록 표시
- 목적지 카드 선택
- 라우팅: `/ar-nav/select`

#### FR-003: AR 네비게이션 실행 화면 (핵심)
- 카메라 프리뷰 표시
- GPS 위치 추적
- 방향 화살표 표시 및 회전
- 거리 표시 (HUD)
- 상태 텍스트 표시
- 라우팅: `/ar-nav/run`

#### FR-004: 도착 화면
- 도착 완료 메시지
- 피드백 수집 (만족도)
- 재시작 옵션
- 라우팅: `/ar-nav/arrived`

### 3.2 관리자 기능 (Admin)

#### FR-005: 관리자 대시보드
- 전체 세션 통계
- 사용자 활동 모니터링
- 목적지 관리
- 라우팅: `/admin`

#### FR-006: 목적지 관리
- 목적지 CRUD 작업
- 좌표 설정 및 검증
- 활성화/비활성화

#### FR-007: 세션 분석
- 세션 히스토리 조회
- GPS 추적 경로 시각화
- 피드백 분석

### 3.3 백엔드 API 기능

#### FR-008: 사용자 API
- 사용자 등록/조회
- 인증 (JWT 또는 세션)

#### FR-009: 목적지 API
- 목적지 목록 조회
- 목적지 상세 조회
- 목적지 생성/수정/삭제 (Admin)

#### FR-010: 네비게이션 세션 API
- 세션 생성
- 세션 상태 업데이트
- 세션 종료
- 세션 히스토리 조회

#### FR-011: GPS 포인트 API
- GPS 포인트 저장
- 세션별 포인트 조회
- 실시간 위치 업데이트 (WebSocket, 향후)

#### FR-012: 피드백 API
- 피드백 저장
- 피드백 조회 (Admin)

#### FR-013: 분석 API
- 이벤트 로깅
- 통계 데이터 조회

## 4. 비기능 요구사항

### 4.1 성능
- 화면 렌더링: 30fps 이상 유지
- API 응답 시간: <200ms
- GPS 업데이트 주기: 1초

### 4.2 보안
- HTTPS (로컬 개발 시 HTTP 허용)
- 사용자 인증 (세션 기반)
- SQL Injection 방지 (ORM 사용)

### 4.3 호환성
- 모바일 웹 브라우저 (iOS Safari, Chrome Android)
- 데스크톱 브라우저 (Chrome, Firefox, Safari)

### 4.4 데이터
- 로컬 데이터베이스 백업
- 마이그레이션 롤백 지원

## 5. 데이터베이스 요구사항

### 5.1 엔티티
- Users (사용자)
- Destinations (목적지)
- Navigation Sessions (네비게이션 세션)
- Navigation Points (GPS 추적 포인트)
- Feedback (피드백)
- Analytics Events (분석 이벤트)

자세한 ERD는 `00_프로젝트_ERD.md` 참조

## 6. API 명세

### 6.1 엔드포인트 구조
```
/api/v1/
  ├── /users
  ├── /destinations
  ├── /sessions
  ├── /navigation-points
  ├── /feedback
  └── /analytics
```

자세한 API 명세는 `api.md` 참조

## 7. 배포 및 운영

### 7.1 로컬 개발 환경
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Database: `localhost:5432`
- Admin: `http://localhost:3000/admin`

### 7.2 실행 순서
1. PostgreSQL 데이터베이스 시작
2. 데이터베이스 마이그레이션 실행
3. Backend API 서버 시작
4. Frontend 개발 서버 시작

## 8. 성공 기준

### 8.1 기능적 성공
- 모든 화면 정상 동작
- GPS 추적 정확도 ±10m 이내
- 방향 오차 ±15° 이내
- 거리 계산 오차 <10%

### 8.2 기술적 성공
- 화면 FPS 30fps 이상 유지
- API 응답 시간 <200ms
- 데이터베이스 쿼리 최적화

### 8.3 사용자 경험 성공
- 직관적인 UI/UX
- 부드러운 AR 화살표 회전
- 명확한 피드백 제공

## 9. 향후 확장 계획

### Phase 2
- SCQ 모델 통합
- 실시간 경로 최적화
- 음성 안내

### Phase 3
- Google Maps 연동
- 턴바이턴 네비게이션
- 자동차 모드

### Phase 4
- AR 글라스 지원
- WebXR 통합
- 네이티브 앱 개발

