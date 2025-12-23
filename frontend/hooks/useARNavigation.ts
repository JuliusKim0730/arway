import { useState, useCallback, useEffect } from 'react';
import { arNavigationManager } from '../services/ARNavigationManager';
import { useGeolocationWatcher } from './useGeolocationWatcher';

interface Location {
  lat: number;
  lng: number;
}

interface NavigationRoute {
  path: Location[];
  distance: number;
  duration: number;
  instructions: string[];
}

interface NavigationState {
  route: NavigationRoute | null;
  isLoading: boolean;
  error: string | null;
  currentService: 'TMAP' | 'Google Maps' | null;
  isKorea: boolean;
}

export function useARNavigation() {
  const { currentLocation, error: locationError } = useGeolocationWatcher();
  
  const [navigationState, setNavigationState] = useState<NavigationState>({
    route: null,
    isLoading: false,
    error: null,
    currentService: null,
    isKorea: false
  });

  // 현재 위치가 한국인지 확인
  const checkLocationRegion = useCallback((location: Location) => {
    const isKorea = arNavigationManager.checkIsKorea(location.lat, location.lng);
    setNavigationState(prev => ({
      ...prev,
      isKorea,
      currentService: isKorea ? 'TMAP' : 'Google Maps'
    }));
    return isKorea;
  }, []);

  // 현재 위치 변경 시 지역 확인
  useEffect(() => {
    if (currentLocation) {
      checkLocationRegion(currentLocation);
    }
  }, [currentLocation, checkLocationRegion]);

  // 경로 검색 함수 (에러 추적 포함)
  const searchRoute = useCallback(async (destination: Location) => {
    if (!currentLocation) {
      setNavigationState(prev => ({
        ...prev,
        error: '현재 위치를 확인할 수 없습니다. GPS를 켜주세요.'
      }));
      return;
    }

    setNavigationState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      route: null
    }));

    try {
      const route = await arNavigationManager.getDirections(currentLocation, destination);
      
      if (route) {
        setNavigationState(prev => ({
          ...prev,
          route,
          isLoading: false,
          currentService: arNavigationManager.getCurrentService()
        }));
      } else {
        throw new Error('경로를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('경로 검색 오류:', error);
      const errorStatus = arNavigationManager.getErrorStatus();
      
      let errorMessage = error instanceof Error ? error.message : '경로 검색 중 오류가 발생했습니다.';
      
      if (errorStatus.shouldStop) {
        errorMessage = `길찾기 실패: ${errorStatus.maxRetries}번 시도 후 중단됨`;
      }
      
      setNavigationState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      // 3번 실패 시 에러 던지기
      if (errorStatus.shouldStop) {
        throw new Error(errorMessage);
      }
    }
  }, [currentLocation]);

  // 경로 초기화
  const clearRoute = useCallback(() => {
    setNavigationState(prev => ({
      ...prev,
      route: null,
      error: null
    }));
    // 에러 상태도 초기화
    arNavigationManager.resetErrorStatus();
  }, []);

  // TMAP API 키 설정
  const setTmapApiKey = useCallback((apiKey: string) => {
    arNavigationManager.setTmapApiKey(apiKey);
  }, []);

  // Google Maps 초기화
  const initializeGoogleMaps = useCallback(() => {
    arNavigationManager.initializeGoogleMaps();
  }, []);

  // 거리 포맷팅 유틸리티
  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }, []);

  // 시간 포맷팅 유틸리티
  const formatDuration = useCallback((seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes}분`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}시간 ${remainingMinutes}분`;
    }
  }, []);

  return {
    // 상태
    currentLocation,
    route: navigationState.route,
    isLoading: navigationState.isLoading,
    error: navigationState.error || locationError,
    currentService: navigationState.currentService,
    isKorea: navigationState.isKorea,
    
    // 액션
    searchRoute,
    clearRoute,
    setTmapApiKey,
    initializeGoogleMaps,
    
    // 유틸리티
    formatDistance,
    formatDuration,
    checkLocationRegion,
    
    // 에러 상태
    getErrorStatus: () => arNavigationManager.getErrorStatus(),
    resetErrorStatus: () => arNavigationManager.resetErrorStatus()
  };
}