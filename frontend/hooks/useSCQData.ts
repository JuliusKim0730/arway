/**
 * SCQ 데이터 로드 훅
 */

import { useEffect, useState } from 'react';
import { fetchGeofences, fetchIndoorMaps, fetchPOIs } from '@/lib/api/scq';
import { Geofence, POI } from '@/lib/scq/types';

interface UseSCQDataOptions {
  currentLocation?: { lat: number; lng: number };
  buildingId?: string;
  indoorMapId?: string;
  enabled?: boolean;
}

export function useSCQData(options: UseSCQDataOptions = {}) {
  const { currentLocation, buildingId, indoorMapId, enabled = true } = options;
  
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [indoorMaps, setIndoorMaps] = useState<any[]>([]);
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 지오펜스 로드
  useEffect(() => {
    if (!enabled) return;
    
    const loadGeofences = async () => {
      try {
        setLoading(true);
        const data = await fetchGeofences({
          lat: currentLocation?.lat,
          lng: currentLocation?.lng,
          radius: 1000,
          building_id: buildingId,
        });
        setGeofences(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load geofences');
        console.error('Failed to load geofences:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadGeofences();
  }, [enabled, currentLocation?.lat, currentLocation?.lng, buildingId]);
  
  // 실내 맵 로드
  useEffect(() => {
    if (!enabled || !buildingId) return;
    
    const loadIndoorMaps = async () => {
      try {
        setLoading(true);
        const data = await fetchIndoorMaps({ building_id: buildingId });
        setIndoorMaps(data);
      } catch (err) {
        console.error('Failed to load indoor maps:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadIndoorMaps();
  }, [enabled, buildingId]);
  
  // POI 로드
  useEffect(() => {
    if (!enabled) return;
    
    const loadPOIs = async () => {
      try {
        setLoading(true);
        const data = await fetchPOIs({
          lat: currentLocation?.lat,
          lng: currentLocation?.lng,
          radius: 100,
          indoor_map_id: indoorMapId,
          limit: 50,
        });
        setPois(data);
      } catch (err) {
        console.error('Failed to load POIs:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadPOIs();
  }, [enabled, currentLocation?.lat, currentLocation?.lng, indoorMapId]);
  
  return {
    geofences,
    indoorMaps,
    pois,
    loading,
    error,
  };
}

