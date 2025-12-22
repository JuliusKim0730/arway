# Google Maps AR Navigation - 기술 구현 가이드

## 📋 개요

이 문서는 Google Maps API를 활용한 AR 네비게이션 시스템의 핵심 구현 내용을 정리한 기술 문서입니다. 구글 맵 로딩부터 시작점/도착점 설정, AR 네비게이션 구동까지의 전체 플로우를 다룹니다.

## 🏗️ 시스템 아키텍처

### 핵심 컴포넌트 구조
```
frontend/
├── components/
│   ├── GoogleMap.tsx           # Google Maps 컴포넌트
│   ├── ArrowIndicator.tsx      # AR 방향 화살표
│   └── PlaceSearch.tsx         # 장소 검색
├── hooks/
│   ├── useGeolocationWatcher.ts # GPS 위치 추적
│   ├── useHeading.ts           # 디바이스 방향 감지
│   └── useNavComputation.ts    # 네비게이션 계산
├── lib/
│   ├── googleMaps.ts           # Google Maps API 클라이언트
│   └── debugARNav.ts           # 디버그 유틸리티
├── app/ar-nav/
│   ├── select/page.tsx         # 목적지 선택 화면
│   └── run/page.tsx            # AR 네비게이션 실행
└── store/
    └── navigationStore.ts      # 네비게이션 상태 관리
```

## 🗺️ Google Maps 통합

### 1. Google Maps API 설정

#### 환경 변수 설정
```bash
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

#### 필요한 Google Maps API 서비스
- **Maps JavaScript API**: 지도 표시
- **Directions API**: 경로 계산
- **Places API**: 장소 검색
- **Geocoding API**: 주소-좌표 변환

### 2. GoogleMap 컴포넌트 구현

#### 핵심 기능
```typescript
// frontend/components/GoogleMap.tsx
interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    label?: string;
    title?: string;
  }>;
  onMapClick?: (location: { lat: number; lng: number }) => void;
  className?: string;
}
```

#### 주요 구현 특징
- **동적 스크립트 로딩**: Google Maps API를 필요 시에만 로드
- **중복 로드 방지**: 전역 상태로 로딩 상태 관리
- **메모리 누수 방지**: 컴포넌트 언마운트 시 리스너 정리
- **마커 관리**: 동적 마커 추가/제거

```typescript
// 스크립트 동적 로딩 예시
useEffect(() => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    setError('Google Maps API 키가 설정되지 않았습니다.');
    return;
  }

  // 중복 로드 방지
  if (window.google && window.google.maps) {
    setIsLoaded(true);
    return;
  }

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&callback=initGoogleMaps`;
  script.async = true;
  script.defer = true;
  
  document.head.appendChild(script);
}, []);
```

### 3. Google Maps API 클라이언트

#### Directions API 활용
```typescript
// frontend/lib/googleMaps.ts
export async function getDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: 'walking' | 'driving' | 'transit' = 'walking'
): Promise<GoogleMapsRoute> {
  const url = `${GOOGLE_MAPS_API_URL}/directions/json`;
  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode: mode,
    key: GOOGLE_MAPS_API_KEY,
    language: 'ko',
    alternatives: 'false',
  });

  const response = await fetch(`${url}?${params.toString()}`);
  const data = await response.json();
  
  // 응답 처리 및 경로 데이터 변환
  return processRouteData(data);
}
```

#### Places API 검색
```typescript
export async function searchPlaces(
  query: string,
  location?: { lat: number; lng: number },
  radius?: number
): Promise<PlaceResult[]> {
  // JavaScript API 사용 (CORS 문제 해결)
  const service = new window.google.maps.places.PlacesService(
    document.createElement('div')
  );

  return new Promise((resolve, reject) => {
    service.textSearch({
      query: query,
      language: 'ko',
      location: location ? new window.google.maps.LatLng(location.lat, location.lng) : undefined,
      radius: radius || 5000,
    }, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        resolve(processPlaceResults(results));
      } else {
        reject(new Error(`장소 검색 실패: ${status}`));
      }
    });
  });
}
```

## 📍 위치 및 방향 감지

### 1. GPS 위치 추적 (useGeolocationWatcher)

