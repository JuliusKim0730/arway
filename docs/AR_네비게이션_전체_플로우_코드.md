# 🗺️ AR 네비게이션 전체 플로우 코드 가이드

## 📋 목차

1. [개요](#개요)
2. [전체 플로우 다이어그램](#전체-플로우-다이어그램)
3. [단계별 상세 코드](#단계별-상세-코드)
   - [1단계: 지도 API 로딩](#1단계-지도-api-로딩)
   - [2단계: 목적지 선택](#2단계-목적지-선택)
   - [3단계: 경로 계산](#3단계-경로-계산)
   - [4단계: AR 네비게이션 시작](#4단계-ar-네비게이션-시작)
   - [5단계: 실시간 위치 추적](#5단계-실시간-위치-추적)
   - [6단계: AR 화살표 표시](#6단계-ar-화살표-표시)
   - [7단계: 도착 감지](#7단계-도착-감지)
4. [핵심 컴포넌트 및 훅](#핵심-컴포넌트-및-훅)
5. [에러 처리 및 폴백](#에러-처리-및-폴백)

---

## 개요

AR 네비게이션 시스템은 다음과 같은 단계로 동작합니다:

1. **지도 API 로딩**: 위치에 따라 TMAP(한국) 또는 Google Maps(해외) 선택
2. **목적지 선택**: 사용자가 출발지와 도착지 선택
3. **경로 계산**: 선택된 API로 도보 경로 계산
4. **AR 네비게이션 시작**: 카메라 활성화 및 GPS 추적 시작
5. **실시간 위치 추적**: GPS 위치 및 나침반 방향 추적
6. **AR 화살표 표시**: 카메라 위에 방향 화살표 오버레이
7. **도착 감지**: 목적지 근처 도착 시 자동 감지

---

## 전체 플로우 다이어그램

```
[사용자 접속]
    ↓
[권한 요청] (위치, 카메라)
    ↓
[지도 API 로딩]
    ├─ 한국 위치 → TMAP API
    └─ 해외 위치 → Google Maps API
    ↓
[목적지 선택 페이지]
    ├─ 검색 또는 지도 클릭
    ├─ 출발지/도착지 설정
    └─ "AR 네비게이션 시작" 클릭
    ↓
[경로 계산]
    ├─ TMAP API 호출 (한국)
    ├─ Google Maps API 호출 (해외)
    └─ 실패 시 직선 경로 폴백
    ↓
[AR 네비게이션 페이지]
    ├─ 카메라 활성화
    ├─ GPS 위치 추적 시작
    ├─ 나침반 방향 추적 시작
    └─ 경로 데이터 로드
    ↓
[실시간 업데이트 루프]
    ├─ GPS 위치 업데이트 (1초마다)
    ├─ 나침반 방향 업데이트 (실시간)
    ├─ 현재 위치에서 목적지까지 거리 계산
    ├─ 상대 각도 계산 (목적지 방향 - 현재 방향)
    └─ AR 화살표 각도 업데이트
    ↓
[도착 감지]
    └─ 목적지 반경 5m 이내 2초 유지 → 도착 처리
```

---

## 단계별 상세 코드

### 1단계: 지도 API 로딩

#### 1.1 위치 기반 API 선택

**파일**: `frontend/services/ARNavigationManager.ts`

```typescript
/**
 * 현재 위치가 한국인지 확인 (위경도 바운더리 체크)
 */
checkIsKorea(lat: number, lng: number): boolean {
  // 한국 본토 + 제주도를 포함한 범위
  const koreaMainland = lat >= 33.0 && lat <= 38.9 && lng >= 124.5 && lng <= 131.9;
  
  // 독도 포함 (동해 영역)
  const dokdo = lat >= 37.2 && lat <= 37.3 && lng >= 131.8 && lng <= 131.9;
  
  return koreaMainland || dokdo;
}
```

#### 1.2 TMAP API 로딩

**파일**: `frontend/components/TmapMap.tsx`

```typescript
const loadTmapAPI = useCallback(() => {
  return new Promise<void>((resolve, reject) => {
    // 이미 로드된 경우
    if (window.Tmapv2) {
      resolve();
      return;
    }

    // 환경변수에서 API 키 가져오기
    const apiKey = process.env.NEXT_PUBLIC_TMAP_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_TMAP_API_KEY_HERE') {
      reject(new Error('TMAP_API_KEY_NOT_SET'));
      return;
    }

    // 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = `https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${apiKey}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.Tmapv2) {
        resolve();
      } else {
        reject(new Error('TMAP API 로드 실패'));
      }
    };
    
    script.onerror = () => {
      reject(new Error('TMAP 스크립트 로드 실패'));
    };
    
    document.head.appendChild(script);
  });
}, []);
```

#### 1.3 Google Maps API 로딩

**파일**: `frontend/components/GoogleMap.tsx`

```typescript
useEffect(() => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    setError('Google Maps API 키가 설정되지 않았습니다.');
    return;
  }

  // 이미 로드되어 있는지 확인
  if (window.google && window.google.maps) {
    setIsLoaded(true);
    return;
  }

  // 전역 콜백 함수
  const callbackName = `initGoogleMaps_${Date.now()}`;
  
  (window as any)[callbackName] = () => {
    setIsLoaded(true);
    delete (window as any)[callbackName];
  };

  // 스크립트 로드
  const script = document.createElement('script');
  script.src = `${baseUrl}?key=${apiKey}&libraries=places,marker&callback=${callbackName}`;
  script.async = true;
  script.defer = true;
  
  script.onerror = () => {
    // 재시도 로직
  };
  
  document.head.appendChild(script);
}, []);
```

---

### 2단계: 목적지 선택

**파일**: `frontend/app/ar-nav/select/page.tsx`

#### 2.1 지도 표시 및 마커

```typescript
// 한국이면 TMAP, 아니면 Google Maps
{isKorea && !tmapError ? (
  <TmapMap
    center={mapCenter}
    zoom={selectedPlace ? 16 : 14}
    markers={[
      ...(currentLocation ? [{
        position: currentLocation,
        label: '📍',
        title: '현재 위치',
        type: 'current' as const,
      }] : []),
      ...(startLocation ? [{
        position: startLocation,
        label: '시작',
        title: '시작 위치',
        type: 'start' as const,
      }] : []),
      ...(destinationLocation ? [{
        position: destinationLocation,
        label: '도착',
        title: selectedPlace?.name || '도착 위치',
        type: 'end' as const,
      }] : []),
    ]}
    onMapClick={handleMapClick}
  />
) : (
  <GoogleMap
    center={mapCenter}
    zoom={selectedPlace ? 16 : 14}
    markers={[
      ...(currentLocation ? [{
        position: currentLocation,
        label: '📍',
        title: '현재 위치',
      }] : []),
      ...(startLocation ? [{
        position: startLocation,
        label: '시작',
        title: '시작 위치',
      }] : []),
      ...(destinationLocation ? [{
        position: destinationLocation,
        label: '도착',
        title: selectedPlace?.name || '도착 위치',
      }] : []),
    ]}
    onMapClick={handleMapClick}
  />
)}
```

#### 2.2 네비게이션 시작

```typescript
const handleStartNavigation = async () => {
  if (!destinationLocation || !startLocation) {
    toast.error('시작 위치와 도착 위치를 설정해주세요.');
    return;
  }

  setLoading(true);

  try {
    // 백엔드에 세션 생성
    const session = await createSession({
      user_id: backendUser.id,
      destination_id: selectedDestination?.id,
      place_id: selectedPlace?.place_id,
      place_name: selectedPlace?.name || '지도에서 선택한 위치',
      destination_latitude: destinationLocation.lat,
      destination_longitude: destinationLocation.lng,
      start_latitude: startLocation.lat,
      start_longitude: startLocation.lng,
    });

    // 세션 ID와 목적지 정보 저장
    setSessionId(session.id);
    setTargetLocation({
      lat: destinationLocation.lat,
      lng: destinationLocation.lng,
    });

    // AR 네비게이션 페이지로 이동
    router.push('/ar-nav/run');
  } catch (err) {
    // 오프라인 모드로 폴백
    const fallbackSessionId = `offline_${Date.now()}`;
    setSessionId(fallbackSessionId);
    setTargetLocation({
      lat: destinationLocation.lat,
      lng: destinationLocation.lng,
    });
    router.push('/ar-nav/run');
  } finally {
    setLoading(false);
  }
};
```

---

### 3단계: 경로 계산

**파일**: `frontend/services/ARNavigationManager.ts`

#### 3.1 통합 경로 계산 함수

```typescript
async getDirections(origin: Location, destination: Location): Promise<NavigationRoute | null> {
  const isKorea = this.checkIsKorea(origin.lat, origin.lng);
  
  try {
    let result: NavigationRoute | null = null;

    if (isKorea) {
      // 한국: TMAP API 사용
      if (!this.tmapApiKey) {
        // TMAP API 키가 없으면 Google Maps로 폴백
        if (!isGoogleMapsAvailable()) {
          throw new Error('API_KEY_NOT_AVAILABLE');
        }
        result = await this.getGoogleRoute(origin, destination);
      } else {
        try {
          result = await this.getTmapWalkingRoute(origin, destination);
        } catch (tmapError) {
          // TMAP 실패 시 Google Maps로 폴백
          if (isGoogleMapsAvailable()) {
            result = await this.getGoogleRoute(origin, destination);
          } else {
            throw new Error('API_KEY_NOT_AVAILABLE');
          }
        }
      }
    } else {
      // 해외: Google Maps API 사용
      if (!isGoogleMapsAvailable()) {
        throw new Error('API_KEY_NOT_AVAILABLE');
      }
      result = await this.getGoogleRoute(origin, destination);
    }

    return result;
  } catch (error) {
    // 에러 처리 및 재시도 로직
    throw error;
  }
}
```

#### 3.2 TMAP 도보 경로 API 호출

```typescript
async getTmapWalkingRoute(origin: Location, destination: Location): Promise<NavigationRoute | null> {
  const url = 'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'appKey': this.tmapApiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      startX: origin.lng.toString(),
      startY: origin.lat.toString(),
      endX: destination.lng.toString(),
      endY: destination.lat.toString(),
      startName: "출발지",
      endName: "목적지",
      searchOption: "0", // 추천경로
      resCoordType: "WGS84GEO"
    })
  });

  if (!response.ok) {
    throw new Error(`TMAP API 오류: ${response.status}`);
  }

  const data: TmapResponse = await response.json();
  return this.parseTmapData(data);
}
```

#### 3.3 Google Maps 경로 API 호출

```typescript
async getGoogleRoute(origin: Location, destination: Location): Promise<NavigationRoute | null> {
  // Google Maps API가 로드되지 않은 경우 동적 로드
  if (!isGoogleMapsAvailable()) {
    await loadGoogleMaps();
    this.initializeGoogleMaps();
  }

  if (!this.googleDirectionsService) {
    throw new Error('Google Maps DirectionsService 초기화 실패');
  }

  return new Promise((resolve, reject) => {
    const request: any = {
      origin: new (window as any).google.maps.LatLng(origin.lat, origin.lng),
      destination: new (window as any).google.maps.LatLng(destination.lat, destination.lng),
      travelMode: (window as any).google.maps.TravelMode.WALKING,
      unitSystem: (window as any).google.maps.UnitSystem.METRIC,
      avoidHighways: true,
      avoidTolls: true
    };

    this.googleDirectionsService.route(request, (result: any, status: any) => {
      if (status === (window as any).google.maps.DirectionsStatus.OK && result) {
        const route = this.parseGoogleData(result);
        resolve(route);
      } else {
        reject(new Error(`Google Maps API 실패: ${status}`));
      }
    });
  });
}
```

---

### 4단계: AR 네비게이션 시작

**파일**: `frontend/app/ar-nav/run/page.tsx`

#### 4.1 카메라 활성화

```typescript
const startCamera = useCallback(async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' } // 후면 카메라
    });
    
    cameraStreamRef.current = stream;
    
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      setCameraActive(true);
    }
  } catch (err) {
    console.error('카메라 접근 실패:', err);
    toast.warning('카메라 접근이 거부되었습니다. 카메라 없이도 네비게이션이 가능합니다.');
  }
}, []);

