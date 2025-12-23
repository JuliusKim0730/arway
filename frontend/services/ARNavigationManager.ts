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
    };
  }>;
}

export class ARNavigationManager {
  private isKorea: boolean = false;
  private googleDirectionsService: google.maps.DirectionsService | null = null;
  private tmapApiKey: string;
  private errorCount: number = 0;
  private maxRetries: number = 3;
  private lastError: string | null = null;

  constructor(tmapApiKey?: string) {
    // React 환경에서 환경변수 접근 방법 수정
    this.tmapApiKey = tmapApiKey || 
                     process.env.REACT_APP_TMAP_API_KEY || 
                     (window as any).__TMAP_API_KEY__ || 
                     '';
    
    console.log('🔑 TMAP API 키 상태:', this.tmapApiKey ? '설정됨' : '설정되지 않음');
    
    // 개발 환경에서 시스템 상태 체크
    DebugHelper.checkSystemStatus();
    
    // Google Maps API가 로드되어 있으면 DirectionsService 초기화
    if (isGoogleMapsAvailable()) {
      this.googleDirectionsService = new google.maps.DirectionsService();
    }
  }

  /**
   * 현재 위치가 한국인지 확인 (위경도 바운더리 체크)
   * 한국의 대략적인 위경도 범위로 판단
   */
  checkIsKorea(lat: number, lng: number): boolean {
    // 한국 본토 + 제주도를 포함한 범위
    const koreaMainland = lat >= 33.0 && lat <= 38.9 && lng >= 124.5 && lng <= 131.9;
    
    // 독도 포함 (동해 영역)
    const dokdo = lat >= 37.2 && lat <= 37.3 && lng >= 131.8 && lng <= 131.9;
    
    return koreaMainland || dokdo;
  }

  /**
   * 경로 데이터 가져오기 통합 함수
   * 위치에 따라 TMAP 또는 Google Maps API 자동 선택
   * 에러 추적 및 재시도 로직 포함
   */
  async getDirections(origin: Location, destination: Location): Promise<NavigationRoute | null> {
    const isKorea = this.checkIsKorea(origin.lat, origin.lng);
    this.isKorea = isKorea;

    // 디버그 정보 로깅
    DebugHelper.logLocationInfo(origin);
    DebugHelper.startPerformanceMeasure('경로 검색');

    try {
      let result: NavigationRoute | null = null;

      if (isKorea) {
        console.log("🇰🇷 국내 위치 감지: TMAP API 기반 경로를 요청합니다.");
        result = await this.getTmapWalkingRoute(origin, destination);
      } else {
        console.log("🌍 해외 위치 감지: Google Maps API 기반 경로를 요청합니다.");
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
        console.log('Google Maps API 로드 중...');
        await loadGoogleMaps();
        this.initializeGoogleMaps();
      } catch (error) {
        console.error('Google Maps API 로드 실패:', error);
        return null;
      }
    }

    if (!this.googleDirectionsService) {
      console.error('Google Maps DirectionsService를 초기화할 수 없습니다.');
      return null;
    }

    return new Promise((resolve, reject) => {
      const request: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: google.maps.TravelMode.WALKING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: true,
        avoidTolls: true
      };

      this.googleDirectionsService!.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          const route = this.parseGoogleData(result);
          resolve(route);
        } else {
          console.error(`Google Maps API 실패: ${status}`);
          reject(new Error(`Google Maps API 실패: ${status}`));
        }
      });
    });
  }

  /**
   * TMAP 응답 데이터를 AR에서 사용할 공통 포맷으로 변환
   */
  private parseTmapData(data: TmapResponse): NavigationRoute {
    const path: Location[] = [];
    const instructions: string[] = [];
    let totalDistance = 0;
    let totalTime = 0;

    data.features.forEach(feature => {
      // 경로 좌표 추출
      if (feature.geometry.type === "LineString") {
        feature.geometry.coordinates.forEach(coord => {
          path.push({ 
            lat: coord[1], 
            lng: coord[0] 
          });
        });
      }

      // 거리 및 시간 정보 추출
      if (feature.properties.totalDistance) {
        totalDistance = feature.properties.totalDistance;
      }
      if (feature.properties.totalTime) {
        totalTime = feature.properties.totalTime;
      }

      // 경로 안내 정보 추출
      if (feature.properties.description) {
        instructions.push(feature.properties.description);
      }
    });

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
  private parseGoogleData(result: google.maps.DirectionsResult): NavigationRoute {
    const route = result.routes[0];
    const leg = route.legs[0];
    const path: Location[] = [];
    const instructions: string[] = [];

    // 경로 좌표 추출
    route.overview_path.forEach(point => {
      path.push({
        lat: point.lat(),
        lng: point.lng()
      });
    });

    // 경로 안내 정보 추출
    leg.steps.forEach(step => {
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
    return this.isKorea ? 'TMAP' : 'Google Maps';
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
      this.googleDirectionsService = new google.maps.DirectionsService();
      console.log('✅ Google Maps DirectionsService 초기화 완료');
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