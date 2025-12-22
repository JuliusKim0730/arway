'use client';

import { useState, useEffect, useRef } from 'react';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';

interface CurrentLocationButtonProps {
  onLocationFound?: (location: { lat: number; lng: number }) => void;
  className?: string;
}

export function CurrentLocationButton({ onLocationFound, className = '' }: CurrentLocationButtonProps) {
  const { currentLocation, accuracy, loading, error, getCurrentLocation } = useCurrentLocation();
  const [showDetails, setShowDetails] = useState(false);

  const handleClick = async () => {
    await getCurrentLocation();
  };

  // 위치가 찾아지면 콜백 호출 (무한 루프 방지)
  const prevLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (currentLocation && onLocationFound && !loading) {
      // 이전 위치와 다를 때만 콜백 호출
      const prevLocation = prevLocationRef.current;
      if (!prevLocation || 
          prevLocation.lat !== currentLocation.lat || 
          prevLocation.lng !== currentLocation.lng) {
        prevLocationRef.current = currentLocation;
        onLocationFound(currentLocation);
      }
    }
  }, [currentLocation, onLocationFound, loading]);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
          ${loading 
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
          ${currentLocation ? 'bg-green-600 hover:bg-green-700' : ''}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        aria-label="현재 위치 찾기"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>위치 찾는 중...</span>
          </>
        ) : currentLocation ? (
          <>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>위치 찾음</span>
            {accuracy && (
              <span className="text-xs opacity-75">({Math.round(accuracy)}m)</span>
            )}
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>현재 위치 찾기</span>
          </>
        )}
      </button>

      {/* 위치 정보 상세 표시 */}
      {currentLocation && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="absolute top-full left-0 mt-1 text-xs text-gray-400 hover:text-gray-300"
        >
          {showDetails ? '접기' : '상세 정보'}
        </button>
      )}

      {showDetails && currentLocation && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-black/90 backdrop-blur-md rounded-lg border border-white/20 shadow-xl z-50 min-w-[200px]">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">위도:</span>
              <span className="text-white">{currentLocation.lat.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">경도:</span>
              <span className="text-white">{currentLocation.lng.toFixed(6)}</span>
            </div>
            {accuracy && (
              <div className="flex justify-between">
                <span className="text-gray-400">정확도:</span>
                <span className="text-white">{Math.round(accuracy)}m</span>
              </div>
            )}
            <div className="mt-2 pt-2 border-t border-white/10">
              <a
                href={`https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Google Maps에서 보기
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-900/90 backdrop-blur-md rounded-lg border border-red-500/50 shadow-xl z-50 min-w-[250px]">
          <p className="text-xs text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
}

