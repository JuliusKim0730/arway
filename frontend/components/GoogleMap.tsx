'use client';

import { useEffect, useRef, useState } from 'react';

interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    label?: string;
    title?: string;
  }>;
  onMapClick?: (location: { lat: number; lng: number }) => void;
  className?: string;
}

declare global {
  interface Window {
    google?: any;
    initMap?: () => void;
  }
}

export function GoogleMap({ 
  center, 
  zoom = 15, 
  markers = [],
  onMapClick,
  className = 'w-full h-full'
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<any[]>([]);
  const clickListenerRef = useRef<any>(null);

  // Google Maps API 로드 (전역 스크립트 로드 상태 관리 + 재시도 로직)
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError('Google Maps API 키가 설정되지 않았습니다.');
      return;
    }

    // 이미 로드되어 있는지 확인
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // 전역 로딩 상태 확인 (중복 로드 방지)
    const loadingKey = '__google_maps_loading__';
    if ((window as any)[loadingKey]) {
      // 이미 로딩 중이면 완료 대기
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          setIsLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    // 재시도 로직
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2초

    const loadGoogleMapsScript = (attempt: number = 1): void => {
      // 스크립트 로드 시작 표시
      (window as any)[loadingKey] = true;

      // 전역 콜백 함수 (Google Maps API가 찾을 수 있도록 window에 등록)
      const callbackName = `initGoogleMaps_${Date.now()}`;
      
      // 타임아웃 설정 (30초)
      const timeoutId = setTimeout(() => {
        if (attempt < maxRetries) {
          console.warn(`Google Maps API 로드 타임아웃 (시도 ${attempt}/${maxRetries}), 재시도 중...`);
          delete (window as any)[callbackName];
          delete (window as any)[loadingKey];
          setTimeout(() => loadGoogleMapsScript(attempt + 1), retryDelay);
        } else {
          setError('Google Maps API를 로드할 수 없습니다. 인터넷 연결을 확인하거나 잠시 후 다시 시도해주세요.');
          delete (window as any)[callbackName];
          delete (window as any)[loadingKey];
        }
      }, 30000);

      // 전역 콜백 함수 등록
      (window as any)[callbackName] = () => {
        clearTimeout(timeoutId);
        setIsLoaded(true);
        delete (window as any)[callbackName];
        delete (window as any)[loadingKey];
      };

      // 스크립트 로드 (async 속성 명시적 사용)
      const script = document.createElement('script');
      // 해외 접근 문제를 위한 대체 URL 시도 (첫 번째 시도는 기본 URL)
      const baseUrl = attempt === 1 
        ? 'https://maps.googleapis.com/maps/api/js'
        : 'https://maps.googleapis.com/maps/api/js'; // 필요시 다른 CDN URL 시도 가능
      
      // marker 라이브러리 제거 (배포 환경 안정화를 위해)
      // Directions API는 marker 라이브러리와 무관하므로 제거하여 안정성 향상
      script.src = `${baseUrl}?key=${apiKey}&libraries=places&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.id = `google-maps-script-${attempt}`;

      script.onerror = () => {
        clearTimeout(timeoutId);
        delete (window as any)[callbackName];
        delete (window as any)[loadingKey];
        
        // 기존 스크립트 제거
        const existingScript = document.getElementById(`google-maps-script-${attempt}`);
        if (existingScript) {
          existingScript.remove();
        }

        if (attempt < maxRetries) {
          console.warn(`Google Maps API 로드 실패 (시도 ${attempt}/${maxRetries}), 재시도 중...`);
          setTimeout(() => loadGoogleMapsScript(attempt + 1), retryDelay);
        } else {
          setError('Google Maps API를 로드할 수 없습니다. 인터넷 연결을 확인하거나 잠시 후 다시 시도해주세요.');
        }
      };

      // 이미 같은 스크립트가 있는지 확인
      const existingScript = document.getElementById(`google-maps-script-${attempt}`);
      if (!existingScript) {
        document.head.appendChild(script);
      } else {
        // 이미 있으면 완료 대기
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearTimeout(timeoutId);
            setIsLoaded(true);
            delete (window as any)[callbackName];
            clearInterval(checkInterval);
          }
        }, 100);
        
        // 타임아웃 시 interval 정리
        setTimeout(() => {
          clearInterval(checkInterval);
        }, 30000);
      }
    };

    loadGoogleMapsScript();

    return () => {
      // cleanup은 스크립트를 제거하지 않음 (다른 컴포넌트에서 사용할 수 있음)
    };
  }, []);

  // 지도 초기화 및 정리
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google || !window.google.maps) return;

    // 이미 지도가 초기화되어 있으면 스킵 (중복 초기화 방지)
    if (map) return;

    let mapInstance: any = null;
    
    try {
      // 새 지도 인스턴스 생성
      mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom: zoom,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      setMap(mapInstance);
    } catch (err) {
      setError(err instanceof Error ? err.message : '지도를 초기화할 수 없습니다.');
    }

    // 정리 함수: 컴포넌트 언마운트 시 실행
    return () => {
      // 마커 제거
      markersRef.current.forEach((marker: any) => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];

      // 클릭 리스너 제거
      if (clickListenerRef.current && mapInstance) {
        try {
          window.google.maps.event.removeListener(clickListenerRef.current);
        } catch (err) {
          console.warn('클릭 리스너 제거 실패:', err);
        }
        clickListenerRef.current = null;
      }

      // 지도 인스턴스 정리
      if (mapInstance) {
        setMap(null);
      }
    };
  }, [isLoaded, center, zoom]); // center와 zoom도 초기값으로 사용

  // 클릭 리스너 업데이트 (onMapClick 변경 시)
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    // 기존 클릭 리스너 제거
    if (clickListenerRef.current) {
      window.google.maps.event.removeListener(clickListenerRef.current);
      clickListenerRef.current = null;
    }

    // 새 클릭 리스너 등록
    if (onMapClick) {
      clickListenerRef.current = map.addListener('click', (event: any) => {
        if (event.latLng) {
          onMapClick({
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          });
        }
      });
    }

    // 정리 함수
    return () => {
      if (clickListenerRef.current) {
        window.google.maps.event.removeListener(clickListenerRef.current);
        clickListenerRef.current = null;
      }
    };
  }, [map, onMapClick]);

  // 중심점 및 줌 업데이트 (지도가 이미 초기화된 경우)
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;
    
    // 중심점 업데이트
    map.setCenter({ lat: center.lat, lng: center.lng });
    
    // 줌 레벨 업데이트
    if (zoom !== undefined) {
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);

  // 마커 업데이트 - 기본 Marker 사용 (안정적)
  useEffect(() => {
    if (!map || !isLoaded || !window.google || !window.google.maps) return;

    // 기존 마커 완전히 제거
    markersRef.current.forEach((marker: any) => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    // 새 마커 추가 - 기본 Marker 사용 (AdvancedMarkerElement는 지도 ID 필요)
    markers.forEach((markerData) => {
      try {
        // 현재 위치 마커는 다른 색상으로 표시
        const isCurrentLocation = markerData.label === '📍';
        
        // @ts-ignore - Marker는 deprecated이지만 안정적으로 작동
        const marker = new window.google.maps.Marker({
          position: { lat: markerData.position.lat, lng: markerData.position.lng },
          map: map,
          title: markerData.title || markerData.label,
          label: markerData.label ? {
            text: markerData.label,
            color: 'white',
            fontSize: isCurrentLocation ? '16px' : '14px',
            fontWeight: 'bold',
          } : undefined,
          icon: isCurrentLocation ? {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          } : undefined,
          optimized: false, // 성능 최적화 비활성화 (정확도 우선)
        });
        
        markersRef.current.push(marker);
      } catch (err) {
        console.warn('마커 생성 실패:', err);
      }
    });

    // 정리 함수: 마커 배열이 변경되거나 컴포넌트 언마운트 시 실행
    return () => {
      markersRef.current.forEach((marker: any) => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];
    };
  }, [map, isLoaded, markers]);

  if (error) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-gray-100 text-gray-600 p-4`}>
        <p className="text-center mb-2">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setIsLoaded(false);
            // 페이지 새로고침으로 재시도
            window.location.reload();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          새로고침
        </button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">지도 로딩 중...</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className={className} />;
}

