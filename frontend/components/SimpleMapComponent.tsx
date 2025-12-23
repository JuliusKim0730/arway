import React, { useState, useRef, useCallback } from 'react';
import { useARNavigation } from '../hooks/useARNavigation';

interface Location {
  lat: number;
  lng: number;
}

interface SimpleMapComponentProps {
  onNavigationStart?: (route: any) => void;
  onNavigationError?: (error: string) => void;
  onBackToMain?: () => void;
}

export const SimpleMapComponent: React.FC<SimpleMapComponentProps> = ({
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

  const [startPoint, setStartPoint] = useState<Location | null>(null);
  const [endPoint, setEndPoint] = useState<Location | null>(null);
  const [searchStep, setSearchStep] = useState<'start' | 'end' | 'ready'>('start');
  const [errorCount, setErrorCount] = useState(0);
  const [mapCenter, setMapCenter] = useState<Location>(
    currentLocation || { lat: 37.5665, lng: 126.9780 }
  );
  const [zoom, setZoom] = useState(15);

  // 지도 클릭 시뮬레이션 (실제 지도 대신 좌표 입력)
  const handleCoordinateClick = (lat: number, lng: number) => {
    const location = { lat, lng };
    
    if (searchStep === 'start') {
      setStartPoint(location);
      setSearchStep('end');
      console.log('🟢 출발지 설정:', location);
    } else if (searchStep === 'end') {
      setEndPoint(location);
      setSearchStep('ready');
      console.log('🔴 도착지 설정:', location);
    }
  };

  // 내 위치를 시작점으로 설정
  const setMyLocationAsStart = useCallback(() => {
    if (currentLocation) {
      setStartPoint(currentLocation);
      setSearchStep('end');
      console.log('📍 내 위치를 출발지로 설정:', currentLocation);
    }
  }, [currentLocation]);

  // 길찾기 실행
  const handleRouteSearch = async () => {
    if (!startPoint || !endPoint) {
      handleNavigationError('출발지와 도착지를 모두 설정해주세요.');
      return;
    }

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
  };

  const getStepInstruction = () => {
    switch (searchStep) {
      case 'start':
        return '🟢 아래 좌표 입력 또는 "내 위치" 버튼으로 출발지를 설정하세요';
      case 'end':
        return '🔴 아래 좌표 입력으로 도착지를 설정하세요';
      case 'ready':
        return '✅ 출발지와 도착지가 설정되었습니다. 길찾기를 시작하세요';
      default:
        return '';
    }
  };

  // 주요 위치 프리셋
  const presetLocations = [
    { name: '서울시청', lat: 37.5665, lng: 126.9780 },
    { name: '강남역', lat: 37.4979, lng: 127.0276 },
    { name: '부산역', lat: 35.1156, lng: 129.0403 },
    { name: '제주공항', lat: 33.5067, lng: 126.4929 },
    { name: '인천공항', lat: 37.4602, lng: 126.4407 }
  ];

  return (
    <div className="simple-map-component">
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

      {/* 지도 대체 영역 - 좌표 입력 */}
      <div className="bg-white p-4 border-b">
        <div className="text-sm font-medium text-gray-700 mb-3">
          📍 위치 선택 (TMAP 지도 CORS 문제로 인한 대체 방식)
        </div>
        
        {/* 프리셋 위치 */}
        <div className="mb-4">
          <div className="text-xs text-gray-600 mb-2">빠른 선택:</div>
          <div className="grid grid-cols-2 gap-2">
            {presetLocations.map((location, index) => (
              <button
                key={index}
                onClick={() => handleCoordinateClick(location.lat, location.lng)}
                className="text-left p-2 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm"
              >
                <div className="font-medium">{location.name}</div>
                <div className="text-xs text-gray-500">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 수동 좌표 입력 */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <input
            type="number"
            step="any"
            placeholder="위도 (예: 37.5665)"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const lat = parseFloat(e.currentTarget.value);
                const lngInput = e.currentTarget.nextElementSibling as HTMLInputElement;
                const lng = parseFloat(lngInput.value);
                if (lat && lng) {
                  handleCoordinateClick(lat, lng);
                }
              }
            }}
          />
          <input
            type="number"
            step="any"
            placeholder="경도 (예: 126.9780)"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const lng = parseFloat(e.currentTarget.value);
                const latInput = e.currentTarget.previousElementSibling as HTMLInputElement;
                const lat = parseFloat(latInput.value);
                if (lat && lng) {
                  handleCoordinateClick(lat, lng);
                }
              }
            }}
          />
        </div>

        {searchStep === 'start' && (
          <button
            onClick={setMyLocationAsStart}
            disabled={!currentLocation}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm"
          >
            📍 내 위치를 출발지로 사용
          </button>
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
        <div className="flex space-x-2">
          <button
            onClick={handleRouteSearch}
            disabled={!startPoint || !endPoint || isLoading || errorCount >= 3}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? '길찾기 중...' : '🗺️ 길찾기 시작'}
          </button>
          
          <button
            onClick={resetNavigation}
            className="bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 font-medium"
          >
            🔄 초기화
          </button>
        </div>
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

      {/* CORS 문제 안내 */}
      <div className="bg-yellow-50 border-t border-yellow-200 p-3">
        <div className="text-xs text-yellow-800">
          ⚠️ <strong>CORS 제한으로 인해 TMAP 지도 표시가 제한됩니다.</strong><br/>
          대신 위치 선택 방식으로 출발지/도착지를 설정할 수 있습니다.<br/>
          실제 경로 검색은 TMAP API를 통해 정상적으로 작동합니다.
        </div>
      </div>
    </div>
  );
};