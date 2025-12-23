import React, { useState } from 'react';
import { arNavigationManager } from '../services/ARNavigationManager';

export const LocationTester: React.FC = () => {
  const [testResults, setTestResults] = useState<Array<{
    name: string;
    lat: number;
    lng: number;
    isKorea: boolean;
    service: string;
  }>>([]);

  const testLocations = [
    { name: '서울시청', lat: 37.5665, lng: 126.9780 },
    { name: '부산역', lat: 35.1156, lng: 129.0403 },
    { name: '제주공항', lat: 33.5067, lng: 126.4929 },
    { name: '뉴욕 타임스퀘어', lat: 40.7580, lng: -73.9855 },
    { name: '도쿄역', lat: 35.6812, lng: 139.7671 },
    { name: '런던 빅벤', lat: 51.4994, lng: -0.1245 }
  ];

  const runLocationTests = () => {
    console.log('🧪 위치 테스트 시작');
    
    const results = testLocations.map(location => {
      const isKorea = arNavigationManager.checkIsKorea(location.lat, location.lng);
      const service = isKorea ? 'TMAP' : 'Google Maps';
      
      return {
        name: location.name,
        lat: location.lat,
        lng: location.lng,
        isKorea,
        service
      };
    });
    
    setTestResults(results);
    console.log('🧪 위치 테스트 결과:', results);
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-md z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">🧪 위치 테스터</h3>
      </div>

      <button
        onClick={runLocationTests}
        className="w-full bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm mb-3"
      >
        위치 감지 테스트 실행
      </button>

      {testResults.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {testResults.map((result, index) => (
            <div key={index} className="text-xs border-b border-gray-200 pb-2">
              <div className="font-medium">{result.name}</div>
              <div className="text-gray-600">
                {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
              </div>
              <div className={`font-medium ${result.isKorea ? 'text-blue-600' : 'text-green-600'}`}>
                {result.isKorea ? '🇰🇷' : '🌍'} {result.service}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        콘솔에서 상세한 로그를 확인하세요.
      </div>
    </div>
  );
};