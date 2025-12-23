import React, { useState, useEffect } from 'react';
import { useARNavigation } from '../hooks/useARNavigation';

export const DebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const {
    currentLocation,
    isKorea,
    currentService,
    getErrorStatus
  } = useARNavigation();

  const [systemInfo, setSystemInfo] = useState({
    tmapApiKey: '',
    googleApiKey: '',
    isHttps: false,
    hasGeolocation: false
  });

  useEffect(() => {
    setSystemInfo({
      tmapApiKey: process.env.REACT_APP_TMAP_API_KEY ? '설정됨' : '설정되지 않음',
      googleApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? '설정됨' : '설정되지 않음',
      isHttps: location.protocol === 'https:',
      hasGeolocation: !!navigator.geolocation
    });
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const errorStatus = getErrorStatus();

  return (
    <>
      {/* 디버그 패널 토글 버튼 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white p-3 rounded-full shadow-lg z-50 hover:bg-purple-700"
        title="디버그 패널 토글"
      >
        🔧
      </button>

      {/* 디버그 패널 */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-sm z-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">🔧 디버그 패널</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* 환경변수 상태 */}
            <div>
              <div className="font-medium text-gray-700">환경변수</div>
              <div className="text-gray-600">
                TMAP: {systemInfo.tmapApiKey}<br/>
                Google: {systemInfo.googleApiKey}
              </div>
            </div>

            {/* 시스템 상태 */}
            <div>
              <div className="font-medium text-gray-700">시스템</div>
              <div className="text-gray-600">
                HTTPS: {systemInfo.isHttps ? '✅' : '❌'}<br/>
                GPS: {systemInfo.hasGeolocation ? '✅' : '❌'}
              </div>
            </div>

            {/* 위치 정보 */}
            <div>
              <div className="font-medium text-gray-700">위치</div>
              <div className="text-gray-600">
                {currentLocation ? (
                  <>
                    위도: {currentLocation.lat.toFixed(6)}<br/>
                    경도: {currentLocation.lng.toFixed(6)}<br/>
                    지역: {isKorea ? '🇰🇷 한국' : '🌍 해외'}<br/>
                    서비스: {currentService || '미설정'}<br/>
                    <div className="text-xs mt-1 text-blue-600">
                      한국 범위 체크:<br/>
                      위도(33-38.9): {currentLocation.lat >= 33.0 && currentLocation.lat <= 38.9 ? '✅' : '❌'}<br/>
                      경도(124.5-131.9): {currentLocation.lng >= 124.5 && currentLocation.lng <= 131.9 ? '✅' : '❌'}
                    </div>
                  </>
                ) : (
                  '위치 정보 없음'
                )}
              </div>
            </div>

            {/* 에러 상태 */}
            <div>
              <div className="font-medium text-gray-700">에러 상태</div>
              <div className="text-gray-600">
                횟수: {errorStatus.count}/{errorStatus.maxRetries}<br/>
                상태: {errorStatus.shouldStop ? '❌ 중단' : '✅ 정상'}
                {errorStatus.lastError && (
                  <>
                    <br/>오류: {errorStatus.lastError.substring(0, 30)}...
                  </>
                )}
              </div>
            </div>

            {/* 빠른 액션 */}
            <div>
              <div className="font-medium text-gray-700 mb-1">빠른 액션</div>
              <div className="flex space-x-1">
                <button
                  onClick={() => console.log('현재 상태:', { currentLocation, isKorea, currentService, errorStatus })}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                >
                  콘솔 로그
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                >
                  새로고침
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};