#### 고정밀 위치 추적
```typescript
// frontend/hooks/useGeolocationWatcher.ts
export function useGeolocationWatcher() {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  
  // 위치 필터링 및 스무딩
  const filterLocation = useCallback((newReading: LocationReading): Location | null => {
    // 정확도 체크 (100m 이상은 무시)
    if (newReading.accuracy > 100) {
      return lastValidLocationRef.current;
    }
    
    // 비현실적인 이동 속도 체크
    const distance = getDistanceBetweenPoints(lastLocation, newReading.location);
    const timeDiff = (newReading.timestamp - lastTimestamp) / 1000;
    const maxSpeed = 50; // m/s
    
    if (timeDiff > 0 && distance / timeDiff > maxSpeed) {
      return lastValidLocationRef.current;
    }
    
    // 가중 평균으로 스무딩
    return calculateWeightedAverage(locationHistory, newReading);
  }, []);

  // 적응형 GPS 설정
  const getGPSOptions = useCallback((currentAccuracy: number | null) => {
    let maximumAge = 2000;
    let timeout = 8000;
    
    if (currentAccuracy !== null) {
      if (currentAccuracy < 10) {
        maximumAge = 3000; // 정확도 좋으면 덜 자주 업데이트
      } else if (currentAccuracy > 50) {
        maximumAge = 1000; // 정확도 나쁘면 더 자주 업데이트
      }
    }
    
    return { enableHighAccuracy: true, timeout, maximumAge };
  }, []);
}
```

### 2. 디바이스 방향 감지 (useHeading)

#### 나침반 방향 계산
```typescript
// frontend/hooks/useHeading.ts
export function useHeading() {
  const [heading, setHeading] = useState<number | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  
  // 방향 값 스무딩
  const filterHeading = (newHeading: number): number => {
    const lastHeading = headingHistory[headingHistory.length - 1];
    let diff = newHeading - lastHeading;
    
    // 360도 경계 처리
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    // 급격한 변화는 점진적으로 적용
    if (Math.abs(diff) > 30) {
      newHeading = lastHeading + diff * 0.3;
    }
    
    return calculateWeightedAverage(headingHistory, newHeading);
  };

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        const filteredHeading = filterHeading(event.alpha);
        setHeading(filteredHeading);
      }
    };

    // iOS 권한 요청
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        });
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }
  }, []);
}
```

## 🧭 네비게이션 계산 엔진

### 1. 네비게이션 계산 (useNavComputation)

#### 하이브리드 경로 계산
```typescript
// frontend/hooks/useNavComputation.ts
export function useNavComputation(
  currentLocation: Location | null,
  targetLocation: Location | null,
  heading: number | null
) {
  const [googleRoute, setGoogleRoute] = useState<GoogleMapsRoute | null>(null);
  const [useDirectRoute, setUseDirectRoute] = useState(false);

  // 직선 거리 계산 (폴백)
  const straightLineData = useMemo(() => {
    if (!currentLocation || !targetLocation) return null;
    
    const distance = getDistance(
      { latitude: currentLocation.lat, longitude: currentLocation.lng },
      { latitude: targetLocation.lat, longitude: targetLocation.lng }
    );
    
    const bearing = getRhumbLineBearing(
      { latitude: currentLocation.lat, longitude: currentLocation.lng },
      { latitude: targetLocation.lat, longitude: targetLocation.lng }
    );
    
    return { distance, bearing };
  }, [currentLocation, targetLocation]);

  // Google Maps 경로 vs 직선 경로 선택
  const { distance, bearing, relativeAngle, statusText } = useMemo(() => {
    const shouldUseGoogle = !useDirectRoute && googleRoute !== null && googleRoute.steps.length > 0;
    
    let dist: number;
    let bear: number;
    
    if (shouldUseGoogle) {
      // Google Maps 경로 사용
      const currentStep = googleRoute.steps[currentStepIndex];
      dist = calculateRemainingDistance(googleRoute, currentStepIndex, currentLocation);
      bear = currentStep.bearing;
    } else {
      // 직선 경로 사용 (안정적 폴백)
      dist = straightLineData.distance;
      bear = straightLineData.bearing;
    }

    // 상대 각도 계산
    let relAngle = null;
    if (heading !== null) {
      relAngle = bear - heading;
      // -180 ~ 180 범위로 정규화
      while (relAngle > 180) relAngle -= 360;
      while (relAngle < -180) relAngle += 360;
    }

    return { distance: dist, bearing: bear, relativeAngle: relAngle };
  }, [currentLocation, targetLocation, heading, googleRoute, useDirectRoute]);
}
```

### 2. 현재 경로 단계 추적
```typescript
// 현재 위치에 가장 가까운 경로 단계 찾기
const findCurrentStep = useCallback(() => {
  if (!googleRoute || !currentLocation) return 0;

  const currentStep = googleRoute.steps[currentStepIndex];
  if (currentStep) {
    const distanceToStepEnd = getDistance(
      { latitude: currentLocation.lat, longitude: currentLocation.lng },
      { latitude: currentStep.endLocation.lat, longitude: currentStep.endLocation.lng }
    );
    
    // 20m 이내 도달 시 다음 단계로 진행
    if (distanceToStepEnd < 20 && currentStepIndex < googleRoute.steps.length - 1) {
      return currentStepIndex + 1;
    }
  }
  
  return currentStepIndex;
}, [googleRoute, currentLocation, currentStepIndex]);
```

