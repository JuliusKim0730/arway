/**
 * AR Navigation Manager
 * GPS 위치 감지 후 한국이면 TMAP API, 해외면 Google Maps API 사용
 */

import { loadGoogleMaps, isGoogleMapsAvailable } from '../utils/googleMapsLoader';
import { DebugHelper } from '../utils/debugHelper';

interface Location {
  lat: number;
  lng: number;
}

interface NavigationRoute {
  path: Location[];
  distance: number;
  duration: number;
  instructions: string[];
}

interface TmapResponse {
  features: Array<{
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
      distance?: number;
      time?: number;
    };
  }>;
}

export class ARNavigationManager {
  private isKorea: boolean = false;
  private googleDirectionsService: any | null = null;
  private tmapApiKey: string;
  private errorCount: number = 0;
  private maxRetries: number = 3;
  private lastError: string | null = null;

  constructor(tmapApiKey?: string) {
    // Next.js 환경에서 환경변수 접근 방법
    const nextTmapKey = process.env.NEXT_PUBLIC_TMAP_API_KEY;
    const reactTmapKey = process.env.REACT_APP_TMAP_API_KEY;
    
    this.tmapApiKey = tmapApiKey || 
                     nextTmapKey ||
                     reactTmapKey ||
                     (window as any).__TMAP_API_KEY__ || 
                     '';
    
    console.log('🔑 환경변수 디버깅:');
    console.log('- process.env.NEXT_PUBLIC_TMAP_API_KEY:', nextTmapKey ? '설정됨' : '설정되지 않음');
    console.log('- process.env.REACT_APP_TMAP_API_KEY:', reactTmapKey ? '설정됨' : '설정되지 않음');
    console.log('- 실제 Next 키 값:', nextTmapKey);
    console.log('- 실제 React 키 값:', reactTmapKey);
    console.log('- 최종 tmapApiKey:', this.tmapApiKey ? '설정됨' : '설정되지 않음');
    console.log('- 키 길이:', this.tmapApiKey ? this.tmapApiKey.length : 0);
    console.log('- 키 시작 문자:', this.tmapApiKey ? this.tmapApiKey.substring(0, 4) : 'N/A');
    
    // 개발 환경에서 시스템 상태 체크
    DebugHelper.checkSystemStatus();
    
    // Google Maps API가 로드되어 있으면 DirectionsService 초기화
    if (isGoogleMapsAvailable()) {
      this.googleDirectionsService = new (window as any).google.maps.DirectionsService();
    }
  }

  /**
   * 현재 위치가 한국인지 확인 (위경도 바운더리 체크)
   * 한국의 대략적인 위경도 범위로 판단
   */
  checkIsKorea(lat: number, lng: number): boolean {
    console.log(`🌍 위치 확인 중: 위도 ${lat.toFixed(6)}, 경도 ${lng.toFixed(6)}`);
    
    // 한국 본토 + 제주도를 포함한 범위
    const koreaMainland = lat >= 33.0 && lat <= 38.9 && lng >= 124.5 && lng <= 131.9;
    
    // 독도 포함 (동해 영역)
    const dokdo = lat >= 37.2 && lat <= 37.3 && lng >= 131.8 && lng <= 131.9;
    
    const isKorea = koreaMainland || dokdo;
    
    console.log(`📍 위치 분석:
    - 위도 범위 (33.0~38.9): ${lat >= 33.0 && lat <= 38.9 ? '✅' : '❌'} (현재: ${lat})
    - 경도 범위 (124.5~131.9): ${lng >= 124.5 && lng <= 131.9 ? '✅' : '❌'} (현재: ${lng})
    - 한국 본토: ${koreaMainland ? '✅' : '❌'}
    - 독도 영역: ${dokdo ? '✅' : '❌'}
    - 최종 결과: ${isKorea ? '🇰🇷 한국 (TMAP 사용)' : '🌍 해외 (Google Maps 사용)'}`);
    
    return isKorea;
  }

