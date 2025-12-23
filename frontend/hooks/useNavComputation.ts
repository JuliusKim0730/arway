import { useMemo, useState, useEffect, useCallback } from 'react';
import { getDistance, getRhumbLineBearing } from 'geolib';
import { getDirections, isGoogleMapsAvailable, type GoogleMapsRoute, type RouteStep } from '@/lib/googleMaps';
import { arNavigationManager } from '@/services/ARNavigationManager';

interface Location {
  lat: number;
  lng: number;
}

// 안정적인 네비게이션 계산을 위한 개선된 훅
// 한국: TMAP API, 해외: Google Maps API, 실패 시: 직선 경로 폴백

export function useNavComputation(
  currentLocation: Location | null,
  targetLocation: Location | null,
  heading: number | null
) {
  const [googleRoute, setGoogleRoute] = useState<GoogleMapsRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [useDirectRoute, setUseDirectRoute] = useState(false); // 직선 경로 강제 사용 플래그
  const [currentService, setCurrentService] = useState<'TMAP' | 'Google Maps' | 'Direct'>('Direct');
  const [isKorea, setIsKorea] = useState(false);

  // 위치 기반 서비스 선택
  const determineService = useCallback((location: Location) => {
    // 사용자가 수동으로 선택한 서비스 확인
    const preferredService = typeof window !== 'undefined' ? localStorage.getItem('preferredService') : null;
    
    if (preferredService === 'TMAP') {
      console.log('🇰🇷 사용자 선택: TMAP 강제 사용');
      setIsKorea(true);
      setCurrentService('TMAP');
      return 'TMAP';
    }
    
    if (preferredService === 'Google Maps') {
      console.log('🌍 사용자 선택: Google Maps 강제 사용');
      setIsKorea(false);
      setCurrentService('Google Maps');
      return 'Google Maps';
    }
    
    // 자동 선택 (기존 로직)
    const koreaCheck = arNavigationManager.checkIsKorea(location.lat, location.lng);
    setIsKorea(koreaCheck);
    
    // TMAP API 키 확인
    const nextTmapKey = process.env.NEXT_PUBLIC_TMAP_API_KEY;
    const reactTmapKey = process.env.REACT_APP_TMAP_API_KEY;
    const hasTmapKey = !!(nextTmapKey || reactTmapKey);
    
    if (koreaCheck && hasTmapKey) {
      setCurrentService('TMAP');
      return 'TMAP';
    } else if (!koreaCheck && isGoogleMapsAvailable()) {
      setCurrentService('Google Maps');
      return 'Google Maps';
    } else {
      setCurrentService('Direct');
      return 'Direct';
    }
  }, []);

  // 직선 거리 및 방향 계산 (항상 사용 가능한 폴백)
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

  // 통합 경로 계산 (TMAP + Google Maps + 직선 경로)
  const fetchRoute = useCallback(async () => {
    if (!currentLocation || !targetLocation) {
      setGoogleRoute(null);
      setRouteLoading(false);
      return;
    }

    // 이미 로딩 중이면 중복 호출 방지
    if (routeLoading) return;

    setRouteLoading(true);
    setRouteError(null);
    
    // 서비스 결정
    const selectedService = determineService(currentLocation);
    console.log(`🎯 선택된 서비스: ${selectedService} (한국: ${isKorea})`);
    
    try {
      if (selectedService === 'TMAP') {
        // TMAP API 사용
        console.log('🇰🇷 TMAP API로 경로 계산 시작');
        const tmapRoute = await arNavigationManager.getDirections(currentLocation, targetLocation);
        
        if (tmapRoute) {
          // TMAP 결과를 Google Maps 형식으로 변환
          const convertedRoute: GoogleMapsRoute = {
            distance: tmapRoute.distance,
            duration: tmapRoute.duration,
            steps: tmapRoute.instructions.map((instruction, index) => ({
              distance: Math.round(tmapRoute.distance / tmapRoute.instructions.length),
              duration: Math.round(tmapRoute.duration / tmapRoute.instructions.length),
              instruction: instruction,
              startLocation: tmapRoute.path[index] || currentLocation,
              endLocation: tmapRoute.path[index + 1] || targetLocation,
              bearing: 0 // TMAP에서 방향 정보가 없으므로 기본값
            })),
            polyline: '', // TMAP에서 polyline 정보가 없으므로 빈 문자열
            startLocation: currentLocation,
            endLocation: targetLocation,
            initialBearing: 0 // 기본값
          };
          
          setGoogleRoute(convertedRoute);
          setCurrentStepIndex(0);
          setUseDirectRoute(false);
          console.log('✅ TMAP 경로 계산 성공');
          return;
        }
      } else if (selectedService === 'Google Maps') {
        // Google Maps API 사용
        console.log('🌍 Google Maps API로 경로 계산 시작');
        const route = await getDirections(currentLocation, targetLocation, 'walking');
        setGoogleRoute(route);
        setCurrentStepIndex(0);
        setUseDirectRoute(false);
        console.log('✅ Google Maps 경로 계산 성공');
        return;
      }
      
      // 직선 경로 폴백
      throw new Error('API 서비스를 사용할 수 없습니다');
      
    } catch (error) {
      console.warn(`${selectedService} API 호출 실패, 직선 경로로 폴백:`, error);
      
      let errorMessage = '경로 계산 실패';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setRouteError(errorMessage);
      setGoogleRoute(null);
      setUseDirectRoute(true);
      setCurrentService('Direct');
      console.log('📍 직선 경로 모드로 전환됨');
    } finally {
      setRouteLoading(false);
    }
  }, [currentLocation, targetLocation, routeLoading, determineService]);

  // 통합 경로 호출 (디바운싱 적용)
  useEffect(() => {
    if (!currentLocation || !targetLocation) {
      setGoogleRoute(null);
      setRouteLoading(false);
      return;
    }

    // 위치 변경 시 500ms 디바운싱
    const timeoutId = setTimeout(() => {
      fetchRoute();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentLocation, targetLocation, fetchRoute]);

  // 현재 위치에 가장 가까운 경로 단계 찾기 (단순화된 로직)
  const findCurrentStep = useCallback(() => {
    if (!googleRoute || !currentLocation || googleRoute.steps.length === 0 || useDirectRoute) {
      return 0;
    }

    // 현재 단계의 끝점까지 거리가 20m 이하면 다음 단계로
    const currentStep = googleRoute.steps[currentStepIndex];
    if (currentStep) {
      const distanceToStepEnd = getDistance(
        { latitude: currentLocation.lat, longitude: currentLocation.lng },
        { latitude: currentStep.endLocation.lat, longitude: currentStep.endLocation.lng }
      );
      
      // 20m 이내에 도달하고 다음 단계가 있으면 진행
      if (distanceToStepEnd < 20 && currentStepIndex < googleRoute.steps.length - 1) {
        return currentStepIndex + 1;
      }
    }
    
    return currentStepIndex;
  }, [googleRoute, currentLocation, currentStepIndex, useDirectRoute]);

  // 단계 업데이트
  useEffect(() => {
    const newStepIndex = findCurrentStep();
    if (newStepIndex !== currentStepIndex) {
      setCurrentStepIndex(newStepIndex);
    }
  }, [findCurrentStep, currentStepIndex]);

  // 메인 계산 로직 (단순화 및 안정화) - 오프라인 모드 강화
  const { distance, bearing, relativeAngle, statusText, useGoogleMaps, currentStep, nextStep } = useMemo(() => {
    if (!currentLocation || !targetLocation || !straightLineData) {
      return {
        distance: null,
        bearing: null,
        relativeAngle: null,
        statusText: '위치 정보를 가져오는 중...',
        useGoogleMaps: false,
        currentStep: null,
        nextStep: null,
      };
    }

    // Google Maps 사용 여부 결정 (오프라인 모드 고려)
    const shouldUseGoogle = !useDirectRoute && 
                           googleRoute !== null && 
                           !routeLoading && 
                           googleRoute.steps.length > 0 &&
                           isGoogleMapsAvailable(); // API 키 재확인
    
    let dist: number;
    let bear: number;
    let currentStepData = null;
    let nextStepData = null;

    if (shouldUseGoogle) {
      // Google Maps 경로 사용
      currentStepData = googleRoute.steps[currentStepIndex] || googleRoute.steps[0];
      nextStepData = googleRoute.steps[currentStepIndex + 1] || null;
      
      // 현재 단계의 끝 지점까지의 거리
      const distanceToStepEnd = getDistance(
        { latitude: currentLocation.lat, longitude: currentLocation.lng },
        { latitude: currentStepData.endLocation.lat, longitude: currentStepData.endLocation.lng }
      );
      
      // 남은 총 거리 계산
      let remainingDistance = distanceToStepEnd;
      for (let i = currentStepIndex + 1; i < googleRoute.steps.length; i++) {
        remainingDistance += googleRoute.steps[i].distance;
      }
      
      dist = remainingDistance;
      bear = currentStepData.bearing;
    } else {
      // 직선 경로 사용 (안정적 폴백 - 오프라인에서도 동작)
      dist = straightLineData.distance;
      bear = straightLineData.bearing;
    }

    // 상대 각도 계산 (안정화)
    let relAngle = null;
    if (heading !== null) {
      relAngle = bear - heading;
      // -180 ~ 180 범위로 정규화
      while (relAngle > 180) relAngle -= 360;
      while (relAngle < -180) relAngle += 360;
    }

    // 상태 텍스트 결정 (오프라인 모드 표시 포함)
    let status = '경로 계산 중...';
    
    if (routeLoading) {
      status = 'Google Maps 경로 계산 중...';
    } else if (dist < 5) {
      status = '도착 근처입니다';
    } else if (shouldUseGoogle && currentStepData) {
      // Google Maps 안내 문구 사용
      status = currentStepData.instruction;
    } else if (relAngle !== null) {
      // 직선 경로 방향 안내 (오프라인 모드)
      const absAngle = Math.abs(relAngle);
      if (absAngle < 15) {
        status = useDirectRoute ? '직진하세요 (직선 경로)' : '직진하세요';
      } else if (absAngle < 45) {
        status = relAngle > 0 ? '약간 우회전' : '약간 좌회전';
      } else if (absAngle < 135) {
        status = relAngle > 0 ? '우회전' : '좌회전';
      } else {
        status = '뒤돌아서 가세요';
      }
      
      // 오프라인 모드 표시
      if (useDirectRoute && !isGoogleMapsAvailable()) {
        status += ' (오프라인 모드)';
      }
    } else {
      status = '방향을 확인하세요';
    }

    return {
      distance: dist,
      bearing: bear,
      relativeAngle: relAngle,
      statusText: status,
      useGoogleMaps: shouldUseGoogle,
      currentStep: currentStepData,
      nextStep: nextStepData,
    };
  }, [currentLocation, targetLocation, heading, googleRoute, routeLoading, straightLineData, currentStepIndex, useDirectRoute]);

  return { 
    distance, 
    bearing, 
    relativeAngle, 
    statusText,
    useGoogleMaps,
    routeLoading,
    routeError,
    googleRoute,
    currentStep,
    nextStep,
    currentService,
    isKorea,
    useDirectRoute,
  };
}

