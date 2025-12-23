import React, { useState } from 'react';
import { ARNavigationComponent } from '../components/ARNavigationComponent';
import { ApiKeySetup } from '../components/ApiKeySetup';

interface Location {
  lat: number;
  lng: number;
}

// 한국과 해외의 유명한 장소들
const PRESET_DESTINATIONS = {
  korea: [
    { name: '서울역', lat: 37.5547, lng: 126.9706 },
    { name: '강남역', lat: 37.4979, lng: 127.0276 },
    { name: '부산역', lat: 35.1156, lng: 129.0403 },
    { name: '제주공항', lat: 33.5067, lng: 126.4929 },
    { name: '경복궁', lat: 37.5796, lng: 126.9770 }
  ],
  international: [
    { name: 'Times Square, NYC', lat: 40.7580, lng: -73.9855 },
    { name: 'Eiffel Tower, Paris', lat: 48.8584, lng: 2.2945 },
    { name: 'Big Ben, London', lat: 51.4994, lng: -0.1245 },
    { name: 'Tokyo Station', lat: 35.6812, lng: 139.7671 },
    { name: 'Sydney Opera House', lat: -33.8568, lng: 151.2153 }
  ]
};

export const ARNavigationDemo: React.FC = () => {
  const [selectedDestination, setSelectedDestination] = useState<Location | undefined>();
  const [routeResult, setRouteResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDestinationSelect = (destination: Location) => {
    setSelectedDestination(destination);
    setError(null);
  };

  const handleRouteFound = (route: any) => {
    setRouteResult(route);
    console.log('경로 찾기 완료:', route);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setRouteResult(null);
  };

  return (
    <div className="ar-navigation-demo min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AR 네비게이션 데모
          </h1>
          <p className="text-gray-600">
            GPS 위치에 따라 한국은 TMAP API, 해외는 Google Maps API를 자동으로 선택합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API 키 설정 */}
          <div className="lg:col-span-2">
            <ApiKeySetup />
          </div>

          {/* 네비게이션 컴포넌트 */}
          <div>
            <ARNavigationComponent
              destination={selectedDestination}
              onRouteFound={handleRouteFound}
              onError={handleError}
            />
          </div>

          {/* 목적지 선택 */}
          <div className="space-y-6">
            {/* 한국 목적지 */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                🇰🇷 한국 목적지 (TMAP API 테스트)
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {PRESET_DESTINATIONS.korea.map((dest, index) => (
                  <button
                    key={index}
                    onClick={() => handleDestinationSelect(dest)}
                    className="text-left p-3 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="font-medium">{dest.name}</div>
                    <div className="text-sm text-gray-500">
                      {dest.lat.toFixed(4)}, {dest.lng.toFixed(4)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 해외 목적지 */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                🌍 해외 목적지 (Google Maps API 테스트)
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {PRESET_DESTINATIONS.international.map((dest, index) => (
                  <button
                    key={index}
                    onClick={() => handleDestinationSelect(dest)}
                    className="text-left p-3 border border-gray-200 rounded-md hover:bg-green-50 hover:border-green-300 transition-colors"
                  >
                    <div className="font-medium">{dest.name}</div>
                    <div className="text-sm text-gray-500">
                      {dest.lat.toFixed(4)}, {dest.lng.toFixed(4)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* API 키 설정 안내 */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">⚙️ API 키 설정</h4>
              <div className="text-sm text-yellow-700 space-y-2">
                <div>
                  <strong>TMAP API:</strong>
                  <br />
                  <a 
                    href="https://tmapapi.sktelecom.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    https://tmapapi.sktelecom.com/
                  </a>
                  <br />
                  .env.local에 REACT_APP_TMAP_API_KEY 설정
                </div>
                <div>
                  <strong>Google Maps API:</strong>
                  <br />
                  <a 
                    href="https://console.cloud.google.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    https://console.cloud.google.com/
                  </a>
                  <br />
                  .env.local에 REACT_APP_GOOGLE_MAPS_API_KEY 설정
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 결과 표시 */}
        {routeResult && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">🗺️ 경로 결과</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="text-sm text-blue-600 font-medium">총 거리</div>
                <div className="text-2xl font-bold text-blue-900">
                  {routeResult.distance < 1000 
                    ? `${Math.round(routeResult.distance)}m`
                    : `${(routeResult.distance / 1000).toFixed(1)}km`
                  }
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-md">
                <div className="text-sm text-green-600 font-medium">예상 시간</div>
                <div className="text-2xl font-bold text-green-900">
                  {Math.round(routeResult.duration / 60)}분
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-md">
                <div className="text-sm text-purple-600 font-medium">경로 포인트</div>
                <div className="text-2xl font-bold text-purple-900">
                  {routeResult.path.length}개
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 에러 표시 */}
        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="flex items-center text-red-800">
              <span className="mr-2">❌</span>
              <span className="font-medium">오류:</span>
            </div>
            <div className="mt-2 text-red-700">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ARNavigationDemo;