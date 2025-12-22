/**
 * Google Maps API 클라이언트
 * Directions API를 사용한 경로 계산
 */

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_API_URL = 'https://maps.googleapis.com/maps/api';

export interface GoogleMapsRoute {
  distance: number; // 미터
  duration: number; // 초
  steps: RouteStep[];
  polyline: string; // 경로 좌표 (polyline 인코딩)
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  initialBearing: number; // 첫 번째 단계의 방향 (0-360도)
}

export interface RouteStep {
  distance: number; // 미터
  duration: number; // 초
  instruction: string; // 안내 문구
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  bearing: number; // 방향 (0-360도)
}

interface GoogleMapsApiStep {
  distance: { value: number; text: string };
  duration: { value: number; text: string };
  html_instructions: string;
  start_location: { lat: number; lng: number };
  end_location: { lat: number; lng: number };
}

interface GoogleMapsApiLeg {
  distance: { value: number; text: string };
  duration: { value: number; text: string };
  steps: GoogleMapsApiStep[];
  start_location: { lat: number; lng: number };
  end_location: { lat: number; lng: number };
}

interface GoogleMapsApiRoute {
  legs: GoogleMapsApiLeg[];
  overview_polyline: { points: string };
}

interface DirectionsResponse {
  routes: GoogleMapsApiRoute[];
  status: string;
  error_message?: string;
}

/**
 * Google Maps Directions API 호출
 * @param origin 출발지 좌표
 * @param destination 목적지 좌표
 * @param mode 이동 모드 (walking, driving, transit)
 * @returns 경로 정보
 */
export async function getDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: 'walking' | 'driving' | 'transit' = 'walking'
): Promise<GoogleMapsRoute> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API 키가 설정되지 않았습니다.');
  }

  const url = `${GOOGLE_MAPS_API_URL}/directions/json`;
  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode: mode,
    key: GOOGLE_MAPS_API_KEY,
    language: 'ko', // 한국어 안내
    alternatives: 'false', // 단일 경로만 반환
  });

  try {
    const response = await fetch(`${url}?${params.toString()}`);
    const data: DirectionsResponse = await response.json();

    if (data.status !== 'OK') {
      throw new Error(
        data.error_message || 
        `경로를 찾을 수 없습니다. (상태: ${data.status})`
      );
    }

    if (!data.routes || data.routes.length === 0) {
      throw new Error('경로를 찾을 수 없습니다.');
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    if (!leg.steps || leg.steps.length === 0) {
      throw new Error('경로 단계 정보가 없습니다.');
    }

    // 첫 번째 단계의 방향을 초기 방향으로 사용
    const firstStep = leg.steps[0];
    const initialBearing = calculateBearing(
      { lat: firstStep.start_location.lat, lng: firstStep.start_location.lng },
      { lat: firstStep.end_location.lat, lng: firstStep.end_location.lng }
    );

    return {
      distance: leg.distance.value, // 미터
      duration: leg.duration.value, // 초
      steps: leg.steps.map(step => ({
        distance: step.distance.value,
        duration: step.duration.value,
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // HTML 태그 제거
        startLocation: {
          lat: step.start_location.lat,
          lng: step.start_location.lng,
        },
        endLocation: {
          lat: step.end_location.lat,
          lng: step.end_location.lng,
        },
        bearing: calculateBearing(
          { lat: step.start_location.lat, lng: step.start_location.lng },
          { lat: step.end_location.lat, lng: step.end_location.lng }
        ),
      })),
      polyline: route.overview_polyline.points,
      startLocation: {
        lat: leg.start_location.lat,
        lng: leg.start_location.lng,
      },
      endLocation: {
        lat: leg.end_location.lat,
        lng: leg.end_location.lng,
      },
      initialBearing,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('경로 계산 중 오류가 발생했습니다.');
  }
}

/**
 * 두 지점 간의 방위각 계산 (0-360도)
 */
function calculateBearing(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;

  const x = Math.sin(deltaLng) * Math.cos(lat2);
  const y =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  const bearing = Math.atan2(x, y);
  const bearingDegrees = (bearing * 180) / Math.PI;

  return (bearingDegrees + 360) % 360;
}

/**
 * Google Maps API 사용 가능 여부 확인
 */
export function isGoogleMapsAvailable(): boolean {
  return !!GOOGLE_MAPS_API_KEY;
}

/**
 * Google Places API - 장소 검색
 */
export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  rating?: number;
  user_ratings_total?: number;
}

interface PlacesApiResponse {
  results: Array<{
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    types: string[];
    rating?: number;
    user_ratings_total?: number;
  }>;
  status: string;
  error_message?: string;
}

/**
 * Google Places API로 장소 검색
 */