  /**
   * 경로 데이터 가져오기 통합 함수
   * 위치에 따라 TMAP 또는 Google Maps API 자동 선택
   * 에러 추적 및 재시도 로직 포함
   */
  async getDirections(origin: Location, destination: Location): Promise<NavigationRoute | null> {
    console.log('🚀 경로 검색 시작');
    console.log('출발지:', origin);
    console.log('도착지:', destination);
    
    const isKorea = this.checkIsKorea(origin.lat, origin.lng);
    this.isKorea = isKorea;

    // 디버그 정보 로깅
    DebugHelper.logLocationInfo(origin);
    DebugHelper.startPerformanceMeasure('경로 검색');

    console.log(`🎯 선택된 API: ${isKorea ? '🇰🇷 TMAP' : '🌍 Google Maps'}`);
    console.log(`🔑 TMAP API 키 상태: ${this.tmapApiKey ? '설정됨' : '❌ 설정되지 않음'}`);

    try {
      let result: NavigationRoute | null = null;

      if (isKorea) {
        console.log("🇰🇷 국내 위치 감지: TMAP API 기반 경로를 요청합니다.");
        
        if (!this.tmapApiKey) {
          console.warn('⚠️ TMAP API 키가 없어서 Google Maps로 폴백합니다.');
          // Google Maps API도 확인
          if (!isGoogleMapsAvailable()) {
            console.warn('⚠️ Google Maps API도 사용할 수 없습니다. 직선 경로로 폴백합니다.');
            throw new Error('API_KEY_NOT_AVAILABLE'); // 특별한 에러 코드
          }
          result = await this.getGoogleRoute(origin, destination);
        } else {
          try {
            result = await this.getTmapWalkingRoute(origin, destination);
          } catch (tmapError) {
            console.warn('⚠️ TMAP API 호출 실패, Google Maps로 폴백:', tmapError);
            // TMAP 실패 시 Google Maps로 폴백
            if (isGoogleMapsAvailable()) {
              result = await this.getGoogleRoute(origin, destination);
            } else {
              throw new Error('API_KEY_NOT_AVAILABLE');
            }
          }
        }
      } else {
        console.log("🌍 해외 위치 감지: Google Maps API 기반 경로를 요청합니다.");
        if (!isGoogleMapsAvailable()) {
          console.warn('⚠️ Google Maps API를 사용할 수 없습니다.');
          throw new Error('API_KEY_NOT_AVAILABLE');
        }
        result = await this.getGoogleRoute(origin, destination);
      }

      if (result) {
        this.resetErrorCount();
        DebugHelper.endPerformanceMeasure('경로 검색');
        DebugHelper.logAPICall(this.getCurrentService(), true, result);
        return result;
      } else {
        throw new Error('경로를 찾을 수 없습니다.');
      }
    } catch (error) {
      this.incrementErrorCount();
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      this.lastError = errorMessage;
      
      DebugHelper.endPerformanceMeasure('경로 검색');
      DebugHelper.logAPICall(this.getCurrentService(), false, null, error);
      DebugHelper.logErrorStatus(this.errorCount, this.maxRetries, this.lastError);
      
      console.error(`경로 검색 오류 (${this.errorCount}/${this.maxRetries}):`, errorMessage);
      
      if (this.errorCount >= this.maxRetries) {
        throw new Error(`길찾기 실패: ${this.maxRetries}번 시도 후 중단됨. 마지막 오류: ${errorMessage}`);
      }
      
      throw error;
    }
  }

