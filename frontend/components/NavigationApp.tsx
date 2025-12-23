import React, { useState, useEffect } from 'react';
import { TmapNavigationComponent } from './TmapNavigationComponent';
import { useGeolocationWatcher } from '../hooks/useGeolocationWatcher';
import { DebugPanel } from './DebugPanel';

interface NavigationRoute {
  path: Array<{ lat: number; lng: number }>;
  distance: number;
  duration: number;
  instructions: string[];
}

type AppState = 'main' | 'navigation' | 'ar-navigation';

export const NavigationApp: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('main');
  const [currentRoute, setCurrentRoute] = useState<NavigationRoute | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    currentLocation, 
    accuracy, 
    error: locationError, 
    isWatching,
    requestPermission 
  } = useGeolocationWatcher();

  // 위치 권한 요청
  useEffect(() => {
    if (!currentLocation && !locationError) {
      requestPermission();
    }
  }, [currentLocation, locationError, requestPermission]);

  // 네비게이션 시작
  const handleNavigationStart = (route: NavigationRoute) => {
    setCurrentRoute(route);
    setAppState('ar-navigation');
    setError(null);
  };

  // 네비게이션 에러 처리
  const handleNavigationError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // 메인 화면으로 돌아가기
  const handleBackToMain = () => {
    setAppState('main');
    setCurrentRoute(null);
    setError(null);
  };

  // 네비게이션 화면으로 이동
  const handleStartNavigation = () => {
    if (!currentLocation) {
      setError('위치 정보를 확인할 수 없습니다. GPS를 켜주세요.');
      return;
    }
    setAppState('navigation');
    setError(null);
  };

  // AR 네비게이션 종료
  const handleStopARNavigation = () => {
    setAppState('navigation');
    setCurrentRoute(null);
  };

  // 메인 화면 렌더링
  const renderMainScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🗺️ AR 네비게이션
          </h1>
          <p className="text-gray-600">
            한국은 TMAP, 해외는 Google Maps를 자동으로 선택합니다
          </p>
        </div>

        {/* 위치 상태 카드 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📍 현재 위치 상태</h2>
          
          {locationError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center text-red-800">
                <span className="mr-2">❌</span>
                <span className="font-medium">위치 오류</span>
              </div>
              <div className="mt-2 text-red-700 text-sm">{locationError}</div>
              <button
                onClick={requestPermission}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
              >
                위치 권한 재요청
              </button>
            </div>
          ) : currentLocation ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center text-green-800 mb-2">
                <span className="mr-2">✅</span>
                <span className="font-medium">위치 확인됨</span>
              </div>
              <div className="text-sm text-green-700">
                <div>위도: {currentLocation.lat.toFixed(6)}</div>
                <div>경도: {currentLocation.lng.toFixed(6)}</div>
                {accuracy && <div>정확도: {Math.round(accuracy)}m</div>}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center text-yellow-800">
                <span className="mr-2">⏳</span>
                <span className="font-medium">위치 확인 중...</span>
              </div>
              <div className="mt-2 text-yellow-700 text-sm">
                GPS 신호를 받고 있습니다. 잠시만 기다려주세요.
              </div>
            </div>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center text-red-800">
              <span className="mr-2">⚠️</span>
              <span className="font-medium">오류</span>
            </div>
            <div className="mt-2 text-red-700 text-sm">{error}</div>
          </div>
        )}

        {/* 시작 버튼 */}
        <div className="text-center">
          <button
            onClick={handleStartNavigation}
            disabled={!currentLocation}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg shadow-lg transform transition hover:scale-105"
          >
            {currentLocation ? '🚀 네비게이션 시작' : '📍 위치 확인 중...'}
          </button>
        </div>

        {/* 기능 설명 */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold mb-3 text-blue-600">🇰🇷 한국 내 네비게이션</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• TMAP API 기반 정확한 도보 경로</li>
              <li>• 실시간 교통 정보 반영</li>
              <li>• 상세한 길안내 제공</li>
              <li>• 대중교통 연계 정보</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold mb-3 text-green-600">🌍 해외 네비게이션</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Google Maps API 기반</li>
              <li>• 전 세계 지역 지원</li>
              <li>• 다양한 이동 수단 옵션</li>
              <li>• 실시간 경로 업데이트</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // AR 네비게이션 화면 렌더링
  const renderARNavigationScreen = () => (
    <div className="min-h-screen bg-black">
      <div className="relative w-full h-screen">
        {/* AR 카메라 뷰 (실제 구현에서는 WebXR/카메라 스트림) */}
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">📱</div>
            <div className="text-xl font-semibold mb-2">AR 네비게이션 모드</div>
            <div className="text-gray-300 mb-6">
              실제 구현에서는 카메라 뷰와 AR 오버레이가 표시됩니다
            </div>
            
            {/* 경로 정보 오버레이 */}
            {currentRoute && (
              <div className="bg-black bg-opacity-50 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-300">목적지까지</div>
                <div className="text-2xl font-bold text-white">
                  {(currentRoute.distance / 1000).toFixed(1)}km
                </div>
                <div className="text-sm text-gray-300">
                  약 {Math.round(currentRoute.duration / 60)}분
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AR 네비게이션 컨트롤 */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <button
            onClick={handleStopARNavigation}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            ← 뒤로
          </button>
          
          <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
            AR 모드
          </div>
        </div>

        {/* 하단 네비게이션 정보 */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">다음 안내</div>
                <div className="font-semibold">직진 후 우회전</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">거리</div>
                <div className="font-semibold">150m</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 현재 상태에 따른 화면 렌더링
  switch (appState) {
    case 'main':
      return (
        <>
          {renderMainScreen()}
          <DebugPanel />
        </>
      );
    
    case 'navigation':
      return (
        <>
          <TmapNavigationComponent
            onNavigationStart={handleNavigationStart}
            onNavigationError={handleNavigationError}
            onBackToMain={handleBackToMain}
          />
          <DebugPanel />
        </>
      );
    
    case 'ar-navigation':
      return (
        <>
          {renderARNavigationScreen()}
          <DebugPanel />
        </>
      );
    
    default:
      return (
        <>
          {renderMainScreen()}
          <DebugPanel />
        </>
      );
  }
};