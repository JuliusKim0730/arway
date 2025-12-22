/**
 * Google Maps API 클라이언트
 * JavaScript SDK를 사용한 경로 계산 (CORS 문제 해결)
 */

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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

/**
 * Google Maps Directions Service를 사용한 경로 계산 (SDK 방식)
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

  // Google Maps JavaScript API가 로드되었는지 확인
  if (typeof window === 'undefined' || !window.google || !window.google.maps) {
    throw new Error('Google Maps JavaScript API가 로드되지 않았습니다.');
  }

  return new Promise((resolve, reject) => {
    try {
      const directionsService = new window.google.maps.DirectionsService();
      
      // 이동 모드 매핑
      let travelMode: any;
      switch (mode) {
        case 'walking':
          travelMode = window.google.maps.TravelMode.WALKING;
          break;
        case 'driving':
          travelMode = window.google.maps.TravelMode.DRIVING;
          break;
        case 'transit':
          travelMode = window.google.maps.TravelMode.TRANSIT;
          break;
        default:
          travelMode = window.google.maps.TravelMode.WALKING;
      }

      const request = {
        origin: new window.google.maps.LatLng(origin.lat, origin.lng),
        destination: new window.google.maps.LatLng(destination.lat, destination.lng),
        travelMode: travelMode,
        language: 'ko', // 한국어 안내
        avoidHighways: mode === 'walking', // 도보 시 고속도로 회피
        avoidTolls: mode === 'walking', // 도보 시 유료도로 회피
      };

      directionsService.route(request, (result: any, status: any) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          try {
            const route = result.routes[0];
            const leg = route.legs[0];

            if (!leg.steps || leg.steps.length === 0) {
              reject(new Error('경로 단계 정보가 없습니다.'));
              return;
            }

            // 첫 번째 단계의 방향을 초기 방향으로 사용
            const firstStep = leg.steps[0];
            const initialBearing = calculateBearing(
              { 
                lat: firstStep.start_location.lat(), 
                lng: firstStep.start_location.lng() 
              },
              { 
                lat: firstStep.end_location.lat(), 
                lng: firstStep.end_location.lng() 
              }
            );

            const processedRoute: GoogleMapsRoute = {
              distance: leg.distance.value, // 미터
              duration: leg.duration.value, // 초
              steps: leg.steps.map((step: any) => ({
                distance: step.distance.value,
                duration: step.duration.value,
                instruction: step.instructions.replace(/<[^>]*>/g, ''), // HTML 태그 제거
                startLocation: {
                  lat: step.start_location.lat(),
                  lng: step.start_location.lng(),
                },
                endLocation: {
                  lat: step.end_location.lat(),
                  lng: step.end_location.lng(),
                },
                bearing: calculateBearing(
                  { 
                    lat: step.start_location.lat(), 
                    lng: step.start_location.lng() 
                  },
                  { 
                    lat: step.end_location.lat(), 
                    lng: step.end_location.lng() 
                  }
                ),
              })),
              polyline: route.overview_polyline,
              startLocation: {
                lat: leg.start_location.lat(),
                lng: leg.start_location.lng(),
              },
              endLocation: {
                lat: leg.end_location.lat(),
                lng: leg.end_location.lng(),
              },
              initialBearing,
            };

            resolve(processedRoute);
          } catch (error) {
            reject(new Error(`경로 데이터 처리 중 오류: ${error instanceof Error ? error.message : String(error)}`));
          }
        } else {
          let errorMessage = '경로를 찾을 수 없습니다.';
          
          switch (status) {
            case window.google.maps.DirectionsStatus.NOT_FOUND:
              errorMessage = '출발지 또는 목적지를 찾을 수 없습니다.';
              break;
            case window.google.maps.DirectionsStatus.ZERO_RESULTS:
              errorMessage = '경로를 찾을 수 없습니다. 다른 이동 수단을 시도해보세요.';
              break;
            case window.google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED:
              errorMessage = '경유지가 너무 많습니다.';
              break;
            case window.google.maps.DirectionsStatus.INVALID_REQUEST:
              errorMessage = '잘못된 경로 요청입니다.';
              break;
            case window.google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
              errorMessage = 'API 사용량 한도를 초과했습니다.';
              break;
            case window.google.maps.DirectionsStatus.REQUEST_DENIED:
              errorMessage = 'API 요청이 거부되었습니다.';
              break;
            case window.google.maps.DirectionsStatus.UNKNOWN_ERROR:
              errorMessage = '알 수 없는 오류가 발생했습니다.';
              break;
            default:
              errorMessage = `경로 계산 실패 (상태: ${status})`;
          }
          
          reject(new Error(errorMessage));
        }
      });
    } catch (error) {
      reject(new Error(`Directions Service 초기화 실패: ${error instanceof Error ? error.message : String(error)}`));
    }
  });
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

/**
 * Google Places API로 장소 검색 (JavaScript SDK 사용)
 */
export async function searchPlaces(
  query: string,
  location?: { lat: number; lng: number },
  radius?: number
): Promise<PlaceResult[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API 키가 설정되지 않았습니다.');
  }

  // Google Maps JavaScript API가 로드되었는지 확인
  if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.places) {
    throw new Error('Google Maps JavaScript API 또는 Places 라이브러리가 로드되지 않았습니다.');
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
 * Google Places Autocomplete API (JavaScript SDK 사용)
 */
interface AutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export async function autocompletePlaces(
  input: string,
  location?: { lat: number; lng: number }
): Promise<AutocompletePrediction[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API 키가 설정되지 않았습니다.');
  }

  // Google Maps JavaScript API가 로드되었는지 확인
  if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.places) {
    throw new Error('Google Maps JavaScript API 또는 Places 라이브러리가 로드되지 않았습니다.');
  }

  return new Promise((resolve, reject) => {
    try {
      const service = new window.google.maps.places.AutocompleteService();
      
      const request: any = {
        input: input,
        language: 'ko',
      };

      if (location) {
        request.location = new window.google.maps.LatLng(location.lat, location.lng);
        request.radius = 5000;
      }

      service.getPlacePredictions(request, (predictions: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          resolve(predictions);
        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new Error(`자동완성 검색 실패 (상태: ${status})`));
        }
      });
    } catch (error) {
      reject(error instanceof Error ? error : new Error('자동완성 검색 중 오류가 발생했습니다.'));
    }
  });
}

/**
 * Place ID로 장소 상세 정보 가져오기 (JavaScript SDK 사용)
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceResult> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API 키가 설정되지 않았습니다.');
  }

  // Google Maps JavaScript API가 로드되었는지 확인
  if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.places) {
    throw new Error('Google Maps JavaScript API 또는 Places 라이브러리가 로드되지 않았습니다.');
  }

  return new Promise((resolve, reject) => {
    try {
      const service = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );

      const request = {
        placeId: placeId,
        language: 'ko',
        fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types', 'rating', 'user_ratings_total'],
      };

      service.getDetails(request, (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          resolve({
            place_id: place.place_id,
            name: place.name,
            formatted_address: place.formatted_address,
            geometry: {
              location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              },
            },
            types: place.types,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
          });
        } else {
          reject(new Error(`장소 정보 가져오기 실패 (상태: ${status})`));
        }
      });
    } catch (error) {
      reject(error instanceof Error ? error : new Error('장소 정보 가져오기 중 오류가 발생했습니다.'));
    }
  });
}

