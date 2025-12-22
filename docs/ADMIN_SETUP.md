# Admin 프로젝트 설정 가이드

## 빠른 시작

### 1. 의존성 설치

```bash
cd admin
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일 생성 (또는 `.env.example` 복사):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3001 접속

## Docker를 사용한 실행

```bash
# 프로젝트 루트에서
docker-compose up admin
```

## 기능 확인

### 대시보드
- 통계 카드: 전체 세션, 활성 세션, 완료된 세션, 평균 평점
- 최근 세션 테이블: 세션 목록 및 상태 확인

### 목적지 관리
- 목적지 목록 조회
- 새 목적지 추가
- 목적지 활성/비활성 상태 확인

## 백엔드 API 요구사항

Admin 대시보드가 정상 작동하려면 다음 API 엔드포인트가 필요합니다:

1. **통계 API**: `GET /api/v1/analytics/stats`
   - 전체 세션 수
   - 활성 세션 수
   - 완료된 세션 수
   - 평균 평점

2. **세션 목록 API**: `GET /api/v1/sessions/?limit=10`
   - 최근 세션 목록 조회

3. **목적지 API**: 
   - `GET /api/v1/destinations/` - 목록 조회
   - `POST /api/v1/destinations/` - 생성
   - `PUT /api/v1/destinations/{id}` - 수정
   - `DELETE /api/v1/destinations/{id}` - 삭제

## 문제 해결

### API 연결 오류
- 백엔드 서버가 실행 중인지 확인 (http://localhost:8000)
- `.env.local`의 `NEXT_PUBLIC_API_URL` 확인
- CORS 설정 확인

### 데이터가 표시되지 않음
- 데이터베이스에 시드 데이터가 있는지 확인
- 백엔드 API 응답 확인 (브라우저 개발자 도구 Network 탭)

