# 의존성 및 API 체크리스트

## 백엔드 의존성

### 필수 패키지
- ✅ fastapi - FastAPI 웹 프레임워크
- ✅ uvicorn - ASGI 서버
- ✅ sqlalchemy - ORM
- ✅ psycopg2-binary - PostgreSQL 드라이버
- ✅ alembic - 데이터베이스 마이그레이션
- ✅ python-dotenv - 환경 변수 관리
- ✅ pydantic - 데이터 검증
- ✅ pydantic-settings - 설정 관리
- ✅ pytest - 테스트 프레임워크
- ✅ pytest-asyncio - 비동기 테스트
- ✅ httpx - HTTP 클라이언트 (테스트용)

## 프론트엔드 의존성

### 필수 패키지
- ✅ next - Next.js 프레임워크
- ✅ react - React 라이브러리
- ✅ react-dom - React DOM
- ✅ geolib - 지리 계산 라이브러리 (거리, 방위각 계산)
- ✅ zustand - 상태 관리
- ✅ axios - HTTP 클라이언트

### 개발 의존성
- ✅ typescript - TypeScript 컴파일러
- ✅ tailwindcss - CSS 프레임워크
- ✅ postcss - CSS 후처리기
- ✅ autoprefixer - CSS 자동 접두사
- ✅ eslint - 코드 린터
- ✅ @testing-library/react - React 테스트 라이브러리
- ✅ @testing-library/jest-dom - Jest DOM 매처
- ✅ jest - 테스트 프레임워크
- ✅ jest-environment-jsdom - Jest DOM 환경

## Admin 의존성

### 필수 패키지
- ✅ next - Next.js 프레임워크
- ✅ react - React 라이브러리
- ✅ react-dom - React DOM
- ✅ axios - HTTP 클라이언트
- ✅ recharts - 차트 라이브러리

## 브라우저 API

### 필수 API
- ✅ **Geolocation API** (`navigator.geolocation`)
  - `getCurrentPosition()` - 현재 위치 조회
  - `watchPosition()` - 위치 실시간 추적
  - 권한: 위치 권한 필요

- ✅ **DeviceOrientation API** (`window.DeviceOrientationEvent`)
  - `deviceorientation` 이벤트 - 디바이스 방향 감지
  - `alpha` 값 - 나침반 방향 (0-360도)
  - 권한: iOS 13+ 에서 권한 요청 필요

- ✅ **MediaDevices API** (`navigator.mediaDevices`)
  - `getUserMedia()` - 카메라/마이크 접근
  - `facingMode: 'environment'` - 후면 카메라
  - 권한: 카메라 권한 필요

### 권장 사항
- HTTPS 또는 localhost에서 실행 (브라우저 보안 정책)
- 모바일 디바이스에서 테스트 권장

## 설치 및 확인 스크립트

### 백엔드 설치
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 프론트엔드 설치
```bash
cd frontend
npm install
```

### Admin 설치
```bash
cd admin
npm install
```

## API 연동 확인

### 1. Geolocation API
- ✅ `useGeolocationWatcher.ts`에서 구현됨
- 브라우저 지원 확인 필요
- 위치 권한 요청 처리 필요

### 2. DeviceOrientation API
- ✅ `useHeading.ts`에서 구현됨
- iOS 13+ 권한 요청 처리됨
- Fallback 로직 필요 (GPS 방향 계산)

### 3. MediaDevices API
- ✅ `app/ar-nav/run/page.tsx`에서 구현됨
- 카메라 권한 요청 처리됨
- 카메라 없이도 동작 가능하도록 처리됨

### 4. Backend API
- ✅ `lib/api.ts`에서 구현됨
- axios를 사용한 HTTP 클라이언트
- 환경 변수로 API URL 설정

## 환경 변수 설정

### Backend (.env)
```
DATABASE_URL=postgresql://arway_user:password@localhost:5432/arway_lite
SECRET_KEY=your-secret-key-here
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Admin (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 브라우저 호환성

### Geolocation API
- ✅ Chrome/Edge: 지원
- ✅ Firefox: 지원
- ✅ Safari: 지원 (iOS 13+)
- ⚠️ 권한 요청 필요

### DeviceOrientation API
- ✅ Chrome/Edge: 지원
- ✅ Firefox: 지원
- ⚠️ Safari iOS 13+: 권한 요청 필요
- ⚠️ 일부 Android: 지원 제한적

### MediaDevices API
- ✅ Chrome/Edge: 지원
- ✅ Firefox: 지원
- ✅ Safari: 지원 (iOS 11+)
- ⚠️ HTTPS 또는 localhost 필요

## 다음 단계

1. 의존성 설치 확인
2. 환경 변수 설정 확인
3. 브라우저 API 권한 테스트
4. 통합 테스트 실행

