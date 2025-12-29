'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { arNavigationManager } from '@/services/ARNavigationManager';

interface TmapMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    label?: string;
    title?: string;
    type?: 'start' | 'end' | 'current';
  }>;
  onMapClick?: (location: { lat: number; lng: number }) => void;
  className?: string;
}

declare global {
  interface Window {
    Tmapv2: any;
  }
}

export function TmapMap({ 
  center, 
  zoom = 15, 
  markers = [],
  onMapClick,
  onError,
  className = 'w-full h-full'
}: TmapMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const tmapRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<any[]>([]);

  // TMAP API 로드
  const loadTmapAPI = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // 이미 로드된 경우
      if (window.Tmapv2) {
        console.log('✅ TMAP API 이미 로드됨');
        resolve();
        return;
      }

      // 환경변수에서 API 키 가져오기
      const nextApiKey = process.env.NEXT_PUBLIC_TMAP_API_KEY;
      const reactApiKey = process.env.REACT_APP_TMAP_API_KEY;
      const apiKey = nextApiKey || reactApiKey;
      
      if (!apiKey || apiKey === 'YOUR_TMAP_API_KEY_HERE') {
        console.warn('⚠️ TMAP API 키가 설정되지 않았습니다. Google Maps로 폴백합니다.');
        reject(new Error('TMAP_API_KEY_NOT_SET')); // 특별한 에러 코드
        return;
      }

      console.log('📡 TMAP JavaScript API 스크립트 로딩 시작...');

      // 기존 스크립트 제거 (중복 방지)
      const existingScript = document.querySelector('script[src*="apis.openapi.sk.com/tmap/jsv2"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = `https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${apiKey}`;
      script.async = true;
      script.defer = true;
      
      // 타임아웃 설정 (30초)
      const timeout = setTimeout(() => {
        reject(new Error('TMAP API 로딩 타임아웃 (30초)'));
      }, 30000);
      
      script.onload = () => {
        clearTimeout(timeout);
        // 약간의 지연 후 Tmapv2 객체 확인
        setTimeout(() => {
          if (window.Tmapv2) {
            console.log('✅ TMAP JavaScript API 로드 및 초기화 완료');
            resolve();
          } else {
            reject(new Error('TMAP API 로드 실패: Tmapv2 객체를 찾을 수 없습니다.'));
          }
        }, 100);
      };
      
      script.onerror = (error) => {
        clearTimeout(timeout);
        console.error('❌ TMAP 스크립트 로드 오류:', error);
        reject(new Error('TMAP 스크립트 로드 실패: 네트워크 오류 또는 잘못된 API 키'));
      };
      
      document.head.appendChild(script);
      console.log('📡 TMAP 스크립트 태그 추가됨:', script.src);
    });
  }, []);

  // TMAP 지도 초기화
  const initializeMap = useCallback(async () => {
    if (!mapRef.current) {
      return;
    }

    try {
      // TMAP API 로드 (타임아웃 10초로 단축)
      const loadPromise = loadTmapAPI();
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('TMAP_API_LOAD_TIMEOUT')), 10000);
      });
      
      await Promise.race([loadPromise, timeoutPromise]);
      
      if (!window.Tmapv2) {
        throw new Error('window.Tmapv2 객체가 존재하지 않습니다.');
      }

      // 기존 지도 제거
      if (tmapRef.current) {
        tmapRef.current.destroy();
        tmapRef.current = null;
      }

      // 지도 컨테이너 초기화
      mapRef.current.innerHTML = '';
      
      // 지도 생성
      const map = new window.Tmapv2.Map(mapRef.current, {
        center: new window.Tmapv2.LatLng(center.lat, center.lng),
        width: '100%',
        height: '100%',
        zoom: zoom,
        zoomControl: true,
        scrollwheel: true
      });

      tmapRef.current = map;
      setIsLoaded(true);
      setError(null);

      // 지도 클릭 이벤트
      if (onMapClick) {
        map.addListener('click', (evt: any) => {
          try {
            const latLng = evt.latLng;
            onMapClick({
              lat: latLng.lat(),
              lng: latLng.lng()
            });
          } catch (err) {
            console.error('지도 클릭 이벤트 오류:', err);
          }
        });
      }

    } catch (err) {
      console.error('TMAP 지도 초기화 실패:', err);
      const errorMessage = err instanceof Error ? err.message : 'TMAP 지도를 로드할 수 없습니다.';
      
      // API 키가 없거나 타임아웃인 경우 특별 처리
      if (errorMessage === 'TMAP_API_KEY_NOT_SET' || errorMessage === 'TMAP_API_LOAD_TIMEOUT') {
        setError('TMAP_API_KEY_NOT_SET'); // 특별한 에러 코드로 설정
        // 부모 컴포넌트에 에러 알림
        if (onError) {
          onError('TMAP_API_KEY_NOT_SET');
        }
      } else {
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      }
      setIsLoaded(false);
    }
  }, [center, zoom, onMapClick, onError, loadTmapAPI]);

  // 지도 초기화
  useEffect(() => {
    initializeMap();

    return () => {
      // 정리
      if (tmapRef.current) {
        try {
          tmapRef.current.destroy();
        } catch (e) {
          console.warn('TMAP 지도 정리 중 오류:', e);
        }
        tmapRef.current = null;
      }
      markersRef.current = [];
    };
  }, [initializeMap]);

  // 중심점 및 줌 업데이트
  useEffect(() => {
    if (!tmapRef.current || !isLoaded) return;

    try {
      tmapRef.current.setCenter(new window.Tmapv2.LatLng(center.lat, center.lng));
      tmapRef.current.setZoom(zoom);
    } catch (err) {
      console.warn('지도 중심점 업데이트 실패:', err);
    }
  }, [center, zoom, isLoaded]);

  // 마커 추가 함수
  const addMarker = useCallback((map: any, location: { lat: number; lng: number }, title: string, type: 'start' | 'end' | 'current') => {
    let iconUrl = 'https://tmapapi.sktelecom.com/upload/tmap/marker/pin_b_m_s.png';
    
    if (type === 'start') {
      iconUrl = 'https://tmapapi.sktelecom.com/upload/tmap/marker/pin_g_m_s.png'; // 초록색
    } else if (type === 'end') {
      iconUrl = 'https://tmapapi.sktelecom.com/upload/tmap/marker/pin_r_m_s.png'; // 빨간색
    } else if (type === 'current') {
      iconUrl = 'https://tmapapi.sktelecom.com/upload/tmap/marker/pin_b_m_s.png'; // 파란색
    }

    const marker = new window.Tmapv2.Marker({
      position: new window.Tmapv2.LatLng(location.lat, location.lng),
      icon: iconUrl,
      iconSize: new window.Tmapv2.Size(24, 38),
      title: title,
      map: map
    });

    return marker;
  }, []);

  // 마커 업데이트
  useEffect(() => {
    if (!tmapRef.current || !isLoaded || !window.Tmapv2) return;

    // 기존 마커 제거
    markersRef.current.forEach((marker: any) => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    // 새 마커 추가
    markers.forEach((markerData) => {
      try {
        let type: 'start' | 'end' | 'current' = 'current';
        
        if (markerData.type) {
          type = markerData.type;
        } else if (markerData.label === '📍' || markerData.title === '현재 위치') {
          type = 'current';
        } else if (markerData.label === '시작' || markerData.title === '시작 위치') {
          type = 'start';
        } else if (markerData.label === '도착' || markerData.title?.includes('도착')) {
          type = 'end';
        }

        const marker = addMarker(tmapRef.current, markerData.position, markerData.title || markerData.label || '', type);
        markersRef.current.push(marker);
      } catch (err) {
        console.warn('마커 생성 실패:', err);
      }
    });

    return () => {
      markersRef.current.forEach((marker: any) => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];
    };
  }, [tmapRef.current, isLoaded, markers, addMarker]);

  if (error) {
    // TMAP API 키가 없는 경우 Google Maps로 폴백하도록 부모 컴포넌트에 알림
    if (error === 'TMAP_API_KEY_NOT_SET') {
      return (
        <div className={`${className} flex items-center justify-center bg-gray-100 text-gray-600`}>
          <div className="text-center p-4">
            <p className="text-sm text-yellow-600 mb-2">⚠️ TMAP API 키가 설정되지 않았습니다.</p>
            <p className="text-xs text-gray-500">Google Maps로 전환 중...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 text-gray-600`}>
        <div className="text-center p-4">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    // 타임아웃 설정 (10초 후 에러 표시)
    useEffect(() => {
      const timeout = setTimeout(() => {
        if (!isLoaded && !error) {
          console.warn('TMAP 지도 로딩 타임아웃');
          setError('TMAP_API_KEY_NOT_SET');
        }
      }, 10000);
      return () => clearTimeout(timeout);
    }, [isLoaded, error]);

    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">TMAP 지도 로딩 중...</p>
          <p className="text-gray-400 text-xs mt-2">10초 이상 걸리면 Google Maps로 전환됩니다</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapRef} className={className} style={{ width: '100%', height: '100%' }} />
  );
}

