import React, { useState, useEffect } from 'react';
import { useARNavigation } from '../hooks/useARNavigation';

interface Location {
  lat: number;
  lng: number;
}

interface ARNavigationComponentProps {
  destination?: Location;
  onRouteFound?: (route: any) => void;
  onError?: (error: string) => void;
}

export const ARNavigationComponent: React.FC<ARNavigationComponentProps> = ({
  destination,
  onRouteFound,
  onError
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
    formatDuration,
    setTmapApiKey
  } = useARNavigation();

  const [destinationInput, setDestinationInput] = useState({
    lat: destination?.lat || 37.5665,
    lng: destination?.lng || 126.9780
  });

  // API 키 설정 (환경변수에서 자동으로 가져오지만, 런타임에서도 설정 가능)
  useEffect(() => {
    const tmapKey = process.env.REACT_APP_TMAP_API_KEY;
    if (tmapKey && tmapKey !== 'YOUR_TMAP_API_KEY_HERE') {
      setTmapApiKey(tmapKey);
    }
  }, [setTmapApiKey]);

  // 경로 찾기 결과 콜백
  useEffect(() => {
    if (route && onRouteFound) {
      onRouteFound(route);
    }
  }, [route, onRouteFound]);

  // 에러 콜백
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // 자동 경로 검색 (destination prop이 변경될 때)
  useEffect(() => {
    if (destination && currentLocation) {
      searchRoute(destination);
    }
  }, [destination, currentLocation, searchRoute]);

  const handleSearchRoute = () => {
    if (destinationInput.lat && destinationInput.lng) {
      searchRoute(destinationInput);
    }
  };

  const getServiceStatusColor = () => {
    if (isKorea) return 'text-blue-600';
    return 'text-green-600';
  };

  const getServiceIcon = () => {
    if (isKorea) return '🇰🇷';
    return '🌍';
  };

  return (
    <div className="ar-navigation-component p-4 bg-white rounded-lg shadow-lg">
      {/* 헤더 */}
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">AR 네비게이션</h2>
        
        {/* 현재 위치 및 서비스 상태 */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">현재 위치:</span>
            {currentLocation ? (
              <span className="text-green-600">
                {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
              </span>
            ) : (
              <span className="text-red-600">위치 확인 중...</span>
            )}
          </div>
          
          {currentService && (
            <div className={`flex items-center space-x-1 ${getServiceStatusColor()}`}>
              <span>{getServiceIcon()}</span>
              <span className="font-medium">{currentService}</span>
            </div>
          )}
        </div>
      </div>

      {/* 목적지 입력 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          목적지 좌표
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            step="any"
            placeholder="위도 (Latitude)"
            value={destinationInput.lat}
            onChange={(e) => setDestinationInput(prev => ({
              ...prev,
              lat: parseFloat(e.target.value) || 0
            }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            step="any"
            placeholder="경도 (Longitude)"
            value={destinationInput.lng}
            onChange={(e) => setDestinationInput(prev => ({
              ...prev,
              lng: parseFloat(e.target.value) || 0
            }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={handleSearchRoute}
          disabled={isLoading || !currentLocation}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? '경로 검색 중...' : '경로 찾기'}
        </button>
        
        {route && (
          <button
            onClick={clearRoute}
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
          >
            초기화
          </button>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 경로 정보 */}
      {route && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-gray-900 mb-3">경로 정보</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm text-gray-600">거리:</span>
              <div className="font-medium">{formatDistance(route.distance)}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">예상 시간:</span>
              <div className="font-medium">{formatDuration(route.duration)}</div>
            </div>
          </div>

          <div className="mb-4">
            <span className="text-sm text-gray-600">경로 포인트:</span>
            <div className="font-medium">{route.path.length}개 지점</div>
          </div>

          {/* 경로 안내 */}
          {route.instructions.length > 0 && (
            <div>
              <span className="text-sm text-gray-600 block mb-2">경로 안내:</span>
              <div className="max-h-32 overflow-y-auto">
                {route.instructions.slice(0, 5).map((instruction, index) => (
                  <div key={index} className="text-sm text-gray-700 mb-1">
                    {index + 1}. {instruction}
                  </div>
                ))}
                {route.instructions.length > 5 && (
                  <div className="text-sm text-gray-500">
                    ... 외 {route.instructions.length - 5}개 안내
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 서비스 정보 */}
      <div className="mt-4 text-xs text-gray-500">
        {isKorea ? (
          <div>
            🇰🇷 한국 내 위치: TMAP API 사용 중
            <br />
            정확한 도보 경로와 대중교통 정보를 제공합니다.
          </div>
        ) : (
          <div>
            🌍 해외 위치: Google Maps API 사용 중
            <br />
            전 세계 지역의 경로 정보를 제공합니다.
          </div>
        )}
      </div>
    </div>
  );
};