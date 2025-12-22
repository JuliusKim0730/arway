'use client';

import { useState, useEffect, useRef } from 'react';
import { searchPlaces, autocompletePlaces, type PlaceResult } from '@/lib/googleMaps';
import { LoadingSpinner } from './LoadingSpinner';

// PlaceResult 타입 re-export
export type { PlaceResult };

interface PlaceSearchProps {
  onPlaceSelect: (place: PlaceResult) => void;
  currentLocation?: { lat: number; lng: number } | null;
  placeholder?: string;
  className?: string;
}

export function PlaceSearch({ 
  onPlaceSelect, 
  currentLocation,
  placeholder = '장소 검색 (예: 강남역, 서울시청)',
  className = ''
}: PlaceSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 결과 숨기기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 검색 실행
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    // 디바운싱
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setLoading(true);
    setError(null);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const places = await searchPlaces(
          query.trim(),
          currentLocation || undefined,
          currentLocation ? 5000 : undefined
        );
        setResults(places);
        setShowResults(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms 디바운스

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, currentLocation]);

  const handleSelect = (place: PlaceResult) => {
    setQuery(place.name);
    setShowResults(false);
    onPlaceSelect(place);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true);
            }
          }}
          placeholder={placeholder}
          className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          aria-label="장소 검색"
        />
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" aria-hidden="true">
          🔍
        </span>
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>

      {/* 검색 결과 */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {error && (
            <div className="p-3 text-red-400 text-sm border-b border-gray-700">
              {error}
            </div>
          )}
          
          {results.length === 0 && !loading && query.trim() && (
            <div className="p-3 text-gray-400 text-sm text-center">
              검색 결과가 없습니다.
            </div>
          )}

          {results.map((place) => (
            <button
              key={place.place_id}
              onClick={() => handleSelect(place)}
              className="w-full text-left p-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{place.name}</p>
                  <p className="text-gray-400 text-xs mt-1 truncate">{place.formatted_address}</p>
                  {place.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-yellow-400 text-xs">⭐</span>
                      <span className="text-gray-400 text-xs">
                        {place.rating.toFixed(1)}
                        {place.user_ratings_total && ` (${place.user_ratings_total})`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

