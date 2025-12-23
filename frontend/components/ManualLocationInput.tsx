import React, { useState } from 'react';

interface Location {
  lat: number;
  lng: number;
}

interface ManualLocationInputProps {
  onLocationSet: (location: Location) => void;
  currentLocation: Location | null;
}

export const ManualLocationInput: React.FC<ManualLocationInputProps> = ({
  onLocationSet,
  currentLocation
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputLocation, setInputLocation] = useState({
    lat: currentLocation?.lat || 37.5665,
    lng: currentLocation?.lng || 126.9780
  });

  const presetLocations = [
    { name: '서울시청', lat: 37.5665, lng: 126.9780 },
    { name: '강남역', lat: 37.4979, lng: 127.0276 },
    { name: '부산역', lat: 35.1156, lng: 129.0403 },
    { name: '제주공항', lat: 33.5067, lng: 126.4929 },
    { name: '인천공항', lat: 37.4602, lng: 126.4407 }
  ];

  const handleLocationSet = () => {
    if (inputLocation.lat && inputLocation.lng) {
      onLocationSet(inputLocation);
      setIsOpen(false);
    }
  };

  const handlePresetSelect = (location: Location) => {
    setInputLocation(location);
    onLocationSet(location);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm"
      >
        📍 수동 위치 설정
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">📍 위치 수동 설정</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* 프리셋 위치 */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">빠른 선택</div>
          <div className="grid grid-cols-1 gap-2">
            {presetLocations.map((location, index) => (
              <button
                key={index}
                onClick={() => handlePresetSelect(location)}
                className="text-left p-2 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="font-medium">{location.name}</div>
                <div className="text-xs text-gray-500">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 수동 입력 */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">직접 입력</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">위도 (Latitude)</label>
              <input
                type="number"
                step="any"
                value={inputLocation.lat}
                onChange={(e) => setInputLocation(prev => ({
                  ...prev,
                  lat: parseFloat(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">경도 (Longitude)</label>
              <input
                type="number"
                step="any"
                value={inputLocation.lng}
                onChange={(e) => setInputLocation(prev => ({
                  ...prev,
                  lng: parseFloat(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* 현재 설정될 위치 정보 */}
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-600">설정될 위치:</div>
          <div className="font-medium">
            {inputLocation.lat.toFixed(6)}, {inputLocation.lng.toFixed(6)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {inputLocation.lat >= 33.0 && inputLocation.lat <= 38.9 && 
             inputLocation.lng >= 124.5 && inputLocation.lng <= 131.9 
              ? '🇰🇷 한국 (TMAP 사용)' 
              : '🌍 해외 (Google Maps 사용)'}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex space-x-2">
          <button
            onClick={handleLocationSet}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            위치 설정
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
          >
            취소
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          💡 GPS 신호가 약한 실내 환경에서 유용합니다.
        </div>
      </div>
    </div>
  );
};