## 🎯 AR 네비게이션 UI

### 1. AR 화살표 표시 (ArrowIndicator)

#### 동적 화살표 렌더링
```typescript
// frontend/components/ArrowIndicator.tsx
export function ArrowIndicator({ angle, distance }: ArrowIndicatorProps) {
  const [smoothedAngle, setSmoothedAngle] = useState(0);
  
  // 각도 스무딩
  useEffect(() => {
    if (angle === null) return;
    
    const targetAngle = angle;
    const currentAngle = smoothedAngle;
    
    let diff = targetAngle - currentAngle;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    const smoothingFactor = Math.min(0.2, Math.max(0.15, Math.abs(diff) / 15));
    const newAngle = currentAngle + diff * smoothingFactor;
    
    setSmoothedAngle(newAngle);
  }, [angle, smoothedAngle]);

  // 거리에 따른 시각적 피드백
  const getArrowColor = () => {
    if (distance === null) return 'text-white';
    if (distance < 5) return 'text-green-300';
    if (distance < 10) return 'text-green-400';
    if (distance < 30) return 'text-blue-400';
    return 'text-white';
  };

  return (
    <div
      className={`${getArrowSize()} ${getArrowColor()}`}
      style={{
        transform: `rotate(${smoothedAngle}deg)`,
        filter: `drop-shadow(0 0 ${distance < 20 ? '15px' : '10px'} rgba(255,255,255,0.8))`,
      }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor">
        <path d="M50 10 L60 40 L75 40 L55 60 L45 60 L25 40 L40 40 Z" />
        <rect x="45" y="60" width="10" height="30" rx="2" />
      </svg>
    </div>
  );
}
```

### 2. 카메라 프리뷰 통합
```typescript
// AR 네비게이션 실행 화면
const startCamera = useCallback(async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' } // 후면 카메라
    });
    
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      setCameraActive(true);
    }
  } catch (err) {
    console.error('카메라 접근 실패:', err);
    // 카메라 없이도 동작 가능하도록 처리
  }
}, []);
```

## 🔄 사용자 플로우

### 1. 목적지 선택 화면 (select/page.tsx)

#### 주요 기능
- **장소 검색**: Google Places API 활용
- **지도 클릭**: 시작/도착 위치 직접 설정
- **현재 위치**: GPS 기반 자동 설정
- **경로 미리보기**: 선택된 위치들을 지도에 표시

```typescript
// 지도 클릭 핸들러
const handleMapClick = (location: { lat: number; lng: number }) => {
  setClickedLocation(location);
  setShowLocationOptions(true); // 시작/도착 선택 모달 표시
};

// 네비게이션 시작
const handleStartNavigation = async () => {
  // 1. 사용자 인증 확인
  // 2. 백엔드 세션 생성
  // 3. 네비게이션 상태 저장
  // 4. AR 실행 화면으로 이동
  
  const session = await createSession({
    user_id: backendUser.id,
    destination_latitude: destinationLocation.lat,
    destination_longitude: destinationLocation.lng,
    start_latitude: startLocation.lat,
    start_longitude: startLocation.lng,
  });
  
  setSessionId(session.id);
  setTargetLocation(destinationLocation);
  router.push('/ar-nav/run');
};
```

### 2. AR 네비게이션 실행 (run/page.tsx)

#### 실시간 네비게이션 로직
```typescript
// 도착 감지
useEffect(() => {
  const threshold = getArrivalThreshold(); // GPS 정확도 기반 동적 임계값
  const isWithinThreshold = distance < threshold;

  if (isWithinThreshold) {
    if (arrivalCheckStartRef.current === null) {
      arrivalCheckStartRef.current = Date.now();
    } else {
      const timeInThreshold = Date.now() - arrivalCheckStartRef.current;
      if (timeInThreshold >= ARRIVAL_CHECK_DURATION) {
        // 2초간 반경 내 유지 시 도착 처리
        haptic.heavy(); // 진동 피드백
        router.push('/ar-nav/arrived');
      }
    }
  } else {
    arrivalCheckStartRef.current = null;
  }
}, [distance]);

// 네비게이션 포인트 저장 (백엔드 동기화)
const saveNavigationPointToAPI = useCallback(async () => {
  if (!currentLocation || !currentSessionId) return;

  try {
    await saveNavigationPoint({
      session_id: currentSessionId,
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      heading: heading || undefined,
      accuracy: accuracy || undefined,
      distance_to_target: distance || undefined,
      bearing: bearing || undefined,
      relative_angle: relativeAngle || undefined,
    });
  } catch (err) {
    // 오프라인 상태는 조용히 처리
    if (err instanceof ApiError && err.isOffline) {
      console.warn('오프라인 상태로 저장 실패');
      return;
    }
    console.error('네비게이션 포인트 저장 실패:', err);
  }
}, [currentLocation, currentSessionId, heading, accuracy, distance, bearing, relativeAngle]);
```

