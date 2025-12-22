import { useState, useEffect, useCallback, useRef } from 'react';

interface Location {
  lat: number;
  lng: number;
}

interface LocationReading {
  location: Location;
  accuracy: number;
  timestamp: number;
}

export function useGeolocationWatcher() {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  
  // 위치 히스토리 및 필터링을 위한 ref
  const locationHistoryRef = useRef<LocationReading[]>([]);
  const lastValidLocationRef = useRef<Location | null>(null);

  // 두 지점 간 거리 계산 (미터)
  const getDistanceBetweenPoints = useCallback((point1: Location, point2: Location): number => {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  // 위치 필터링 함수 - 이상치 제거 및 스무딩
  const filterLocation = useCallback((newReading: LocationReading): Location | null => {
    const history = locationHistoryRef.current;
    
    // 첫 번째 위치는 그대로 사용
    if (history.length === 0) {
      history.push(newReading);
      lastValidLocationRef.current = newReading.location;
      return newReading.location;
    }
    
    // 정확도가 너무 낮으면 무시 (100m 이상)
    if (newReading.accuracy > 100) {
      console.warn('GPS 정확도가 너무 낮음:', newReading.accuracy);
      return lastValidLocationRef.current;
    }
    
    // 이전 위치와의 거리 계산
    const lastLocation = history[history.length - 1].location;
    const distance = getDistanceBetweenPoints(lastLocation, newReading.location);
    
    // 비현실적인 이동 거리 체크 (1초에 50m 이상 이동 시 의심)
    const timeDiff = (newReading.timestamp - history[history.length - 1].timestamp) / 1000;
    const maxSpeed = 50; // m/s (도보 기준 매우 빠른 속도)
    
    if (timeDiff > 0 && distance / timeDiff > maxSpeed) {
      console.warn('비현실적인 이동 속도 감지:', distance / timeDiff, 'm/s');
      return lastValidLocationRef.current;
    }
    
    // 히스토리에 추가 (최대 10개 유지)
    history.push(newReading);
    if (history.length > 10) {
      history.shift();
    }
    
    // 최근 3개 위치의 가중 평균 계산 (최신 위치에 더 높은 가중치)
    const recentReadings = history.slice(-3);
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;
    
    recentReadings.forEach((reading, index) => {
      // 정확도가 높을수록, 최신일수록 높은 가중치
      const accuracyWeight = 1 / Math.max(reading.accuracy, 1);
      const timeWeight = index + 1; // 최신이 더 높은 가중치
      const weight = accuracyWeight * timeWeight;
      
      weightedLat += reading.location.lat * weight;
      weightedLng += reading.location.lng * weight;
      totalWeight += weight;
    });
    
    const smoothedLocation = {
      lat: weightedLat / totalWeight,
      lng: weightedLng / totalWeight,
    };
    
    lastValidLocationRef.current = smoothedLocation;
    return smoothedLocation;
  }, [getDistanceBetweenPoints]);

  // 적응형 GPS 설정 - 정확도에 따라 동적 조정
  const getGPSOptions = useCallback((currentAccuracy: number | null) => {
    // 정확도가 좋으면 덜 자주 업데이트, 나쁘면 더 자주 업데이트
    let maximumAge = 2000; // 기본 2초
    let timeout = 8000; // 기본 8초
    
    if (currentAccuracy !== null) {
      if (currentAccuracy < 10) {
        // 정확도가 매우 좋음 (10m 이하)
        maximumAge = 3000; // 3초
        timeout = 10000; // 10초
      } else if (currentAccuracy > 50) {
        // 정확도가 나쁨 (50m 이상)
        maximumAge = 1000; // 1초
        timeout = 5000; // 5초
      }
    }
    
    return {
      enableHighAccuracy: true,
      timeout,
      maximumAge,
    };
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return null;
    }

    let watchId: number | null = null;
    let isMounted = true;

    setIsWatching(true);
    setError(null);

    const startWatch = () => {
      const options = getGPSOptions(accuracy);
      
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (!isMounted) return;
          
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
            setError(null);
          }
        },
        (err) => {
          if (!isMounted) return;
          
          let errorMessage = '위치 정보를 가져올 수 없습니다.';
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = '위치 정보를 사용할 수 없습니다. GPS가 켜져 있는지 확인해주세요.';
              break;
            case err.TIMEOUT:
              errorMessage = '위치 요청 시간이 초과되었습니다. 다시 시도해주세요.';
              // 타임아웃 시 재시도
              setTimeout(() => {
                if (isMounted) {
                  console.log('GPS 타임아웃 후 재시도...');
                  startWatch();
                }
              }, 2000);
              return;
            default:
              errorMessage = err.message || '알 수 없는 오류가 발생했습니다.';
          }
          
          setError(errorMessage);
          setIsWatching(false);
        },
        options
      );
    };

    startWatch();

    return () => {
      isMounted = false;
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      setIsWatching(false);
      // 히스토리 초기화
      locationHistoryRef.current = [];
      lastValidLocationRef.current = null;
    };
  }, [filterLocation, getGPSOptions, accuracy]);

  useEffect(() => {
    const cleanup = startWatching();
    return cleanup || undefined;
  }, [startWatching]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return false;
    }

    try {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => {
            setError(null);
            resolve(true);
          },
          (err) => {
            let errorMessage = '위치 권한이 필요합니다.';
            
            if (err.code === err.PERMISSION_DENIED) {
              errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
            }
            
            setError(errorMessage);
            resolve(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );
      });
    } catch (err) {
      setError('위치 권한 요청 중 오류가 발생했습니다.');
      return false;
    }
  }, []);

  return { 
    currentLocation, 
    accuracy, 
    error, 
    isWatching,
    requestPermission,
    startWatching,
  };
}