/**
 * TMAP 경로 데이터 파서
 * TMAP API 응답을 AR 네비게이션에 최적화된 형식으로 변환
 */

interface Location {
  lat: number;
  lng: number;
}

interface TmapFeature {
  geometry: {
    type: string;
    coordinates: number[][];
  };
  properties: {
    totalDistance?: number;
    totalTime?: number;
    description?: string;
    turnType?: string;
    pointType?: string;
    index?: number;
    lineIndex?: number;
    distance?: number;
    time?: number;
  };
}

interface TmapResponse {
  features: TmapFeature[];
  type: string;
}

export interface TmapRouteStep {
  distance: number;
  duration: number;
  instruction: string;
  startLocation: Location;
  endLocation: Location;
  bearing: number;
  turnType?: string;
  pointType?: string;
}

export interface TmapRoute {
  distance: number;
  duration: number;
  steps: TmapRouteStep[];
  path: Location[];
  polyline: string;
  startLocation: Location;
  endLocation: Location;
  initialBearing: number;
}

/**
 * TMAP API 응답을 AR 네비게이션 형식으로 변환
 */
export function parseTmapRouteResponse(
  data: TmapResponse,
  origin: Location,
  destination: Location
): TmapRoute {
  const path: Location[] = [];
  const steps: TmapRouteStep[] = [];
  let totalDistance = 0;
  let totalTime = 0;

  // 좌표 추출 및 경로 단계 생성
  data.features.forEach((feature, index) => {
    // 경로 좌표 추출
    if (feature.geometry.type === 'LineString' && feature.geometry.coordinates) {
      feature.geometry.coordinates.forEach((coord) => {
        path.push({
          lat: coord[1],
          lng: coord[0],
        });
      });
    }

    // Point 타입의 경우 단계 정보 추출
    if (feature.geometry.type === 'Point') {
      const coord = feature.geometry.coordinates;
      const pointLocation: Location = {
        lat: coord[1],
        lng: coord[0],
      };

      // 이전 Point까지의 거리 계산
      let stepDistance = 0;
      let stepDuration = 0;
      
      if (feature.properties.distance) {
        stepDistance = feature.properties.distance;
      }
      
      if (feature.properties.time) {
        stepDuration = feature.properties.time;
      }

      // 다음 Point 위치 찾기
      let nextLocation = destination;
      if (index < data.features.length - 1) {
        const nextFeature = data.features[index + 1];
        if (nextFeature.geometry.type === 'Point' && nextFeature.geometry.coordinates) {
          nextLocation = {
            lat: nextFeature.geometry.coordinates[1],
            lng: nextFeature.geometry.coordinates[0],
          };
        }
      }

      // 방향 계산 (bearing)
      const bearing = calculateBearing(pointLocation, nextLocation);

      // 안내 문구 생성
      const instruction = generateInstruction(
        feature.properties.description || '',
        feature.properties.turnType,
        stepDistance
      );

      steps.push({
        distance: stepDistance,
        duration: stepDuration,
        instruction,
        startLocation: pointLocation,
        endLocation: nextLocation,
        bearing,
        turnType: feature.properties.turnType,
        pointType: feature.properties.pointType,
      });
    }

    // 전체 거리 및 시간 누적
    if (feature.properties.totalDistance) {
      totalDistance = feature.properties.totalDistance;
    }
    if (feature.properties.totalTime) {
      totalTime = feature.properties.totalTime;
    }
  });

  // 경로가 비어있으면 출발지와 도착지를 직접 연결
  if (path.length === 0) {
    path.push(origin);
    path.push(destination);
  }

  // 단계가 없으면 기본 단계 생성
  if (steps.length === 0) {
    const bearing = calculateBearing(origin, destination);
    steps.push({
      distance: totalDistance || calculateDistance(origin, destination),
      duration: totalTime || 0,
      instruction: '목적지까지 직진하세요',
      startLocation: origin,
      endLocation: destination,
      bearing,
    });
  }

  // 초기 방향 계산
  const initialBearing = steps.length > 0 ? steps[0].bearing : calculateBearing(origin, destination);

  // Polyline 생성 (간단한 인코딩)
  const polyline = encodePolyline(path);

  return {
    distance: totalDistance || calculateDistance(origin, destination),
    duration: totalTime || 0,
    steps,
    path,
    polyline,
    startLocation: origin,
    endLocation: destination,
    initialBearing,
  };
}

/**
 * 두 지점 간 방향(bearing) 계산
 */
function calculateBearing(from: Location, to: Location): number {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;

  const x = Math.sin(deltaLng) * Math.cos(lat2);
  const y =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  const bearing = Math.atan2(x, y);
  return ((bearing * 180) / Math.PI + 360) % 360;
}

/**
 * 두 지점 간 거리 계산 (미터)
 */
function calculateDistance(from: Location, to: Location): number {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = (from.lat * Math.PI) / 180;
  const φ2 = (to.lat * Math.PI) / 180;
  const Δφ = ((to.lat - from.lat) * Math.PI) / 180;
  const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 안내 문구 생성
 */
function generateInstruction(
  description: string,
  turnType?: string,
  distance?: number
): string {
  // TMAP의 turnType에 따른 안내 문구
  const turnTypeMap: Record<string, string> = {
    '11': '직진',
    '12': '우회전',
    '13': '좌회전',
    '14': '유턴',
    '15': '우측 유턴',
    '16': '좌측 유턴',
    '17': '우측 방면',
    '18': '좌측 방면',
    '19': '우측 대각선',
    '20': '좌측 대각선',
    '21': '우측 후진',
    '22': '좌측 후진',
  };

  let instruction = description || '';

  // turnType이 있으면 더 구체적인 안내
  if (turnType && turnTypeMap[turnType]) {
    instruction = `${turnTypeMap[turnType]}하세요`;
  }

  // 거리 정보 추가
  if (distance && distance > 0) {
    if (distance < 1000) {
      instruction += ` (${Math.round(distance)}m)`;
    } else {
      instruction += ` (${(distance / 1000).toFixed(1)}km)`;
    }
  }

  return instruction || '목적지까지 직진하세요';
}

/**
 * 간단한 Polyline 인코딩 (Google Maps 형식 호환)
 */
function encodePolyline(path: Location[]): string {
  if (path.length === 0) return '';

  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  path.forEach((point) => {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);

    const dLat = lat - prevLat;
    const dLng = lng - prevLng;

    encoded += encodeValue(dLat);
    encoded += encodeValue(dLng);

    prevLat = lat;
    prevLng = lng;
  });

  return encoded;
}

/**
 * Polyline 값 인코딩
 */
function encodeValue(value: number): string {
  let encoded = '';
  let valueToEncode = value < 0 ? ~(value << 1) : value << 1;

  while (valueToEncode >= 0x20) {
    encoded += String.fromCharCode((0x20 | (valueToEncode & 0x1f)) + 63);
    valueToEncode >>= 5;
  }

  encoded += String.fromCharCode(valueToEncode + 63);
  return encoded;
}

