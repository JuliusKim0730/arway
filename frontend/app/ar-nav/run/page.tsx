'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGeolocationWatcher } from '@/hooks/useGeolocationWatcher';
import { useHeading } from '@/hooks/useHeading';
import { useNavComputation } from '@/hooks/useNavComputation';
import { saveNavigationPoint, ApiError } from '@/lib/api';
import { useNavigationStore } from '@/store/navigationStore';
import { ArrowIndicator } from '@/components/ArrowIndicator';
import { RouteStepIndicator } from '@/components/RouteStepIndicator';
import { CurrentLocationButton } from '@/components/CurrentLocationButton';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import { isGoogleMapsAvailable } from '@/lib/googleMaps';
import { useHaptic } from '@/hooks/useHaptic';
import { debugARNav } from '@/lib/debugARNav';
import { SCQIntegration } from '@/components/SCQIntegration';
import { useSCQData } from '@/hooks/useSCQData';
import { ARActionGuidance, POI } from '@/lib/scq/types';
import { decodePolyline } from '@/lib/polyline';

export default function ArNavRunPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { currentLocation, accuracy, error: gpsError, requestPermission } = useGeolocationWatcher();
  const { heading, isCalibrated } = useHeading();
  const { targetLocation, currentSessionId } = useNavigationStore();
  
  const { 
    distance, 
    bearing, 
    relativeAngle, 
    statusText,
    useGoogleMaps,
    routeLoading,
    googleRoute,
    currentStep,
    nextStep,
    currentService,
    isKorea,
    useDirectRoute,
  } = useNavComputation(
    currentLocation,
    targetLocation,
    heading
  );

  const [cameraActive, setCameraActive] = useState(false);
  const [displayedDistance, setDisplayedDistance] = useState<number | null>(null);
  const toast = useToast();
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const haptic = useHaptic();
  
  // SCQ 상태
  const [isIndoor, setIsIndoor] = useState(false);
  const [arAction, setArAction] = useState<ARActionGuidance | null>(null);
  const [recognizedPois, setRecognizedPois] = useState<POI[]>([]);
  
  // SCQ 데이터 로드
  const { geofences, pois: poiDatabase, loading: scqDataLoading } = useSCQData({
    currentLocation: currentLocation || undefined,
    enabled: !!currentLocation,
  });
  
  // 도착 감지 관련 상태
  const arrivalCheckStartRef = useRef<number | null>(null);
  const ARRIVAL_CHECK_DURATION = 2000; // 2초 동안 반경 내 유지 시 도착 처리
  
  // 방향 변경 감지를 위한 ref
  const previousRelativeAngleRef = useRef<number | null>(null);

  // 거리 애니메이션 (부드러운 숫자 변화)
  useEffect(() => {
    if (distance === null) {
      setDisplayedDistance(null);
      return;
    }

    const targetDistance = Math.round(distance);
    const currentDistance = displayedDistance ?? targetDistance;
    
    if (Math.abs(targetDistance - currentDistance) < 1) {
      setDisplayedDistance(targetDistance);
      return;
    }

    const diff = targetDistance - currentDistance;
    const step = Math.sign(diff) * Math.max(1, Math.abs(diff) / 5); // 부드러운 변화
    const newDistance = currentDistance + step;

    const timer = setTimeout(() => {
      setDisplayedDistance(Math.round(newDistance));
    }, 50);

    return () => clearTimeout(timer);
  }, [distance, displayedDistance]);

  // 카메라 정지 함수 (useCallback으로 메모이제이션)
  const stopCamera = useCallback(() => {
    // videoRef의 srcObject에서 스트림 정리
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
    
    // cameraStreamRef의 스트림도 정리
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      cameraStreamRef.current = null;
    }
    
    setCameraActive(false);
  }, []);

  // 카메라 시작 함수 (useCallback으로 메모이제이션)
  const startCamera = useCallback(async () => {
    try {
      // 기존 스트림이 있으면 먼저 정리
      if (cameraStreamRef.current) {
        stopCamera();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // 후면 카메라
      });
      
      // 스트림 참조 저장
      cameraStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        trackEvent(AnalyticsEvents.CAMERA_ACCESS_GRANTED);
      }
    } catch (err) {
      console.error('카메라 접근 실패:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      trackEvent(AnalyticsEvents.CAMERA_ACCESS_DENIED, { error: errorMessage });
      toast.warning('카메라 접근이 거부되었습니다. 카메라 없이도 네비게이션이 가능합니다.');
      // 카메라 없이도 동작 가능하도록 처리
      cameraStreamRef.current = null;
    }
  }, [stopCamera, toast]);

  useEffect(() => {
    let isMounted = true;
    
    const initializeCamera = async () => {
      try {
        await startCamera();
      } catch (err) {
        if (isMounted) {
          console.error('카메라 초기화 실패:', err);
        }
      }
    };

    initializeCamera();

    return () => {
      // cleanup: 컴포넌트 언마운트 시 카메라 스트림 정리
      isMounted = false;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // GPS 에러 처리 및 권한 요청
  useEffect(() => {
    if (gpsError) {
      toast.error(gpsError);
      trackEvent(AnalyticsEvents.GPS_ERROR, { error: gpsError });
    }
  }, [gpsError, toast]);

  // GPS 권한 요청 버튼 핸들러
  const handleRequestGPSPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('위치 권한이 허용되었습니다.');
    } else {
      toast.error('위치 권한이 필요합니다. 브라우저 설정에서 위치 권한을 허용해주세요.');
    }
  };

  // 네비게이션 포인트 저장 함수 (useCallback으로 메모이제이션)
  const saveNavigationPointToAPI = useCallback(async () => {
    if (!currentLocation || !currentSessionId || !targetLocation) return;

    // session_id가 유효한 UUID 형식인지 확인
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(currentSessionId)) {
      console.warn('유효하지 않은 session_id 형식:', currentSessionId);
      return;
    }

    try {
      await saveNavigationPoint({
        session_id: currentSessionId,
        latitude: Number(currentLocation.lat.toFixed(8)), // Decimal 타입 호환을 위해 정밀도 제한
        longitude: Number(currentLocation.lng.toFixed(8)),
        heading: heading !== null ? Number(heading.toFixed(2)) : undefined,
        accuracy: accuracy !== null ? Number(accuracy.toFixed(2)) : undefined,
        distance_to_target: distance !== null ? Number(distance.toFixed(2)) : undefined,
        bearing: bearing !== null ? Number(bearing.toFixed(2)) : undefined,
        relative_angle: relativeAngle !== null ? Number(relativeAngle.toFixed(2)) : undefined,
      });
    } catch (err) {
      // ApiError인 경우 상세 정보 로깅
      if (err instanceof ApiError) {
        // 오프라인 상태는 조용히 처리 (사용자에게 알리지 않음)
        if (err.isOffline) {
          console.warn('네비게이션 포인트 저장 실패 (오프라인):', err.message);
          return;
        }
        // 재시도 가능한 에러는 조용히 처리
        if (err.isRetryable) {
          console.warn('네비게이션 포인트 저장 실패 (재시도 가능):', err.message);
          return;
        }
        // 422 에러 (검증 실패)는 데이터 형식 문제일 수 있음
        if (err.statusCode === 422) {
          console.warn('네비게이션 포인트 저장 실패 (데이터 검증 실패):', err.message);
          return;
        }
      }
      // 기타 에러는 로깅만 수행 (사용자에게 알리지 않음 - 백그라운드 작업)
      console.error('네비게이션 포인트 저장 실패:', err);
    }
  }, [currentLocation, currentSessionId, targetLocation, heading, accuracy, distance, bearing, relativeAngle]);

  // 디바운싱을 위한 ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentLocation && currentSessionId && targetLocation) {
      // 디바운싱: 1초마다만 저장
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveNavigationPointToAPI();
        saveTimeoutRef.current = null;
      }, 1000);
    }

    return () => {
      // cleanup: 컴포넌트 언마운트 또는 의존성 변경 시 타이머 정리
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [currentLocation, currentSessionId, targetLocation, saveNavigationPointToAPI]);

  // GPS 정확도 기반 동적 도착 반경 계산
  const getArrivalThreshold = useCallback(() => {
    // 기본 임계값: 5m
    const baseThreshold = 5;
    
    // GPS 정확도가 있으면 이를 고려하여 조정
    if (accuracy !== null) {
      // 정확도가 낮을수록(값이 클수록) 임계값을 더 크게 설정
      // 정확도가 10m 이하면 기본값 사용
      // 정확도가 10m~30m면 1.5배, 30m 이상이면 2배
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
            final_distance: distance,
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

  // 방향 변경 감지 및 햅틱 피드백
  useEffect(() => {
    if (relativeAngle === null || previousRelativeAngleRef.current === null) {
      previousRelativeAngleRef.current = relativeAngle;
      return;
    }

    // 방향 변경이 30도 이상일 때만 진동
    const angleDiff = Math.abs(relativeAngle - previousRelativeAngleRef.current);
    if (angleDiff > 30) {
      haptic.medium();
    }

    previousRelativeAngleRef.current = relativeAngle;
  }, [relativeAngle, haptic]);

  useEffect(() => {
    // 네비게이션 시작 이벤트
    if (currentLocation && targetLocation && currentSessionId) {
      trackEvent(AnalyticsEvents.NAVIGATION_STARTED, {
        start_latitude: currentLocation.lat,
        start_longitude: currentLocation.lng,
        target_latitude: targetLocation.lat,
        target_longitude: targetLocation.lng,
      });
    }
  }, [currentLocation, targetLocation, currentSessionId]); // 의존성 배열 수정

  // 개발 모드에서 디버그 함수 전역 등록
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).debugARNav = debugARNav;
      console.log('💡 디버그 모드: 콘솔에서 debugARNav() 실행하여 기능 상태 확인');
    }
  }, []);

  const handleTestArrival = () => {
    router.push('/ar-nav/arrived');
  };

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
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">카메라 로딩 중...</p>
            </div>
          </div>
        )}
      </div>

      {/* 카메라 오버레이 배경 (어두운 그라데이션) - z-5 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-5 pointer-events-none" />

      {/* 상단 HUD - 카메라 위 오버레이 (z-30) */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm p-3 sm:p-4 z-30" role="region" aria-label="네비게이션 정보">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1 sm:gap-2">
              <p 
                className="text-3xl sm:text-4xl font-bold text-white transition-all duration-300" 
                aria-live="polite" 
                aria-atomic="true"
                style={{
                  color: displayedDistance !== null && displayedDistance < 20 
                    ? 'rgb(74, 222, 128)' // green-400
                    : displayedDistance !== null && displayedDistance < 100
                    ? 'rgb(96, 165, 250)' // blue-400
                    : 'white'
                }}
              >
                <span className="sr-only">남은 거리: </span>
                {displayedDistance !== null ? displayedDistance : '--'}
              </p>
              <span className="text-base sm:text-lg text-gray-300" aria-hidden="true">m</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 mt-1" aria-live="polite">
              {statusText}
              {/* 서비스 표시 개선 */}
              {currentService === 'TMAP' && (
                <span className="ml-2 text-xs text-green-400" aria-label="TMAP 경로 사용">
                  🇰🇷 TMAP
                </span>
              )}
              {currentService === 'Google Maps' && (
                <span className="ml-2 text-xs text-blue-400" aria-label="Google Maps 경로 사용">
                  🌍 Google Maps
                </span>
              )}
              {currentService === 'Direct' && (
                <span className="ml-2 text-xs text-orange-400" aria-label="직선 경로 사용">
                  📍 직선 경로
                </span>
              )}
              {routeLoading && (
                <span className="ml-2 text-xs text-yellow-400" aria-label="경로 계산 중">
                  ⏳
                </span>
              )}
            </p>
            {/* 현재 단계 정보 표시 */}
            {currentStep && useGoogleMaps && (
              <div className="mt-2 text-xs text-blue-300 bg-blue-900/30 px-2 py-1 rounded">
                <span className="font-semibold">현재 단계:</span> {currentStep.instruction}
                {currentStep.distance < 1000 && (
                  <span className="ml-2">({Math.round(currentStep.distance)}m)</span>
                )}
              </div>
            )}
            {/* 다음 단계 미리보기 */}
            {nextStep && useGoogleMaps && (
              <div className="mt-1 text-xs text-gray-400">
                다음: {nextStep.instruction}
              </div>
            )}
            {heading !== null && (
              <p className="text-xs text-gray-400 mt-1 hidden sm:block">
                방향: {Math.round(heading)}° {!isCalibrated && '(보정 중...)'}
              </p>
            )}
            {!isCalibrated && heading !== null && (
              <p className="text-xs text-yellow-400 mt-1">
                📱 기기를 8자 모양으로 움직여 나침반을 보정하세요
              </p>
            )}
            {isGoogleMapsAvailable() && (
              <p className="text-xs text-green-400 mt-1">
                Google Maps API 활성화됨
              </p>
            )}
            {gpsError && (
              <button
                onClick={handleRequestGPSPermission}
                className="mt-2 text-xs text-yellow-400 hover:text-yellow-300 underline"
              >
                위치 권한 요청
              </button>
            )}
          </div>
          <div className="text-right ml-2">
            <div className="text-xs text-gray-400">
              정확도: {accuracy !== null ? `${Math.round(accuracy)}m` : '--'}
            </div>
            {currentLocation && (
              <div className="text-xs text-gray-500 mt-1 hidden sm:block">
                {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
              </div>
            )}
            {bearing !== null && (
              <div className="text-xs text-gray-400 mt-1 hidden sm:block">
                방위각: {Math.round(bearing)}°
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 중앙 화살표 - 카메라 위 오버레이 */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none" role="img" aria-label={`목적지 방향: ${relativeAngle !== null ? Math.round(relativeAngle) : 0}도`}>
        <ArrowIndicator 
          angle={relativeAngle} 
          distance={distance}
        />
      </div>

      {/* SCQ 통합 */}
      <SCQIntegration
        route={googleRoute ? {
          steps: googleRoute.steps.map(step => ({
            distance: step.distance || 0,
            instruction: step.instruction || '',
            startLocation: {
              lat: step.startLocation.lat,
              lng: step.startLocation.lng,
            },
            endLocation: {
              lat: step.endLocation.lat,
              lng: step.endLocation.lng,
            },
            bearing: step.bearing || 0,
          })),
          polyline: googleRoute.polyline ? 
            decodePolyline(googleRoute.polyline) : undefined,
        } : undefined}
        geofences={geofences}
        poiDatabase={poiDatabase}
        userGoal={targetLocation ? {
          // 목적지 POI ID는 나중에 확장 가능
        } : undefined}
        onIndoorModeChange={(indoor) => {
          setIsIndoor(indoor);
          if (indoor) {
            toast.info('실내 모드로 전환되었습니다');
            trackEvent(AnalyticsEvents.INDOOR_MODE_ACTIVATED);
          }
        }}
        onARActionChange={(action) => {
          setArAction(action);
        }}
        onPOIChange={(pois) => {
          setRecognizedPois(pois);
        }}
      />
      
      {/* SCQ AR 행동 지시 표시 */}
      {arAction && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-6 py-4 rounded-lg z-30 max-w-sm">
          <div className="text-2xl font-bold mb-2 text-center">
            {arAction.action === 'GO_STRAIGHT' && '⬆️'}
            {arAction.action === 'TURN_LEFT' && '⬅️'}
            {arAction.action === 'TURN_RIGHT' && '➡️'}
            {arAction.action === 'TAKE_ESCALATOR' && '🔼'}
            {arAction.action === 'TAKE_ELEVATOR' && '🛗'}
            {arAction.action === 'GO_UPSTAIRS' && '⬆️'}
            {arAction.action === 'GO_DOWNSTAIRS' && '⬇️'}
            {arAction.action === 'ENTER' && '🚪'}
            {arAction.action === 'EXIT' && '🚪'}
          </div>
          <div className="text-lg text-center">{arAction.description || arAction.action}</div>
          {arAction.distanceToAction > 0 && (
            <div className="text-sm text-gray-300 mt-1 text-center">
              {Math.round(arAction.distanceToAction)}m
            </div>
          )}
        </div>
      )}
      
      {/* 실내 모드 표시 - 카메라 위 오버레이 (z-30) */}
      {isIndoor && (
        <div className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur-md text-white px-4 py-2 rounded-lg z-30 flex items-center gap-2 border border-blue-400/30 shadow-lg">
          <span>🏢</span>
          <span className="font-semibold">실내 모드</span>
        </div>
      )}
      
      {/* 인식된 POI 표시 - 카메라 위 오버레이 (z-30) */}
      {recognizedPois.length > 0 && isIndoor && (
        <div className="absolute top-20 right-4 bg-gray-800/90 backdrop-blur-md text-white p-4 rounded-lg z-30 max-w-xs max-h-64 overflow-y-auto border border-white/20 shadow-2xl">
          <h3 className="font-bold mb-2 text-sm">주변 장소</h3>
          {recognizedPois.slice(0, 5).map((poi) => (
            <div key={poi.id} className="mb-2 p-2 bg-gray-700 rounded text-sm">
              <div className="font-medium">{poi.name}</div>
              <div className="text-xs text-gray-400">{poi.type}</div>
            </div>
          ))}
        </div>
      )}
      
      {/* 경로 단계 안내 (카메라 위 오버레이) - z-25 */}
      {useGoogleMaps && !arAction && (
        <div className="z-[25]">
          <RouteStepIndicator 
            currentStep={currentStep}
            nextStep={nextStep}
            distance={distance}
          />
        </div>
      )}

      {/* 하단 컨트롤 - 카메라 위 오버레이 */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-4 sm:p-6 z-30 safe-area-inset-bottom">
        {/* 현재 위치 찾기 버튼 (작은 버튼) */}
        <div className="mb-3 flex justify-center">
          <CurrentLocationButton
            className="text-xs"
            onLocationFound={(location) => {
              toast.success(`현재 위치 업데이트됨 (정확도: ${accuracy ? Math.round(accuracy) : '--'}m)`);
              trackEvent(AnalyticsEvents.GPS_LOCATION_FOUND, {
                latitude: location.lat,
                longitude: location.lng,
                accuracy: accuracy || undefined,
              });
            }}
          />
        </div>
        
        <div className="flex gap-3 sm:gap-4">
          <Link
            href="/ar-nav/select"
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-3 sm:px-4 rounded-lg transition-colors text-center focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-black text-sm sm:text-base touch-manipulation"
            aria-label="뒤로 가기"
          >
            뒤로
          </Link>
          <button
            onClick={handleTestArrival}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-3 sm:px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black text-sm sm:text-base touch-manipulation"
            aria-label="도착 테스트 (개발용)"
          >
            도착 테스트
          </button>
        </div>
      </div>

      {/* Toast 알림 */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}