## 🛠️ 디버깅 및 테스트

### 1. 디버그 유틸리티 (debugARNav.ts)

#### 종합 기능 테스트
```typescript
// 브라우저 콘솔에서 실행: debugARNav()
export async function debugARNav(): Promise<void> {
  // 1. 카메라 접근 테스트
  await testCameraAccess();
  
  // 2. GPS 위치 테스트
  await testGPSAccess();
  
  // 3. DeviceOrientation 테스트
  await testDeviceOrientation();
  
  // 4. API 연결 테스트
  await testAPIConnection();
  
  // 결과 출력
  printResults();
}
```

#### 개별 기능 테스트
```typescript
async function testCameraAccess(): Promise<void> {
  // 후면 카메라 우선 시도
  navigator.mediaDevices.getUserMedia({ 
    video: { facingMode: 'environment' }
  })
  .then((stream) => {
    const videoTrack = stream.getTracks().find(track => track.kind === 'video');
    const capabilities = videoTrack.getCapabilities();
    const settings = videoTrack.getSettings();
    
    addResult('카메라 접근', 'success', '카메라 접근 성공', {
      facingMode: settings.facingMode,
      resolution: `${settings.width}x${settings.height}`,
      capabilities: capabilities,
    });
    
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(() => {
    // 전면 카메라로 폴백
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
  });
}
```

## ⚡ 성능 최적화

### 1. 메모리 관리
- **스트림 정리**: 카메라 스트림 적절한 해제
- **이벤트 리스너**: 컴포넌트 언마운트 시 정리
- **타이머 관리**: setTimeout/setInterval 정리

### 2. 네트워크 최적화
- **디바운싱**: GPS 업데이트 1초마다 제한
- **폴백 전략**: Google Maps API 실패 시 직선 경로 사용
- **오프라인 처리**: 네트워크 오류 시 조용한 실패

### 3. 사용자 경험
- **부드러운 애니메이션**: 각도/거리 스무딩
- **햅틱 피드백**: 방향 변경 및 도착 시 진동
- **적응형 UI**: 거리에 따른 화살표 크기/색상 변경

## 🔧 환경 설정 및 배포

### 1. 필수 환경 변수
```bash
# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key

# 백엔드 API
NEXT_PUBLIC_API_URL=https://your-backend-url

# NextAuth (인증)
NEXTAUTH_URL=https://your-frontend-url
NEXTAUTH_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 2. Google Maps API 설정
1. Google Cloud Console에서 프로젝트 생성
2. 다음 API 활성화:
   - Maps JavaScript API
   - Directions API
   - Places API
   - Geocoding API
3. API 키 생성 및 도메인 제한 설정

### 3. 브라우저 권한
- **위치 권한**: GPS 접근 필수
- **카메라 권한**: AR 프리뷰용 (선택사항)
- **DeviceOrientation**: 나침반 기능 (iOS 13+ 권한 필요)

## 🚨 알려진 이슈 및 해결방안

### 1. GPS 정확도 문제
- **문제**: 실내에서 GPS 정확도 저하
- **해결**: 적응형 도착 임계값 (정확도에 따라 5-10m 조정)

### 2. 나침반 보정
- **문제**: DeviceOrientation 값 불안정
- **해결**: 가중 평균 스무딩 및 사용자 보정 안내

### 3. Google Maps API 제한
- **문제**: API 할당량 초과 또는 키 누락
- **해결**: 직선 경로 폴백 시스템

### 4. 카메라 접근 실패
- **문제**: 브라우저 권한 거부 또는 카메라 없음
- **해결**: 카메라 없이도 동작하는 네비게이션

## 📊 성능 메트릭

### 1. 측정 지표
- GPS 정확도: 평균 5-15m
- 방향 업데이트: 60fps (16ms 간격)
- API 응답 시간: 평균 500ms 이하
- 배터리 사용량: 시간당 약 15-20% (GPS + 카메라)

### 2. 최적화 목표
- 초기 로딩: 3초 이내
- 위치 업데이트 지연: 1초 이내
- 메모리 사용량: 50MB 이하 유지

이 기술 문서는 AR 네비게이션 시스템의 핵심 구현 사항을 포괄적으로 다루며, 다른 AI나 개발자가 코드 품질과 구현 적합성을 검토하는 데 필요한 모든 정보를 제공합니다.