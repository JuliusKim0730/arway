import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useARNavigation } from '../hooks/useARNavigation';
import { TmapApiValidator } from '../utils/tmapApiValidator';

interface Location {
  lat: number;
  lng: number;
}

interface TmapNavigationComponentProps {
  onNavigationStart?: (route: any) => void;
  onNavigationError?: (error: string) => void;
  onBackToMain?: () => void;
}

declare global {
  interface Window {
    Tmapv2: any;
  }
}

export const TmapNavigationComponent: React.FC<TmapNavigationComponentProps> = ({
  onNavigationStart,
  onNavigationError,
  onBackToMain
}) => {
  const {
    currentLocation,
    route,
    isLoading,
    error,
    currentService,
    isKorea,
    searchRoute,
    clearRoute,
    formatDistance,
    formatDuration
  } = useARNavigation();

  const mapRef = useRef<HTMLDivElement>(null);
  const tmapRef = useRef<any>(null);
  const [startPoint, setStartPoint] = useState<Location | null>(null);
  const [endPoint, setEndPoint] = useState<Location | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [searchStep, setSearchStep] = useState<'start' | 'end' | 'ready'>('start');
  const [errorCount, setErrorCount] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // TMAP API 로드
  const loadTmapAPI = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // 이미 로드된 경우
      if (window.Tmapv2) {
        console.log('✅ TMAP API 이미 로드됨');
        resolve();
        return;
      }

      // 환경변수에서 API 키 가져오기 (Vite 방식)
      const viteApiKey = (import.meta.env as any)?.VITE_TMAP_API_KEY;
      const reactApiKey = process.env.REACT_APP_TMAP_API_KEY;
      const apiKey = viteApiKey || reactApiKey;
      
      console.log('🔑 API 키 확인:', {
        viteKey: viteApiKey ? '설정됨' : '설정되지 않음',
        reactKey: reactApiKey ? '설정됨' : '설정되지 않음',
        finalKey: apiKey ? `${apiKey.substring(0, 4)}...` : '없음'
      });
      
      if (!apiKey || apiKey === 'YOUR_TMAP_API_KEY_HERE') {
        reject(new Error('TMAP API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요.'));
        return;
      }

      console.log('📡 TMAP JavaScript API 스크립트 로딩 시작...');

      // 기존 스크립트 제거 (중복 방지)
      const existingScript = document.querySelector('script[src*="apis.openapi.sk.com/tmap/jsv2"]');
      if (existingScript) {
        console.log('🔄 기존 TMAP 스크립트 제거');
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = `https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${apiKey}`;
      script.async = true;
      script.defer = true;
      
      // 타임아웃 설정 (30초)
      const timeout = setTimeout(() => {
        reject(new Error('TMAP API 로딩 타임아웃 (30초)'));
      }, 30000);
      
      script.onload = () => {
        clearTimeout(timeout);
        
        // 로드 후 잠시 대기 (API 초기화 시간)
        setTimeout(() => {
          if (window.Tmapv2) {
            console.log('✅ TMAP JavaScript API 로드 및 초기화 완료');
            console.log('📋 사용 가능한 TMAP 객체:', Object.keys(window.Tmapv2));
            resolve();
          } else {
            reject(new Error('TMAP API 로드 실패: Tmapv2 객체를 찾을 수 없습니다.'));
          }
        }, 1000);
      };
      
      script.onerror = (error) => {
        clearTimeout(timeout);
        console.error('❌ TMAP 스크립트 로드 오류:', error);
        reject(new Error('TMAP 스크립트 로드 실패: 네트워크 오류 또는 잘못된 API 키'));
      };
      
      document.head.appendChild(script);
      console.log('📡 TMAP 스크립트 태그 추가됨:', script.src);
    });
  }, []);

  // TMAP 지도 초기화
  const initializeTmapMap = useCallback(async () => {
    if (!mapRef.current) {
      console.error('❌ 지도 컨테이너 ref가 없습니다.');
      return;
    }
    
    if (!currentLocation) {
      console.error('❌ 현재 위치가 없습니다.');
      return;
    }

    console.log('🗺️ TMAP 지도 초기화 시작:', currentLocation);

    try {
      console.log('📡 TMAP API 로딩 시작...');
      await loadTmapAPI();
      console.log('✅ TMAP API 로딩 완료');
      
      // Tmapv2 객체 확인
      if (!window.Tmapv2) {
        throw new Error('window.Tmapv2 객체가 존재하지 않습니다.');
      }
      
      console.log('🗺️ TMAP 지도 객체 생성 중...');
      
      // 지도 컨테이너 초기화
      mapRef.current.innerHTML = '';
      
      const map = new window.Tmapv2.Map(mapRef.current, {
        center: new window.Tmapv2.LatLng(currentLocation.lat, currentLocation.lng),
        width: '100%',
        height: '400px',
        zoom: 15,
        zoomControl: true,
        scrollwheel: true
      });

      console.log('✅ TMAP 지도 객체 생성 완료');

      // 현재 위치 마커 추가
      try {
        const currentMarker = new window.Tmapv2.Marker({
          position: new window.Tmapv2.LatLng(currentLocation.lat, currentLocation.lng),
          icon: 'https://tmapapi.sktelecom.com/upload/tmap/marker/pin_r_m_s.png',
          iconSize: new window.Tmapv2.Size(24, 38),
          title: '현재 위치'
        });
        currentMarker.setMap(map);
        console.log('✅ 현재 위치 마커 추가 완료');
      } catch (markerError) {
        console.warn('⚠️ 마커 추가 실패:', markerError);
      }

      // 지도 클릭 이벤트
      map.addListener('click', (evt: any) => {
        try {
          const latLng = evt.latLng;
          const location = {
            lat: latLng.lat(),
            lng: latLng.lng()
          };

          console.log('🖱️ 지도 클릭:', location);

          if (searchStep === 'start') {
            setStartPoint(location);
            addMarker(map, location, '출발지', 'start');
            setSearchStep('end');
          } else if (searchStep === 'end') {
            setEndPoint(location);
            addMarker(map, location, '도착지', 'end');
            setSearchStep('ready');
          }
        } catch (clickError) {
          console.error('❌ 지도 클릭 이벤트 오류:', clickError);
        }
      });

      tmapRef.current = map;
      setIsMapReady(true);
      console.log('🎉 TMAP 지도 초기화 완료!');
      
    } catch (error) {
      console.error('❌ TMAP 지도 초기화 실패:', error);
      handleNavigationError(`TMAP 지도를 로드할 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }, [currentLocation, searchStep]);

  // 마커 추가 함수
  const addMarker = (map: any, location: Location, title: string, type: 'start' | 'end' | 'current') => {
    let iconUrl = 'https://tmapapi.sktelecom.com/upload/tmap/marker/pin_b_m_s.png';
    
    if (type === 'start') {
      iconUrl = 'https://tmapapi.sktelecom.com/upload/tmap/marker/pin_g_m_s.png';
    } else if (type === 'end') {
      iconUrl = 'https://tmapapi.sktelecom.com/upload/tmap/marker/pin_r_m_s.png';
    }

    const marker = new window.Tmapv2.Marker({
      position: new window.Tmapv2.LatLng(location.lat, location.lng),
      icon: iconUrl,
      iconSize: new window.Tmapv2.Size(24, 38),
      title: title
    });
    marker.setMap(map);
  };

  // 내 위치로 이동
  const moveToMyLocation = useCallback(() => {
    if (tmapRef.current && currentLocation) {
      tmapRef.current.setCenter(new window.Tmapv2.LatLng(currentLocation.lat, currentLocation.lng));
      tmapRef.current.setZoom(16);
    }
  }, [currentLocation]);

  // 내 위치를 시작점으로 설정
  const setMyLocationAsStart = useCallback(() => {
    if (currentLocation) {
      setStartPoint(currentLocation);
      if (tmapRef.current) {
        addMarker(tmapRef.current, currentLocation, '출발지 (내 위치)', 'start');
      }
      setSearchStep('end');
    }
  }, [currentLocation]);

  // 길찾기 실행
  const handleRouteSearch = async () => {
    if (!startPoint || !endPoint) {
      handleNavigationError('출발지와 도착지를 모두 설정해주세요.');
      return;
    }

    setIsNavigating(true);
    
    try {
      await searchRoute(endPoint);
      
      if (route) {
        console.log('✅ 경로 검색 성공:', route);
        if (onNavigationStart) {
          onNavigationStart(route);
        }
        setErrorCount(0);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '경로 검색 실패';
      handleNavigationError(errorMessage);
    } finally {
      setIsNavigating(false);
    }
  };

  // 에러 처리
  const handleNavigationError = (errorMessage: string) => {
    const newErrorCount = errorCount + 1;
    setErrorCount(newErrorCount);
    
    console.error(`네비게이션 오류 (${newErrorCount}/3):`, errorMessage);
    
    if (newErrorCount >= 3) {
      alert(`길찾기를 3번 시도했지만 실패했습니다.\n마지막 오류: ${errorMessage}\n\n이전 화면으로 돌아갑니다.`);
      if (onBackToMain) {
        onBackToMain();
      }
      return;
    }
    
    // TMAP 로딩 실패 시 Google Maps 폴백 제안
    if (errorMessage.includes('TMAP') && newErrorCount === 1) {
      const useGoogleMaps = confirm(
        `TMAP 지도 로딩에 실패했습니다.\n\n대신 Google Maps를 사용하시겠습니까?\n\n확인: Google Maps 사용\n취소: TMAP 재시도`
      );
      
      if (useGoogleMaps) {
        // Google Maps로 전환하는 로직 (향후 구현)
        alert('Google Maps 지도는 향후 업데이트에서 지원될 예정입니다.\n현재는 TMAP만 지원됩니다.');
      }
    }
    
    if (onNavigationError) {
      onNavigationError(`${errorMessage} (${newErrorCount}/3 시도)`);
    }
  };

  // 초기화
  const resetNavigation = () => {
    setStartPoint(null);
    setEndPoint(null);
    setSearchStep('start');
    setErrorCount(0);
    clearRoute();
    
    if (tmapRef.current) {
      tmapRef.current.destroy();
      tmapRef.current = null;
      setIsMapReady(false);
    }
  };

  // 컴포넌트 마운트 시 지도 초기화
  useEffect(() => {
    if (currentLocation && !isMapReady) {
      // API 키 검증 먼저 실행
      const runApiValidation = async () => {
        const viteApiKey = (import.meta.env as any)?.VITE_TMAP_API_KEY;
        const reactApiKey = process.env.REACT_APP_TMAP_API_KEY;
        const apiKey = viteApiKey || reactApiKey;

        if (apiKey) {
          console.log('🧪 TMAP API 검증 시작...');
          const testResults = await TmapApiValidator.runFullTest(apiKey);
          
          if (testResults.keyValidation.isValid && testResults.jsApiTest.success) {
            console.log('✅ TMAP API 검증 성공, 지도 초기화 진행');
            initializeTmapMap();
          } else {
            console.error('❌ TMAP API 검증 실패:', testResults);
            handleNavigationError(`TMAP API 검증 실패: ${testResults.jsApiTest.message}`);
          }
        } else {
          handleNavigationError('TMAP API 키가 설정되지 않았습니다.');
        }
      };

      runApiValidation();
    }
  }, [currentLocation, isMapReady, initializeTmapMap]);

  // 에러 감지 시 처리
  useEffect(() => {
    if (error) {
      handleNavigationError(error);
    }
  }, [error]);

  const getStepInstruction = () => {
    switch (searchStep) {
      case 'start':
        return '🟢 지도를 클릭하여 출발지를 설정하거나 "내 위치" 버튼을 눌러주세요';
      case 'end':
        return '🔴 지도를 클릭하여 도착지를 설정해주세요';
      case 'ready':
        return '✅ 출발지와 도착지가 설정되었습니다. 길찾기를 시작하세요';
      default:
        return '';
    }
  };

  return (
    <div className="tmap-navigation-component">
      {/* 헤더 */}
      <div className="bg-white p-4 shadow-sm border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {isKorea ? '🇰🇷 TMAP 네비게이션' : '🌍 Google Maps 네비게이션'}
          </h2>
          <button
            onClick={onBackToMain}
            className="text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
        </div>
        
        {/* 현재 위치 정보 */}
        <div className="mt-2 text-sm text-gray-600">
          {currentLocation ? (
            <span>📍 현재 위치: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</span>
          ) : (
            <span>📍 위치 확인 중...</span>
          )}
        </div>
      </div>

      {/* 단계별 안내 */}
      <div className="bg-blue-50 p-3 border-b">
        <div className="text-sm font-medium text-blue-800">
          {getStepInstruction()}
        </div>
        {errorCount > 0 && (
          <div className="mt-1 text-xs text-red-600">
            ⚠️ 오류 발생 ({errorCount}/3) - {errorCount >= 3 ? '길찾기 중단됨' : '재시도 가능'}
          </div>
        )}
      </div>

      {/* 지도 영역 */}
      <div className="relative">
        <div 
          ref={mapRef} 
          className="w-full h-96 bg-gray-200 border border-gray-300 rounded-lg overflow-hidden"
          style={{ minHeight: '400px' }}
        >
          {!isMapReady && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-gray-600 font-medium">TMAP 지도 로딩 중...</div>
                <div className="text-gray-500 text-sm mt-2">
                  {currentLocation ? 
                    `위치: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 
                    '위치 확인 중...'
                  }
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 지도 위 버튼들 */}
        {isMapReady && (
          <div className="absolute top-4 right-4 space-y-2">
            <button
              onClick={moveToMyLocation}
              className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50"
              title="내 위치로 이동"
            >
              📍
            </button>
            {searchStep === 'start' && (
              <button
                onClick={setMyLocationAsStart}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg shadow-md hover:bg-blue-700 text-sm"
              >
                내 위치
              </button>
            )}
          </div>
        )}
      </div>

      {/* 설정된 위치 정보 */}
      <div className="bg-white p-4 border-b">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-700">🟢 출발지</div>
            <div className="text-xs text-gray-500 mt-1">
              {startPoint ? (
                `${startPoint.lat.toFixed(4)}, ${startPoint.lng.toFixed(4)}`
              ) : (
                '설정되지 않음'
              )}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">🔴 도착지</div>
            <div className="text-xs text-gray-500 mt-1">
              {endPoint ? (
                `${endPoint.lat.toFixed(4)}, ${endPoint.lng.toFixed(4)}`
              ) : (
                '설정되지 않음'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="bg-white p-4">
        <div className="flex space-x-2 mb-2">
          <button
            onClick={handleRouteSearch}
            disabled={!startPoint || !endPoint || isLoading || isNavigating || errorCount >= 3}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isLoading || isNavigating ? '길찾기 중...' : '🗺️ 길찾기 시작'}
          </button>
          
          <button
            onClick={resetNavigation}
            className="bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 font-medium"
          >
            🔄 초기화
          </button>
        </div>
        
        {/* API 테스트 버튼 (개발 환경에서만) */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={async () => {
              const viteApiKey = (import.meta.env as any)?.VITE_TMAP_API_KEY;
              const reactApiKey = process.env.REACT_APP_TMAP_API_KEY;
              const apiKey = viteApiKey || reactApiKey;
              
              if (apiKey) {
                console.log('🧪 수동 TMAP API 테스트 시작...');
                await TmapApiValidator.runFullTest(apiKey);
              } else {
                console.error('❌ API 키가 없습니다.');
              }
            }}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 font-medium text-sm"
          >
            🧪 TMAP API 테스트 (개발용)
          </button>
        )}
      </div>

      {/* 경로 결과 */}
      {route && (
        <div className="bg-green-50 p-4 border-t">
          <h3 className="font-medium text-green-800 mb-2">✅ 경로 검색 완료</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-green-600 font-medium">거리</div>
              <div className="text-green-800">{formatDistance(route.distance)}</div>
            </div>
            <div>
              <div className="text-green-600 font-medium">시간</div>
              <div className="text-green-800">{formatDuration(route.duration)}</div>
            </div>
            <div>
              <div className="text-green-600 font-medium">경로점</div>
              <div className="text-green-800">{route.path.length}개</div>
            </div>
          </div>
          
          <button
            onClick={() => onNavigationStart && onNavigationStart(route)}
            className="w-full mt-3 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-medium"
          >
            🚀 AR 네비게이션 시작
          </button>
        </div>
      )}
    </div>
  );
};