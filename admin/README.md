# ARWay Lite Admin

ARWay Lite 관리자 대시보드입니다.

## 기능

- 📊 통계 대시보드
- 📋 세션 관리 및 모니터링
- 🎯 목적지 관리 (CRUD)
- 📈 사용자 활동 분석

## 시작하기

### 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3001 접속

### 환경 변수

`.env.local` 파일 생성:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 프로젝트 구조

```
admin/
├── app/              # Next.js App Router
│   ├── page.tsx     # 메인 대시보드
│   └── layout.tsx   # 루트 레이아웃
├── components/       # React 컴포넌트
│   ├── StatsCard.tsx
│   ├── SessionsTable.tsx
│   └── DestinationsList.tsx
└── lib/             # 유틸리티 및 API 클라이언트
    └── api.ts
```

## API 엔드포인트

Admin 대시보드는 다음 백엔드 API를 사용합니다:

- `GET /api/v1/analytics/stats` - 통계 데이터
- `GET /api/v1/sessions/` - 세션 목록
- `GET /api/v1/destinations/` - 목적지 목록
- `POST /api/v1/destinations/` - 목적지 생성
- `PUT /api/v1/destinations/{id}` - 목적지 수정
- `DELETE /api/v1/destinations/{id}` - 목적지 삭제

## 기술 스택

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Recharts (차트 라이브러리)

