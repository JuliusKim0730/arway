import { useState, useCallback } from 'react';

interface Location {
  lat: number;
  lng: number;
}

interface UseCurrentLocationReturn {
  currentLocation: Location | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<void>;
  clearLocation: () => void;
}

/**
 * 현재 위치를 찾는 훅
 * 버튼 클릭 등으로 수동으로 위치를 가져올 때 사용
 */
export function useCurrentLocation(): UseCurrentLocationReturn {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('이 브라우저는 위치 서비스를 지원하지 않습니다. 지도에서 수동으로 위치를 선택해주세요.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // 노트북/데스크톱에서는 enableHighAccuracy를 false로 설정 (WiFi/IP 기반 위치 사용)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setAccuracy(position.coords.accuracy);
        setLoading(false);
        setError(null);
      },
      (err) => {
        let errorMessage = '위치를 찾을 수 없습니다.';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용하거나, 지도에서 수동으로 위치를 선택해주세요.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다. 노트북/데스크톱에서는 지도에서 수동으로 위치를 선택해주세요.';
            break;
          case err.TIMEOUT:
            errorMessage = '위치 요청 시간이 초과되었습니다. 지도에서 수동으로 위치를 선택해주세요.';
            break;
          default:
            errorMessage = err.message || '위치를 찾을 수 없습니다. 지도에서 수동으로 위치를 선택해주세요.';
        }
        
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: isMobile, // 모바일에서만 GPS 사용, 노트북에서는 WiFi/IP 기반
        timeout: isMobile ? 15000 : 10000, // 모바일: 15초, 노트북: 10초
        maximumAge: isMobile ? 0 : 60000, // 노트북에서는 1분 캐시 허용
      }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setCurrentLocation(null);
    setAccuracy(null);
    setError(null);
  }, []);

  return {
    currentLocation,
    accuracy,
    loading,
    error,
    getCurrentLocation,
    clearLocation,
  };
}

