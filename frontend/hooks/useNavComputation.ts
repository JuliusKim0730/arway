import { useMemo, useState, useEffect, useCallback } from 'react';
import { getDistance, getRhumbLineBearing } from 'geolib';
import { getDirections, isGoogleMapsAvailable, type GoogleMapsRoute, type RouteStep } from '@/lib/googleMaps';

interface Location {
  lat: number;
  lng: number;
}

// 안정적인 네비게이션 계산을 위한 개선된 훅
// Google Maps API 실패 시 직선 경로로 안정적 폴백

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

  // Google Maps API 호출 로직 개선 (오프라인 모드 강화)
  const fetchGoogleRoute = useCallback(async () => {
    if (!currentLocation || !targetLocation) {
      setGoogleRoute(null);
      setRouteLoading(false);
      return;
    }

    // Google Maps API가 사용 불가능하면 즉시 직선 경로 사용
    if (!isGoogleMapsAvailable()) {
      console.log('Google Maps API 키가 없습니다. 직선 경로를 사용합니다.');
      setGoogleRoute(null);
      setUseDirectRoute(true);
      setRouteLoading(false);
      return;
    }

    // 이미 로딩 중이면 중복 호출 방지
    if (routeLoading) return;

    setRouteLoading(true);
    setRouteError(null);
    
    try {
      const route = await getDirections(currentLocation, targetLocation, 'walking');
      setGoogleRoute(route);
      setCurrentStepIndex(0);
      setUseDirectRoute(false);
      setRouteError(null);
      console.log('Google Maps 경로 계산 성공');
    } catch (error) {
      console.warn('Google Maps API 호출 실패, 직선 경로로 폴백:', error);
      
      // 에러 타입에 따른 처리
      let shouldFallback = true;
      let errorMessage = '경로 계산 실패';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // 일시적 오류인 경우 재시도 가능
        if (errorMessage.includes('OVER_QUERY_LIMIT') || 
            errorMessage.includes('REQUEST_DENIED') ||
            errorMessage.includes('네트워크')) {
          shouldFallback = true;
        }
        // API 키 문제나 영구적 오류인 경우 직선 경로 강제 사용
        else if (errorMessage.includes('API 키') || 
                 errorMessage.includes('INVALID_REQUEST')) {
          shouldFallback = true;
        }
      }
      
      if (shouldFallback) {
        setRouteError(errorMessage);
        setGoogleRoute(null);
        setUseDirectRoute(true); // 직선 경로로 강제 폴백
        console.log('직선 경로 모드로 전환됨');
      }
    } finally {
      setRouteLoading(false);
    }
  }, [currentLocation, targetLocation, routeLoading]);

  // Google Maps API 호출 (디바운싱 적용)
  useEffect(() => {
    if (!currentLocation || !targetLocation) {
      setGoogleRoute(null);
      setRouteLoading(false);
      return;
    }

    // 위치 변경 시 500ms 디바운싱
    const timeoutId = setTimeout(() => {
      fetchGoogleRoute();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentLocation, targetLocation, fetchGoogleRoute]);

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
  };
}

