'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchDestinations, type Destination } from '@/lib/api';
import { LoadingSpinner } from './LoadingSpinner';

interface DestinationSearchProps {
  onDestinationSelect: (destination: Destination) => void;
  className?: string;
}

export function DestinationSearch({ 
  onDestinationSelect,
  className = ''
}: DestinationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Destination[]>([]);
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

  // 검색 실행 (디바운싱)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    setError(null);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const destinations = await fetchDestinations(query.trim());
        setResults(destinations);
        setShowResults(true);
      } catch (err) {
        console.error('목적지 검색 실패:', err);
        setError('목적지 검색에 실패했습니다.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms 디바운싱

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const handleSelect = (destination: Destination) => {
    onDestinationSelect(destination);
    setQuery('');
    setShowResults(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="저장된 목적지 검색..."
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {results.map((destination) => (
            <button
              key={destination.id}
              onClick={() => handleSelect(destination)}
              className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
            >
              <div className="font-medium text-white">{destination.name}</div>
              {destination.address && (
                <div className="text-sm text-gray-400 mt-1">{destination.address}</div>
              )}
              {destination.description && (
                <div className="text-xs text-gray-500 mt-1">{destination.description}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {showResults && query.trim() && !loading && results.length === 0 && !error && (
        <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 text-center text-gray-400">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}

