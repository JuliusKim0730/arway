# AR 네비게이션 시스템

GPS 위치 감지 후 한국이면 TMAP API, 해외면 Google Maps API를 자동으로 선택하는 AR 네비게이션 시스템입니다.

## 🌟 주요 기능

- **자동 지역 감지**: GPS 좌표로 한국/해외 자동 판별
- **API 자동 선택**: 
  - 🇰🇷 한국: TMAP API (정확한 도보 경로)
  - 🌍 해외: Google Maps API (전 세계 지원)
- **동적 API 로딩**: 필요할 때만 Google Maps API 로드
- **실시간 위치 추적**: 고정밀 GPS 필터링
- **AR 호환**: Three.js/WebXR과 연동 가능한 좌표 포맷

## 📁 파일 구조

```
frontend/
├── services/
│   └── ARNavigationManager.ts     # 핵심 네비게이션 매니저
├── hooks/
│   ├── useGeolocationWatcher.ts   # GPS 위치 추적 훅
│   └── useARNavigation.ts         # AR 네비게이션 훅
├── components/
│   └── ARNavigationComponent.tsx  # 네비게이션 UI 컴포넌트
├── pages/
│   └── ARNavigationDemo.tsx       # 데모 페이지
└── utils/
    └── googleMapsLoader.ts        # Google Maps 동적 로더
```

## 🚀 빠른 시작

### 1. API 키 설정

`.env.local` 파일에 API 키를 설정하세요:

```env
# TMAP API 키 (한국 내 네비게이션용)
REACT_APP_TMAP_API_KEY=your_tmap_api_key_here

# Google Maps API 키 (해외 네비게이션용)
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 2. API 키 발급

#### TMAP API (한국용)
1. [TMAP 개발자 센터](https://tmapapi.sktelecom.com/) 접속
2. 회원가입 및 앱 등록
3. 도보 경로 API 신청
4. 발급받은 API 키를 `.env.local`에 설정

#### Google Maps API (해외용)
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 및 Maps JavaScript API 활성화
3. Directions API 활성화
4. API 키 생성 및 `.env.local`에 설정

### 3. 기본 사용법

```tsx
import React from 'react';
import { ARNavigationComponent } from './components/ARNavigationComponent';

function App() {
  const destination = {
    lat: 37.5665, // 서울시청
    lng: 126.9780
  };

  const handleRouteFound = (route) => {
    console.log('경로 찾기 완료:', route);
    // AR 엔진에 경로 데이터 전달
  };

  return (
    <ARNavigationComponent
      destination={destination}
      onRouteFound={handleRouteFound}
    />
  );
}
```

### 4. 고급 사용법

```tsx
import { useARNavigation } from './hooks/useARNavigation';

function CustomNavigationComponent() {
  const {
    currentLocation,
    route,
    isLoading,
    error,
    currentService,
    isKorea,
    searchRoute,
    formatDistance,
    formatDuration
  } = useARNavigation();

  const handleSearch = async () => {
    const destination = { lat: 37.5665, lng: 126.9780 };
    await searchRoute(destination);
  };

  return (
    <div>
      <p>현재 서비스: {currentService}</p>
      <p>위치: {isKorea ? '한국' : '해외'}</p>
      {route && (
        <div>
          <p>거리: {formatDistance(route.distance)}</p>
          <p>시간: {formatDuration(route.duration)}</p>
        </div>
      )}
      <button onClick={handleSearch}>경로 찾기</button>
    </div>
  );
}
```

## 🔧 API 참조

### ARNavigationManager

핵심 네비게이션 매니저 클래스입니다.

```typescript
class ARNavigationManager {
  // 위치가 한국인지 확인
  checkIsKorea(lat: number, lng: number): boolean

  // 경로 검색 (자동 API 선택)
  async getDirections(origin: Location, destination: Location): Promise<NavigationRoute | null>

  // 현재 사용 중인 서비스 확인
  getCurrentService(): 'TMAP' | 'Google Maps'

  // API 키 설정
  setTmapApiKey(apiKey: string): void
}
```

### useARNavigation Hook

React 컴포넌트에서 사용하는 훅입니다.

```typescript
const {
  currentLocation,      // 현재 GPS 위치
  route,               // 검색된 경로 정보
  isLoading,           // 로딩 상태
  error,               // 에러 메시지
  currentService,      // 현재 사용 중인 API 서비스
  isKorea,            // 한국 위치 여부
  searchRoute,        // 경로 검색 함수
  clearRoute,         // 경로 초기화
  formatDistance,     // 거리 포맷팅
  formatDuration      // 시간 포맷팅
} = useARNavigation();
```

### NavigationRoute 인터페이스

```typescript
interface NavigationRoute {
  path: Location[];        // 경로 좌표 배열
  distance: number;        // 총 거리 (미터)
  duration: number;        // 예상 시간 (초)
  instructions: string[];  // 경로 안내 텍스트
}
```

## 🌍 지역 감지 로직

한국 위치 판별은 다음 좌표 범위를 사용합니다:

```typescript
// 한국 본토 + 제주도
const koreaMainland = lat >= 33.0 && lat <= 38.9 && lng >= 124.5 && lng <= 131.9;

// 독도 포함
const dokdo = lat >= 37.2 && lat <= 37.3 && lng >= 131.8 && lng <= 131.9;
```

## 🔄 API 폴백 시스템

1. **한국 위치**: TMAP API 우선 사용
   - TMAP 실패 시 → Google Maps API로 자동 폴백
2. **해외 위치**: Google Maps API 사용
   - Google Maps API 동적 로딩
   - 로딩 실패 시 에러 처리

## 📱 AR 연동

경로 데이터는 AR 엔진(Three.js, WebXR 등)에서 바로 사용할 수 있는 형태로 제공됩니다:

```typescript
// 경로 좌표를 3D 공간에 표시
route.path.forEach((point, index) => {
  const position = convertGPSToWorldPosition(point.lat, point.lng);
  createWaypoint(position, index);
});
```

## 🐛 문제 해결

### 1. TMAP API 오류
- API 키가 올바른지 확인
- 도보 경로 API가 활성화되어 있는지 확인
- 일일 사용량 제한 확인

### 2. Google Maps API 오류
- API 키 권한 설정 확인
- Directions API가 활성화되어 있는지 확인
- 도메인 제한 설정 확인

### 3. GPS 위치 오류
- HTTPS 환경에서 실행 확인
- 브라우저 위치 권한 허용 확인
- 실외에서 테스트 (GPS 신호 개선)

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

문제가 있거나 질문이 있으시면 이슈를 생성해 주세요.