  /**
   * [국내용] TMAP 도보 경로 API
   * SK텔레콤의 TMAP API를 사용하여 한국 내 정확한 도보 경로 제공
   */
  async getTmapWalkingRoute(origin: Location, destination: Location): Promise<NavigationRoute | null> {
    if (!this.tmapApiKey) {
      console.error('TMAP API 키가 설정되지 않았습니다.');
      throw new Error('TMAP API 키가 설정되지 않았습니다. 환경변수를 확인해주세요.');
    }

    const url = 'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json';

    try {
      console.log('🚀 TMAP API 호출 시작:', { origin, destination });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'appKey': this.tmapApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          startX: origin.lng.toString(),
          startY: origin.lat.toString(),
          endX: destination.lng.toString(),
          endY: destination.lat.toString(),
          startName: "출발지",
          endName: "목적지",
          searchOption: "0", // 0: 추천경로, 1: 최단거리, 2: 최단시간
          resCoordType: "WGS84GEO" // 좌표계 설정
        })
      });

      console.log('📡 TMAP API 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TMAP API 오류 응답:', errorText);
        throw new Error(`TMAP API 오류: ${response.status} ${response.statusText}`);
      }

      const data: TmapResponse = await response.json();
      console.log('✅ TMAP API 응답 성공:', data);
      
      const route = this.parseTmapData(data);
      console.log('🗺️ 파싱된 경로:', route);
      
      return route;

    } catch (error) {
      console.error("TMAP API 호출 에러:", error);
      
      // CORS 에러나 네트워크 에러인 경우 Google Maps로 폴백하지 않고 에러 던지기
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('TMAP API 연결 실패: 네트워크 오류 또는 CORS 문제');
      }
      
      throw error;
    }
  }

  /**
   * [해외용] Google Maps 경로 서비스
   * 전 세계 지역에서 사용 가능한 Google Maps Directions API
   */
  async getGoogleRoute(origin: Location, destination: Location): Promise<NavigationRoute | null> {
    // Google Maps API가 로드되지 않은 경우 동적 로드 시도
    if (!isGoogleMapsAvailable()) {
      try {
        console.log('📡 Google Maps API 로드 중...');
        await loadGoogleMaps();
        // DirectionsService 초기화 대기
        await this.initializeGoogleMapsWithRetry();
      } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        if (errorMessage === 'API_KEY_NOT_AVAILABLE') {
          console.warn('⚠️ Google Maps API 키가 설정되지 않았습니다.');
          throw new Error('API_KEY_NOT_AVAILABLE');
        }
        console.error('❌ Google Maps API 로드 실패:', error);
        throw error;
      }
    }

    // DirectionsService 초기화 확인 및 재시도
    if (!this.googleDirectionsService) {
      console.warn('⚠️ DirectionsService가 없습니다. 재초기화 시도...');
      await this.initializeGoogleMapsWithRetry();
      
      if (!this.googleDirectionsService) {
        const errorMsg = 'Google Maps DirectionsService를 초기화할 수 없습니다.';
        console.error(`❌ ${errorMsg}`, {
          googleAvailable: typeof window !== 'undefined' && !!(window as any).google,
          mapsAvailable: typeof window !== 'undefined' && !!(window as any).google?.maps,
          mapsVersion: typeof window !== 'undefined' ? (window as any).google?.maps?.version : 'N/A'
        });
        throw new Error(errorMsg);
      }
    }

    return new Promise((resolve, reject) => {
      const request: any = {
        origin: new (window as any).google.maps.LatLng(origin.lat, origin.lng),
        destination: new (window as any).google.maps.LatLng(destination.lat, destination.lng),
        travelMode: (window as any).google.maps.TravelMode.WALKING,
        unitSystem: (window as any).google.maps.UnitSystem.METRIC,
        avoidHighways: true,
        avoidTolls: true
      };

      console.log('🗺️ Google Directions API 호출 시작:', {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        mapsVersion: (window as any).google?.maps?.version || 'N/A'
      });

      this.googleDirectionsService!.route(request, (result: any, status: any) => {
        // 상세한 에러 로깅 (배포 환경 디버깅용)
        const statusDetails = {
          status,
          statusText: this.getDirectionsStatusText(status),
          result: result ? {
            routes: result.routes?.length || 0,
            hasRoutes: !!result.routes?.length
          } : null,
          mapsVersion: (window as any).google?.maps?.version || 'N/A',
          apiKeySet: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A'
        };

        if (status === (window as any).google.maps.DirectionsStatus.OK && result) {
          console.log('✅ Google Directions API 성공:', statusDetails);
          const route = this.parseGoogleData(result);
          resolve(route);
        } else {
          console.error('❌ Google Directions API 실패:', statusDetails);
          
          // 배포 환경에서 자주 발생하는 에러에 대한 구체적인 안내
          let errorMessage = `Google Directions API 실패: ${status}`;
          if (status === 'REQUEST_DENIED') {
            errorMessage += '\n💡 가능한 원인:\n' +
              '1. API Key의 HTTP Referrer 제한에 배포 도메인이 포함되지 않음\n' +
              '   → Google Cloud Console에서 https://*.vercel.app/* 추가 필요\n' +
              '2. Billing이 연결되지 않음\n' +
              '   → Google Cloud Console에서 결제 계정 연결 필요\n' +
              '3. Directions API가 활성화되지 않음\n' +
              '   → Google Cloud Console에서 Directions API 활성화 필요';
          } else if (status === 'OVER_QUERY_LIMIT') {
            errorMessage += '\n💡 API 할당량 초과. Billing 설정 확인 필요';
          } else if (status === 'ZERO_RESULTS') {
            errorMessage += '\n💡 경로를 찾을 수 없습니다. 출발지/도착지 좌표 확인 필요';
          }
          
          reject(new Error(errorMessage));
        }
      });
    });
  }

  /**
   * DirectionsService 초기화 (재시도 로직 포함)
   */
  private async initializeGoogleMapsWithRetry(maxRetries: number = 3): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      if (isGoogleMapsAvailable()) {
        try {
          this.initializeGoogleMaps();
          if (this.googleDirectionsService) {
            console.log('✅ DirectionsService 초기화 성공');
            return;
          }
        } catch (err) {
          console.warn(`⚠️ DirectionsService 초기화 실패 (시도 ${i + 1}/${maxRetries}):`, err);
        }
      }
      
      // 재시도 전 대기
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
      }
    }
    
    console.error('❌ DirectionsService 초기화 최대 재시도 횟수 초과');
  }

  /**
   * Directions Status 텍스트 변환 (디버깅용)
   */
  private getDirectionsStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'OK': '성공',
      'NOT_FOUND': '경로를 찾을 수 없음',
      'ZERO_RESULTS': '결과 없음',
      'MAX_WAYPOINTS_EXCEEDED': '경유지 초과',
      'INVALID_REQUEST': '잘못된 요청',
      'OVER_QUERY_LIMIT': '할당량 초과',
      'REQUEST_DENIED': '요청 거부',
      'UNKNOWN_ERROR': '알 수 없는 오류'
    };
    return statusMap[status] || status;
  }

  /**
   * TMAP 응답 데이터를 AR에서 사용할 공통 포맷으로 변환
   * 개선된 버전: 단계별 상세 정보 포함
   */
  private parseTmapData(data: TmapResponse): NavigationRoute {
    const path: Location[] = [];
    const instructions: string[] = [];
    let totalDistance = 0;
    let totalTime = 0;

    // 경로 좌표 및 단계 정보 추출
    data.features.forEach((feature, index) => {
      // 경로 좌표 추출 (LineString)
      if (feature.geometry.type === "LineString" && feature.geometry.coordinates) {
        feature.geometry.coordinates.forEach(coord => {
          path.push({ 
            lat: coord[1], 
            lng: coord[0] 
          });
        });
      }

      // Point 타입의 경우 단계 정보 추출
      if (feature.geometry.type === "Point" && feature.geometry.coordinates) {
        const coord = feature.geometry.coordinates;
        const pointLocation = { lat: coord[1], lng: coord[0] };
        
        // 안내 문구 생성
        let instruction = feature.properties.description || '';
        
        // turnType에 따른 안내 문구 보강
        if (feature.properties.turnType) {
          const turnTypeMap: Record<string, string> = {
            '11': '직진',
            '12': '우회전',
            '13': '좌회전',
            '14': '유턴',
            '15': '우측 유턴',
            '16': '좌측 유턴',
            '17': '우측 방면',
            '18': '좌측 방면',
          };
          
          const turnText = turnTypeMap[feature.properties.turnType];
          if (turnText && !instruction.includes(turnText)) {
            instruction = turnText + (instruction ? ` - ${instruction}` : '');
          }
        }
        
        // 거리 정보 추가
        if (feature.properties.distance) {
          const dist = feature.properties.distance;
          if (dist < 1000) {
            instruction += ` (${Math.round(dist)}m)`;
          } else {
            instruction += ` (${(dist / 1000).toFixed(1)}km)`;
          }
        }
        
        if (instruction) {
          instructions.push(instruction);
        }
      }

      // 전체 거리 및 시간 정보 추출
      if (feature.properties.totalDistance) {
        totalDistance = feature.properties.totalDistance;
      }
      if (feature.properties.totalTime) {
        totalTime = feature.properties.totalTime;
      }
    });

    // 경로가 비어있으면 기본 경로 생성
    if (path.length === 0 && data.features.length > 0) {
      // 첫 번째와 마지막 좌표 사용
      const firstFeature = data.features[0];
      const lastFeature = data.features[data.features.length - 1];
      
      // Point 타입의 경우 coordinates는 number[] (단일 좌표)
      // LineString 타입의 경우 coordinates는 number[][] (좌표 배열)
      const getFirstCoordinate = (coords: number[] | number[][]): number[] | null => {
        if (coords.length === 0) return null;
        // 첫 번째 요소가 배열이면 첫 번째 좌표, 아니면 좌표 자체
        return Array.isArray(coords[0]) ? coords[0] : coords as number[];
      };
      
      const firstCoord = getFirstCoordinate(firstFeature.geometry.coordinates);
      const lastCoord = getFirstCoordinate(lastFeature.geometry.coordinates);
      
      if (firstCoord && lastCoord && firstCoord.length >= 2 && lastCoord.length >= 2) {
        path.push({
          lat: firstCoord[1],
          lng: firstCoord[0],
        });
        path.push({
          lat: lastCoord[1],
          lng: lastCoord[0],
        });
      }
    }

    // 안내 문구가 없으면 기본 문구 추가
    if (instructions.length === 0) {
      instructions.push('목적지까지 직진하세요');
    }

    return {
      path,
      distance: totalDistance,
      duration: totalTime,
      instructions
    };
  }

  /**
   * Google Maps 응답 데이터를 AR에서 사용할 공통 포맷으로 변환
   */
  private parseGoogleData(result: any): NavigationRoute {
    const route = result.routes[0];
    const leg = route.legs[0];
    const path: Location[] = [];
    const instructions: string[] = [];

    // 경로 좌표 추출
    route.overview_path.forEach((point: any) => {
      path.push({
        lat: point.lat(),
        lng: point.lng()
      });
    });

    // 경로 안내 정보 추출
    leg.steps.forEach((step: any) => {
      instructions.push(step.instructions.replace(/<[^>]*>/g, '')); // HTML 태그 제거
    });

    return {
      path,
      distance: leg.distance?.value || 0,
      duration: leg.duration?.value || 0,
      instructions
    };
  }

  /**
   * 현재 사용 중인 네비게이션 서비스 확인
   */
  getCurrentService(): 'TMAP' | 'Google Maps' {
    const service = this.isKorea ? 'TMAP' : 'Google Maps';
    console.log(`🎯 현재 서비스: ${service} (한국 위치: ${this.isKorea})`);
    return service;
  }

  /**
   * API 키 설정
   */
  setTmapApiKey(apiKey: string): void {
    this.tmapApiKey = apiKey;
  }

  /**
   * Google Maps API 초기화 (동적 로딩 시 사용)
   */
  initializeGoogleMaps(): void {
    if (isGoogleMapsAvailable()) {
      try {
        this.googleDirectionsService = new (window as any).google.maps.DirectionsService();
        console.log('✅ Google Maps DirectionsService 초기화 완료');
      } catch (err) {
        console.error('❌ DirectionsService 생성 실패:', err);
        throw err;
      }
    } else {
      console.warn('⚠️ Google Maps API가 아직 로드되지 않았습니다.');
    }
  }

  /**
   * 에러 카운트 증가
   */
  private incrementErrorCount(): void {
    this.errorCount++;
  }

  /**
   * 에러 카운트 리셋
   */
  private resetErrorCount(): void {
    this.errorCount = 0;
    this.lastError = null;
  }

  /**
   * 현재 에러 상태 확인
   */
  getErrorStatus(): { count: number; maxRetries: number; lastError: string | null; shouldStop: boolean } {
    return {
      count: this.errorCount,
      maxRetries: this.maxRetries,
      lastError: this.lastError,
      shouldStop: this.errorCount >= this.maxRetries
    };
  }

  /**
   * 에러 상태 초기화
   */
  resetErrorStatus(): void {
    this.resetErrorCount();
  }
}

// 싱글톤 인스턴스 생성
export const arNavigationManager = new ARNavigationManager();