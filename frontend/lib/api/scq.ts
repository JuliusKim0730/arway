/**
 * SCQ Intelligence Layer API 클라이언트
 */

import { apiGet } from '../apiClient';
import { Geofence, POI } from '../scq/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * 지오펜스 목록 조회
 */
export async function fetchGeofences(params?: {
  lat?: number;
  lng?: number;
  radius?: number;
  type?: 'building' | 'indoor_zone' | 'outdoor_area';
  building_id?: string;
}): Promise<Geofence[]> {
  const queryParams = new URLSearchParams();
  if (params?.lat !== undefined) queryParams.append('lat', params.lat.toString());
  if (params?.lng !== undefined) queryParams.append('lng', params.lng.toString());
  if (params?.radius !== undefined) queryParams.append('radius', params.radius.toString());
  if (params?.type) queryParams.append('geofence_type', params.type);
  if (params?.building_id) queryParams.append('building_id', params.building_id);
  
  const url = `/api/v1/geofences${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return await apiGet<Geofence[]>(url);
}

/**
 * 실내 맵 목록 조회
 */
export async function fetchIndoorMaps(params?: {
  building_id?: string;
  floor?: number;
}): Promise<any[]> {
  const queryParams = new URLSearchParams();
  if (params?.building_id) queryParams.append('building_id', params.building_id);
  if (params?.floor !== undefined) queryParams.append('floor', params.floor.toString());
  
  const url = `/api/v1/indoor-maps${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return await apiGet<any[]>(url);
}

/**
 * 실내 맵 상세 조회
 */
export async function fetchIndoorMapDetail(indoorMapId: string): Promise<any> {
  return await apiGet<any>(`/api/v1/indoor-maps/${indoorMapId}`);
}

/**
 * POI 목록 조회
 */
export async function fetchPOIs(params?: {
  lat?: number;
  lng?: number;
  radius?: number;
  poi_type?: string;
  indoor_map_id?: string;
  zone_id?: string;
  floor?: number;
  min_priority?: number;
  limit?: number;
  skip?: number;
}): Promise<POI[]> {
  const queryParams = new URLSearchParams();
  if (params?.lat !== undefined) queryParams.append('lat', params.lat.toString());
  if (params?.lng !== undefined) queryParams.append('lng', params.lng.toString());
  if (params?.radius !== undefined) queryParams.append('radius', params.radius.toString());
  if (params?.poi_type) queryParams.append('poi_type', params.poi_type);
  if (params?.indoor_map_id) queryParams.append('indoor_map_id', params.indoor_map_id);
  if (params?.zone_id) queryParams.append('zone_id', params.zone_id);
  if (params?.floor !== undefined) queryParams.append('floor', params.floor.toString());
  if (params?.min_priority !== undefined) queryParams.append('min_priority', params.min_priority.toString());
  if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
  if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
  
  const url = `/api/v1/pois${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return await apiGet<POI[]>(url);
}

/**
 * 실내 POI 근처 검색
 */
export async function fetchNearbyIndoorPOIs(
  indoorMapId: string,
  x: number,
  y: number,
  radius: number = 50,
  limit: number = 10
): Promise<POI[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('x', x.toString());
  queryParams.append('y', y.toString());
  queryParams.append('radius', radius.toString());
  queryParams.append('limit', limit.toString());
  
  return await apiGet<POI[]>(`/api/v1/pois/indoor/${indoorMapId}/nearby?${queryParams.toString()}`);
}