useEffect(() => {
  startCamera();
  return () => {
    stopCamera();
  };
}, [startCamera]);
```

#### 4.2 GPS 위치 추적 시작

```typescript
const { currentLocation, accuracy, error: gpsError } = useGeolocationWatcher();
```

**파일**: `frontend/hooks/useGeolocationWatcher.ts`

```typescript
const startWatching = useCallback(() => {
  if (!navigator.geolocation) {
    setError('Geolocation is not supported');
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const newReading: LocationReading = {
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
      };
      
      // 위치 필터링 적용
      const filteredLocation = filterLocation(newReading);
      
      if (filteredLocation) {
        setCurrentLocation(filteredLocation);
        setAccuracy(position.coords.accuracy);
      }
    },
    (err) => {
      // 에러 처리 및 재시도 로직
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}, [filterLocation]);
```

#### 4.3 나침반 방향 추적 시작

```typescript
const { heading, isCalibrated } = useHeading();
```

**파일**: `frontend/hooks/useHeading.ts`

```typescript
useEffect(() => {
  const handleOrientation = (event: DeviceOrientationEvent) => {
    if (event.alpha !== null) {
      // alpha는 0-360도 범위의 나침반 방향
      const rawHeading = event.alpha;
      const filteredHeading = filterHeading(rawHeading);
      setHeading(filteredHeading);
    }
  };

  if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
    // iOS 13+ 권한 요청
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any)
        .requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        });
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }
  }

  return () => {
    window.removeEventListener('deviceorientation', handleOrientation);
  };
}, []);
```

---

### 5단계: 실시간 위치 추적

**파일**: `frontend/hooks/useNavComputation.ts`

#### 5.1 경로 계산 훅

```typescript
export function useNavComputation(
  currentLocation: Location | null,
  targetLocation: Location | null,
  heading: number | null
) {
  const [googleRoute, setGoogleRoute] = useState<GoogleMapsRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [useDirectRoute, setUseDirectRoute] = useState(false);

  // 경로 계산 함수
  const fetchRoute = useCallback(async () => {
    if (!currentLocation || !targetLocation) return;

    setRouteLoading(true);

    try {
      const selectedService = determineService(currentLocation);
      
      if (selectedService === 'TMAP') {
        const tmapRoute = await arNavigationManager.getDirections(currentLocation, targetLocation);
        // TMAP 결과를 Google Maps 형식으로 변환
        setGoogleRoute(convertedRoute);
      } else if (selectedService === 'Google Maps') {
        const route = await getDirections(currentLocation, targetLocation, 'walking');
        setGoogleRoute(route);
      }
    } catch (error) {
      // 직선 경로로 폴백
      setUseDirectRoute(true);
    } finally {
      setRouteLoading(false);
    }
  }, [currentLocation, targetLocation]);

  // 위치 변경 시 경로 재계산 (디바운싱)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRoute();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [currentLocation, targetLocation, fetchRoute]);
}
```

#### 5.2 거리 및 방향 계산

```typescript
const { distance, bearing, relativeAngle, statusText } = useMemo(() => {
  if (!currentLocation || !targetLocation || !straightLineData) {
    return {
      distance: null,
      bearing: null,
      relativeAngle: null,
      statusText: '위치 정보를 가져오는 중...',
    };
  }

  let dist: number;
  let bear: number;

  if (shouldUseGoogle && googleRoute) {
    // Google Maps 경로 사용
    const currentStep = googleRoute.steps[currentStepIndex];
    dist = calculateRemainingDistance(currentStep, currentStepIndex);
    bear = currentStep.bearing;
  } else {
    // 직선 경로 사용
    dist = straightLineData.distance;
    bear = straightLineData.bearing;
  }

  // 상대 각도 계산 (목적지 방향 - 현재 방향)
  let relAngle = null;
  if (heading !== null) {
    relAngle = bear - heading;
    // -180 ~ 180 범위로 정규화
    while (relAngle > 180) relAngle -= 360;
    while (relAngle < -180) relAngle += 360;
  }

  return {
    distance: dist,
    bearing: bear,
    relativeAngle: relAngle,
    statusText: getStatusText(relAngle, dist, currentStep),
  };
}, [currentLocation, targetLocation, heading, googleRoute, currentStepIndex]);
```

---

### 6단계: AR 화살표 표시

**파일**: `frontend/app/ar-nav/run/page.tsx`

#### 6.1 카메라 오버레이 구조

```typescript
return (
  <div className="relative w-full h-screen bg-black overflow-hidden">
    {/* 카메라 프리뷰 - 배경 레이어 (z-0) */}
    <div className="absolute inset-0 z-0">
      {cameraActive ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }} // 거울 모드
        />
      ) : (
        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>

    {/* 카메라 오버레이 배경 (어두운 그라데이션) - z-5 */}
    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-5 pointer-events-none" />

    {/* 상단 HUD - 카메라 위 오버레이 (z-30) */}
    <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm p-3 sm:p-4 z-30">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-3xl sm:text-4xl font-bold text-white">
            {displayedDistance !== null ? displayedDistance : '--'}m
          </p>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            {statusText}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">
            정확도: {accuracy !== null ? `${Math.round(accuracy)}m` : '--'}
          </div>
        </div>
      </div>
    </div>

    {/* 중앙 화살표 - 카메라 위 오버레이 (z-20) */}
    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
      <ArrowIndicator 
        angle={relativeAngle} 
        distance={distance}
      />
    </div>
  </div>
);
```

#### 6.2 화살표 인디케이터 컴포넌트

**파일**: `frontend/components/ArrowIndicator.tsx`

```typescript
export function ArrowIndicator({ angle, distance }: ArrowIndicatorProps) {
  const [smoothedAngle, setSmoothedAngle] = useState(0);

  // 각도 스무딩 (부드러운 애니메이션)
  useEffect(() => {
    if (angle === null) return;

    const targetAngle = angle;
    const currentAngle = smoothedAngle;
    
    // 각도 차이 계산 (-180 ~ 180 범위)
    let diff = targetAngle - currentAngle;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    // 스무딩 계수
    const smoothingFactor = Math.min(0.2, Math.max(0.15, Math.abs(diff) / 15));
    const newAngle = currentAngle + diff * smoothingFactor;

    const timer = setTimeout(() => {
      setSmoothedAngle(newAngle);
    }, 16); // ~60fps

    return () => clearTimeout(timer);
  }, [angle, smoothedAngle]);

  return (
    <div className="relative flex items-center justify-center">
      {/* 중앙 화살표 */}
      <div
        className="text-5xl sm:text-6xl text-white drop-shadow-2xl transition-all duration-300"
        style={{
          transform: `rotate(${smoothedAngle}deg)`,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor">
          <path d="M50 10 L60 40 L75 40 L55 60 L45 60 L25 40 L40 40 Z" />
          <rect x="45" y="60" width="10" height="30" rx="2" />
        </svg>
      </div>
    </div>
  );
}
```

---

### 7단계: 도착 감지

**파일**: `frontend/app/ar-nav/run/page.tsx`

```typescript
// GPS 정확도 기반 동적 도착 반경 계산
const getArrivalThreshold = useCallback(() => {
  const baseThreshold = 5; // 기본 5m
  
  if (accuracy !== null) {
    if (accuracy > 30) {
      return baseThreshold * 2; // 최대 10m
    } else if (accuracy > 10) {
      return baseThreshold * 1.5; // 최대 7.5m
    }
  }
  
  return baseThreshold;
}, [accuracy]);

useEffect(() => {
  if (distance === null) {
    arrivalCheckStartRef.current = null;
    return;
  }

  const threshold = getArrivalThreshold();
  const isWithinThreshold = distance < threshold;

  if (isWithinThreshold) {
    // 반경 내 진입 시점 기록
    if (arrivalCheckStartRef.current === null) {
      arrivalCheckStartRef.current = Date.now();
    } else {
      // 일정 시간 동안 반경 내 유지되었는지 확인
      const timeInThreshold = Date.now() - arrivalCheckStartRef.current;
      if (timeInThreshold >= ARRIVAL_CHECK_DURATION) {
        // 도착 처리 - 강한 진동
        haptic.heavy();
        trackEvent(AnalyticsEvents.ARRIVAL_DETECTED, {
          distance,
          accuracy: accuracy || undefined,
          threshold,
        });
        router.push('/ar-nav/arrived');
      }
    }
  } else {
    // 반경 밖으로 나가면 초기화
    arrivalCheckStartRef.current = null;
  }
}, [distance, accuracy, getArrivalThreshold, router, haptic]);
```

---

## 핵심 컴포넌트 및 훅

### 1. ARNavigationManager

**위치**: `frontend/services/ARNavigationManager.ts`

**주요 기능**:
- 위치 기반 API 선택 (TMAP/Google Maps)
- 경로 계산 (TMAP/Google Maps API 호출)
- 경로 데이터 파싱 및 변환
- 에러 처리 및 폴백

**주요 메서드**:
- `checkIsKorea(lat, lng)`: 한국 위치 확인
- `getDirections(origin, destination)`: 통합 경로 계산
- `getTmapWalkingRoute(origin, destination)`: TMAP 경로 계산
- `getGoogleRoute(origin, destination)`: Google Maps 경로 계산

### 2. useNavComputation

**위치**: `frontend/hooks/useNavComputation.ts`

**주요 기능**:
- 현재 위치와 목적지 간 거리/방향 계산
- 경로 단계 추적
- 직선 경로 폴백 처리

**반환 값**:
- `distance`: 목적지까지 거리 (미터)
- `bearing`: 목적지 방향 (도)
- `relativeAngle`: 상대 각도 (목적지 방향 - 현재 방향)
- `statusText`: 상태 메시지
- `currentStep`: 현재 경로 단계
- `nextStep`: 다음 경로 단계

### 3. useGeolocationWatcher

**위치**: `frontend/hooks/useGeolocationWatcher.ts`

**주요 기능**:
- GPS 위치 실시간 추적
- 위치 필터링 및 스무딩
- 정확도 기반 적응형 설정
- 에러 처리 및 재시도

**반환 값**:
- `currentLocation`: 현재 위치 (lat, lng)
- `accuracy`: GPS 정확도 (미터)
- `error`: 에러 메시지
- `requestPermission()`: 권한 요청 함수

### 4. useHeading

**위치**: `frontend/hooks/useHeading.ts`

**주요 기능**:
- 나침반 방향 추적 (DeviceOrientation API)
- 방향 값 필터링 및 스무딩
- iOS 권한 처리

**반환 값**:
- `heading`: 나침반 방향 (0-360도)
- `isCalibrated`: 보정 완료 여부

### 5. ArrowIndicator

**위치**: `frontend/components/ArrowIndicator.tsx`

**주요 기능**:
- AR 화살표 표시
- 각도 스무딩 애니메이션
- 거리에 따른 크기/색상 조정

**Props**:
- `angle`: 화살표 각도 (상대 각도)
- `distance`: 목적지까지 거리

---

## 에러 처리 및 폴백

### 1. API 키 없음

**시나리오**: TMAP/Google Maps API 키가 설정되지 않음

**처리**:
```typescript
if (!this.tmapApiKey) {
  console.warn('⚠️ TMAP API 키가 없어서 Google Maps로 폴백합니다.');
  if (!isGoogleMapsAvailable()) {
    throw new Error('API_KEY_NOT_AVAILABLE');
  }
  result = await this.getGoogleRoute(origin, destination);
}
```

**폴백**: Google Maps → 직선 경로

### 2. API 호출 실패

**시나리오**: TMAP API 호출 실패

**처리**:
```typescript
try {
  result = await this.getTmapWalkingRoute(origin, destination);
} catch (tmapError) {
  console.warn('⚠️ TMAP API 호출 실패, Google Maps로 폴백:', tmapError);
  if (isGoogleMapsAvailable()) {
    result = await this.getGoogleRoute(origin, destination);
  } else {
    throw new Error('API_KEY_NOT_AVAILABLE');
  }
}
```

**폴백**: Google Maps → 직선 경로

### 3. GPS 신호 없음

**시나리오**: GPS 신호를 받을 수 없음 (실내 환경)

**처리**:
```typescript
// 적응형 정확도 임계값
let accuracyThreshold = 500; // 기본값

if (avgAccuracy > 200) {
  // 신호가 매우 약한 환경 - 매우 관대하게 허용
  accuracyThreshold = 3000; // 3km까지 허용
}

// 정확도가 낮아도 최소한의 위치 정보는 사용
if (newReading.accuracy > accuracyThreshold) {
  // 이전 위치 유지 또는 새 위치 사용 (시간 기반)
}
```

**폴백**: 마지막 유효 위치 유지

### 4. 카메라 접근 거부

**시나리오**: 사용자가 카메라 권한 거부

**처리**:
```typescript
try {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' }
  });
} catch (err) {
  console.error('카메라 접근 실패:', err);
  toast.warning('카메라 접근이 거부되었습니다. 카메라 없이도 네비게이션이 가능합니다.');
  // 카메라 없이도 동작 가능하도록 처리
}
```

**폴백**: 카메라 없이 AR 화살표만 표시

### 5. 네트워크 오류

**시나리오**: 백엔드 서버 연결 실패

**처리**:
```typescript
try {
  const session = await createSession({...});
} catch (err) {
  console.warn('백엔드 통신 실패, 오프라인 모드로 전환:', err);
  const fallbackSessionId = `offline_${Date.now()}`;
  setSessionId(fallbackSessionId);
  // 오프라인 모드로 네비게이션 시작
}
```

**폴백**: 오프라인 모드 (로컬 저장 없음)

---

## 요약

전체 AR 네비게이션 플로우는 다음과 같이 동작합니다:

1. **지도 API 로딩**: 위치에 따라 TMAP 또는 Google Maps 선택
2. **목적지 선택**: 사용자가 출발지/도착지 선택
3. **경로 계산**: 선택된 API로 도보 경로 계산
4. **AR 네비게이션 시작**: 카메라 및 GPS 활성화
5. **실시간 추적**: GPS 위치 및 나침반 방향 실시간 업데이트
6. **AR 화살표 표시**: 카메라 위에 방향 화살표 오버레이
7. **도착 감지**: 목적지 근처 도착 시 자동 감지

각 단계에서 에러가 발생하면 적절한 폴백 메커니즘이 동작하여 사용자 경험을 유지합니다.

