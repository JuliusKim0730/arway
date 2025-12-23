import React, { useState, useEffect } from 'react';
import { arNavigationManager } from '../services/ARNavigationManager';

export const ApiKeySetup: React.FC = () => {
  const [tmapApiKey, setTmapApiKey] = useState('');
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // 환경변수에서 API 키 확인
    const envTmapKey = process.env.REACT_APP_TMAP_API_KEY;
    const envGoogleKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    
    if (envTmapKey && envTmapKey !== 'YOUR_TMAP_API_KEY_HERE') {
      setTmapApiKey(envTmapKey);
      setIsConfigured(true);
    }
    
    if (envGoogleKey && envGoogleKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      setGoogleMapsApiKey(envGoogleKey);
    }
  }, []);

  const handleSaveTmapKey = () => {
    if (tmapApiKey.trim()) {
      arNavigationManager.setTmapApiKey(tmapApiKey.trim());
      setIsConfigured(true);
      alert('TMAP API 키가 설정되었습니다!');
    }
  };

  const handleSaveGoogleKey = () => {
    if (googleMapsApiKey.trim()) {
      // Google Maps API 키는 환경변수나 동적 로딩에서 사용
      localStorage.setItem('googleMapsApiKey', googleMapsApiKey.trim());
      alert('Google Maps API 키가 설정되었습니다!');
    }
  };

  if (isConfigured) {
    return (
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
        <div className="flex items-center text-green-800">
          <span className="mr-2">✅</span>
          <span className="font-medium">API 키 설정 완료</span>
        </div>
        <div className="mt-2 text-green-700 text-sm">
          TMAP API 키가 설정되어 한국 내 네비게이션을 사용할 수 있습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
      <h3 className="font-medium text-yellow-800 mb-3">🔑 API 키 설정</h3>
      
      {/* TMAP API 키 입력 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          TMAP API 키 (한국 네비게이션용)
        </label>
        <div className="flex space-x-2">
          <input
            type="password"
            value={tmapApiKey}
            onChange={(e) => setTmapApiKey(e.target.value)}
            placeholder="TMAP API 키를 입력하세요"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSaveTmapKey}
            disabled={!tmapApiKey.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            저장
          </button>
        </div>
        <div className="mt-1 text-xs text-gray-500">
          <a 
            href="https://tmapapi.sktelecom.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            TMAP 개발자 센터에서 API 키 발급받기
          </a>
        </div>
      </div>

      {/* Google Maps API 키 입력 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Google Maps API 키 (해외 네비게이션용)
        </label>
        <div className="flex space-x-2">
          <input
            type="password"
            value={googleMapsApiKey}
            onChange={(e) => setGoogleMapsApiKey(e.target.value)}
            placeholder="Google Maps API 키를 입력하세요"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleSaveGoogleKey}
            disabled={!googleMapsApiKey.trim()}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            저장
          </button>
        </div>
        <div className="mt-1 text-xs text-gray-500">
          <a 
            href="https://console.cloud.google.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Google Cloud Console에서 API 키 발급받기
          </a>
        </div>
      </div>

      <div className="text-sm text-yellow-700">
        <strong>참고:</strong> API 키는 브라우저에 임시 저장되며, 새로고침 시 다시 입력해야 합니다. 
        영구 설정을 위해서는 .env.local 파일에 설정하는 것을 권장합니다.
      </div>
    </div>
  );
};