export async function searchPlaces(
  query: string,
  location?: { lat: number; lng: number },
  radius?: number
): Promise<PlaceResult[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API 키가 설정되지 않았습니다.');
  }

  const url = `${GOOGLE_MAPS_API_URL}/place/textsearch/json`;
  const params = new URLSearchParams({
    query: query,
    key: GOOGLE_MAPS_API_KEY,
    language: 'ko',
  });

  // 현재 위치 기반 검색 (선택사항)
  if (location) {
    params.append('location', `${location.lat},${location.lng}`);
    if (radius) {
      params.append('radius', radius.toString());
    } else {
      params.append('radius', '5000'); // 기본 5km
    }
  }

  // Google Maps JavaScript API가 로드되었는지 확인
  if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.places) {
    // JavaScript API가 없으면 REST API 사용 (백엔드 프록시 필요)
    try {
      const response = await fetch(`${url}?${params.toString()}`);
      const data: PlacesApiResponse = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(
          data.error_message || 
          `장소 검색 실패 (상태: ${data.status})`
        );
      }

      if (!data.results || data.results.length === 0) {
        return [];
      }

      return data.results.map(result => ({
        place_id: result.place_id,
        name: result.name,
        formatted_address: result.formatted_address,
        geometry: {
          location: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
          },
        },
        types: result.types,
        rating: result.rating,
        user_ratings_total: result.user_ratings_total,
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('장소 검색 중 오류가 발생했습니다.');
    }
  }

  // JavaScript API 사용 (CORS 문제 없음)
  return new Promise((resolve, reject) => {
    try {
      const service = new window.google.maps.places.PlacesService(
        document.createElement('div') // 더미 div
      );

      const request: any = {
        query: query,
        language: 'ko',
      };

      if (location) {
        request.location = new window.google.maps.LatLng(location.lat, location.lng);
        request.radius = radius || 5000;
      }

      service.textSearch(request, (results: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const places: PlaceResult[] = results.map((place: any) => ({
            place_id: place.place_id,
            name: place.name,
            formatted_address: place.formatted_address || place.vicinity || '',
            geometry: {
              location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              },
            },
            types: place.types || [],
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
          }));
          resolve(places);
        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new Error(`장소 검색 실패 (상태: ${status})`));
        }
      });
    } catch (error) {
      reject(error instanceof Error ? error : new Error('장소 검색 중 오류가 발생했습니다.'));
    }
  });
}

/**
 * Google Places Autocomplete API
 */
interface AutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AutocompleteResponse {
  predictions: AutocompletePrediction[];
  status: string;
  error_message?: string;
}

export async function autocompletePlaces(
  input: string,
  location?: { lat: number; lng: number }
): Promise<AutocompletePrediction[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API 키가 설정되지 않았습니다.');
  }

  const url = `${GOOGLE_MAPS_API_URL}/place/autocomplete/json`;
  const params = new URLSearchParams({
    input: input,
    key: GOOGLE_MAPS_API_KEY,
    language: 'ko',
  });

  // 현재 위치 기반 검색 (선택사항)
  if (location) {
    params.append('location', `${location.lat},${location.lng}`);
    params.append('radius', '5000');
  }

  try {
    const response = await fetch(`${url}?${params.toString()}`);
    const data: AutocompleteResponse = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(
        data.error_message || 
        `자동완성 검색 실패 (상태: ${data.status})`
      );
    }

    return data.predictions || [];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('자동완성 검색 중 오류가 발생했습니다.');
  }
}

/**
 * Place ID로 장소 상세 정보 가져오기
 */
interface PlaceDetailsResponse {
  result: {
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    types: string[];
    rating?: number;
    user_ratings_total?: number;
    photos?: Array<{
      photo_reference: string;
    }>;
  };
  status: string;
  error_message?: string;
}

export async function getPlaceDetails(placeId: string): Promise<PlaceResult> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API 키가 설정되지 않았습니다.');
  }

  const url = `${GOOGLE_MAPS_API_URL}/place/details/json`;
  const params = new URLSearchParams({
    place_id: placeId,
    key: GOOGLE_MAPS_API_KEY,
    language: 'ko',
    fields: 'place_id,name,formatted_address,geometry,types,rating,user_ratings_total',
  });

  try {
    const response = await fetch(`${url}?${params.toString()}`);
    const data: PlaceDetailsResponse = await response.json();

    if (data.status !== 'OK') {
      throw new Error(
        data.error_message || 
        `장소 정보 가져오기 실패 (상태: ${data.status})`
      );
    }

    const result = data.result;
    return {
      place_id: result.place_id,
      name: result.name,
      formatted_address: result.formatted_address,
      geometry: {
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
      },
      types: result.types,
      rating: result.rating,
      user_ratings_total: result.user_ratings_total,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('장소 정보 가져오기 중 오류가 발생했습니다.');
  }
}

