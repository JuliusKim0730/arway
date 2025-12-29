/**
 * SCQ Intelligence Layer 통합 컴포넌트
 * 
 * AR 네비게이션 실행 페이지에 통합하여 사용
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useSCQ } from '@/hooks/useSCQ';
import { GPSLocation, Geofence } from '@/lib/scq';
import { useGeolocationWatcher } from '@/hooks/useGeolocationWatcher';
import { useNavigationStore } from '@/store/navigationStore';

interface SCQIntegrationProps {
  route?: {
    steps: Array<{
      distance: number;
      instruction: string;
      startLocation: { lat: number; lng: number };
      endLocation: { lat: number; lng: number };
      bearing: number;
    }>;
    polyline?: Array<{ lat: number; lng: number }>;
  };
  geofences?: Geofence[];
  poiDatabase?: Array<any>;
  userGoal?: {
    targetPoiId?: string;
    interestCategories?: string[];
  };
  onIndoorModeChange?: (isIndoor: boolean) => void;
  onARActionChange?: (action: any) => void;
  onPOIChange?: (pois: any[]) => void;
}

export function SCQIntegration({
  route,
  geofences = [],
  poiDatabase = [],
  userGoal,
  onIndoorModeChange,
  onARActionChange,
  onPOIChange,
}: SCQIntegrationProps) {
  const { currentLocation } = useGeolocationWatcher();
  const { targetLocation } = useNavigationStore();
  
  const [isIndoor, setIsIndoor] = useState(false);
  const [arAction, setArAction] = useState<any>(null);
  const [pois, setPois] = useState<any[]>([]);
  
  // SCQ Orchestrator 사용
  const { output, isInitialized, error, tick } = useSCQ({
    enabled: true,
    maxHz: 5,
    onResult: (result) => {
      // 실내/실외 모드 변경
      if (result.indoorOutdoor.ok) {
        const newIsIndoor = result.indoorOutdoor.data.mode === 'INDOOR';
        if (newIsIndoor !== isIndoor) {
          setIsIndoor(newIsIndoor);
          onIndoorModeChange?.(newIsIndoor);
        }
      }
      
      // AR 행동 지시
      if (result.arGuidance.ok) {
        setArAction(result.arGuidance.data);
        onARActionChange?.(result.arGuidance.data);
      }
      
      // POI 인식
      if (result.poiRecognition?.ok) {
        setPois(result.poiRecognition.data.topPois);
        onPOIChange?.(result.poiRecognition.data.topPois);
      }
    },
  });
  
  // GPS 위치 업데이트 시 SCQ 틱 실행
  useEffect(() => {
    if (!isInitialized || !currentLocation || !tick) return;
    
    // 디바운싱: 1초마다 실행
    const timeoutId = setTimeout(() => {
      const gps: GPSLocation = {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        accuracy: 10, // 실제로는 GPS accuracy 사용
        heading: 0, // 실제로는 heading 사용
        timestamp: Date.now(),
      };
      
      tick({
        gps,
        geofences,
        route,
        poiDatabase,
        userGoal,
      }).catch((err) => {
        console.error('SCQ tick error:', err);
      });
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [isInitialized, currentLocation, geofences, route, poiDatabase, userGoal, tick]);
  
  // 에러 표시
  if (error) {
    console.warn('SCQ error:', error);
  }
  
  // UI는 부모 컴포넌트에서 처리
  return null;
}

