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

  // 위치 필터링 함수 - ARWay 도보 최적화 버전
  const filterLocation = useCallback((newReading: LocationReading): Location | null => {
    const history = locationHistoryRef.current;
    
    // 첫 번째 위치는 그대로 사용
    if (history.length === 0) {
      history.push(newReading);
      lastValidLocationRef.current = newReading.location;
      return newReading.location;
    }
    
    // 적응형 정확도 임계값 (도보용으로 더 엄격하게)
    let accuracyThreshold = 80; // 기본값을 80m로 낮춤
    
    // 최근 위치들의 평균 정확도로 환경 판단
    const recentAccuracies = history.slice(-3).map(h => h.accuracy);
    const avgAccuracy = recentAccuracies.reduce((a, b) => a + b, 0) / recentAccuracies.length;
    
    if (avgAccuracy > 80) {
      // 신호가 약한 환경 (실내/지하) - 여전히 허용하지만 더 엄격
      accuracyThreshold = 150;
    } else if (avgAccuracy < 15) {
      // 신호가 매우 좋은 환경 (야외 개방 공간)
      accuracyThreshold = 50;
    } else if (avgAccuracy < 30) {
      // 신호가 좋은 환경 (일반 야외)
      accuracyThreshold = 60;
    }
    
    // 정확도가 너무 낮으면 무시
    if (newReading.accuracy > accuracyThreshold) {
      console.warn(`GPS 정확도가 너무 낮음: ${newReading.accuracy}m (임계값: ${accuracyThreshold}m)`);
      return lastValidLocationRef.current;
    }
    
    // 이전 위치와의 거리 및 시간 계산
    const lastLocation = history[history.length - 1].location;
    const distance = getDistanceBetweenPoints(lastLocation, newReading.location);
    const timeDiff = (newReading.timestamp - history[history.length - 1].timestamp) / 1000;
    
    // 적응형 속도 제한 (도보용으로 더 타이트하게)
    let maxSpeed = 8; // 기본: 8m/s (28.8km/h) - 도보/조깅 수준
    
    if (timeDiff > 15) {
      // 매우 오랜 시간 후 첫 업데이트 (15초 이상)
      maxSpeed = 30; // 30m/s (108km/h) - 차량 이용 가능성
    } else if (timeDiff > 8) {
      // 오랜 시간 후 업데이트 (8초 이상)
      maxSpeed = 15; // 15m/s (54km/h) - 자전거/대중교통
    } else if (timeDiff > 3) {
      // 지연된 업데이트 (3초 이상)
      maxSpeed = 12; // 12m/s (43.2km/h) - 빠른 이동
    }
    
    // 비현실적인 이동 속도 체크
    if (timeDiff > 0) {
      const currentSpeed = distance / timeDiff;
      
      if (currentSpeed > maxSpeed) {
        console.warn(`비현실적인 이동 속도: ${currentSpeed.toFixed(1)}m/s (제한: ${maxSpeed}m/s)`);
        
        // 완전히 무시하지 않고 속도 제한 적용
        const maxDistance = maxSpeed * timeDiff;
        const ratio = maxDistance / distance;
        
        const limitedLocation = {
          lat: lastLocation.lat + (newReading.location.lat - lastLocation.lat) * ratio,
          lng: lastLocation.lng + (newReading.location.lng - lastLocation.lng) * ratio,
        };
        
        lastValidLocationRef.current = limitedLocation;
        return limitedLocation;
      }
    }
    
    // 히스토리에 추가 (최대 5개 유지)
    history.push(newReading);
    if (history.length > 5) {
      history.shift();
    }
    
    // 가중 평균 스무딩 (정확도 기반)
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
    // 타임아웃 문제 해결을 위해 더 관대한 설정
    let maximumAge = 5000; // 5초로 증가 (캐시된 위치 사용)
    let timeout = 15000; // 15초로 증가
    
    if (currentAccuracy !== null) {
      if (currentAccuracy < 10) {
        // 정확도가 매우 좋음 (10m 이하)
        maximumAge = 8000; // 8초
        timeout = 20000; // 20초
      } else if (currentAccuracy > 100) {
        // 정확도가 매우 나쁨 (100m 이상) - 실내 환경
        maximumAge = 10000; // 10초 (더 오래된 위치도 허용)
        timeout = 30000; // 30초 (더 오래 기다림)
      }
    }
    
    return {
      enableHighAccuracy: true, // GPS 정확도 향상을 위해 true로 변경
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
    let retryCount = 0;
    const maxRetries = 3;

    setIsWatching(true);
    setError(null);

    const startWatch = () => {
      const options = getGPSOptions(accuracy);
      
      console.log(`📍 GPS 시도 ${retryCount + 1}/${maxRetries + 1}:`, options);
      
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (!isMounted) return;
          
          console.log('✅ GPS 위치 수신 성공:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          
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
            retryCount = 0; // 성공 시 재시도 카운트 리셋
          }
        },
        (err) => {
          if (!isMounted) return;
          
          let errorMessage = '위치 정보를 가져올 수 없습니다.';
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
              setError(errorMessage);
              setIsWatching(false);
              return; // 권한 거부는 재시도하지 않음
              
            case err.POSITION_UNAVAILABLE:
              errorMessage = '위치 정보를 사용할 수 없습니다. GPS가 켜져 있는지 확인해주세요.';
              break;
              
            case err.TIMEOUT:
              errorMessage = `GPS 신호 수신 시간 초과 (${retryCount + 1}/${maxRetries + 1})`;
              console.warn(`⏰ GPS 타임아웃 (시도 ${retryCount + 1}):`, err);
              break;
              
            default:
              errorMessage = err.message || '알 수 없는 GPS 오류가 발생했습니다.';
          }
          
          retryCount++;
          
          if (retryCount <= maxRetries) {
            console.log(`🔄 GPS 재시도 ${retryCount}/${maxRetries} (${Math.pow(2, retryCount)}초 후)`);
            setError(`${errorMessage} - ${retryCount}/${maxRetries} 재시도 중...`);
            
            // 지수 백오프로 재시도 (2초, 4초, 8초)
            setTimeout(() => {
              if (isMounted) {
                if (watchId !== null) {
                  navigator.geolocation.clearWatch(watchId);
                }
                startWatch();
              }
            }, Math.pow(2, retryCount) * 1000);
          } else {
            console.error('❌ GPS 최대 재시도 횟수 초과');
            setError(`${errorMessage} - 최대 재시도 횟수를 초과했습니다. 야외로 이동하거나 페이지를 새로고침해주세요.`);
            setIsWatching(false);
          }
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