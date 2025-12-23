/**
 * 디버깅 헬퍼 유틸리티
 * 개발 환경에서 네비게이션 시스템 디버깅을 위한 도구들
 */

export class DebugHelper {
  private static isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * 환경변수 상태 확인
   */
  static checkEnvironmentVariables(): void {
    if (!this.isDevelopment) return;

    console.group('🔍 환경변수 상태 확인');
    
    const tmapKey = process.env.REACT_APP_TMAP_API_KEY;
    const googleKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    
    console.log('TMAP API 키:', tmapKey ? '✅ 설정됨' : '❌ 설정되지 않음');
    console.log('Google Maps API 키:', googleKey ? '✅ 설정됨' : '❌ 설정되지 않음');
    
    if (tmapKey) {
      console.log('TMAP 키 형식:', tmapKey.startsWith('l7xx') ? '✅ 올바름' : '⚠️ 확인 필요');
    }
    
    if (googleKey) {
      console.log('Google 키 형식:', googleKey.startsWith('AIza') ? '✅ 올바름' : '⚠️ 확인 필요');
    }
    
    console.groupEnd();
  }

  /**
   * GPS 위치 정보 로깅
   */
  static logLocationInfo(location: { lat: number; lng: number } | null, accuracy?: number): void {
    if (!this.isDevelopment) return;

    console.group('📍 GPS 위치 정보');
    
    if (location) {
      console.log('위도:', location.lat.toFixed(6));
      console.log('경도:', location.lng.toFixed(6));
      console.log('지역:', this.getRegionName(location.lat, location.lng));
      
      if (accuracy) {
        console.log('정확도:', `${Math.round(accuracy)}m`);
        console.log('정확도 등급:', this.getAccuracyGrade(accuracy));
      }
    } else {
      console.log('❌ 위치 정보 없음');
    }
    
    console.groupEnd();
  }

  /**
   * API 호출 결과 로깅
   */
  static logAPICall(service: 'TMAP' | 'Google Maps', success: boolean, data?: any, error?: any): void {
    if (!this.isDevelopment) return;

    const emoji = service === 'TMAP' ? '🇰🇷' : '🌍';
    const status = success ? '✅ 성공' : '❌ 실패';
    
    console.group(`${emoji} ${service} API 호출 ${status}`);
    
    if (success && data) {
      console.log('응답 데이터:', data);
      if (data.path) {
        console.log('경로 포인트 수:', data.path.length);
      }
      if (data.distance) {
        console.log('총 거리:', `${(data.distance / 1000).toFixed(1)}km`);
      }
      if (data.duration) {
        console.log('예상 시간:', `${Math.round(data.duration / 60)}분`);
      }
    }
    
    if (!success && error) {
      console.error('오류 정보:', error);
    }
    
    console.groupEnd();
  }

  /**
   * 에러 상태 로깅
   */
  static logErrorStatus(errorCount: number, maxRetries: number, lastError: string | null): void {
    if (!this.isDevelopment) return;

    console.group('⚠️ 에러 상태');
    console.log('현재 에러 횟수:', `${errorCount}/${maxRetries}`);
    console.log('중단 여부:', errorCount >= maxRetries ? '❌ 중단됨' : '✅ 계속 가능');
    
    if (lastError) {
      console.log('마지막 에러:', lastError);
    }
    
    console.groupEnd();
  }

  /**
   * 성능 측정 시작
   */
  static startPerformanceMeasure(label: string): void {
    if (!this.isDevelopment) return;
    console.time(`⏱️ ${label}`);
  }

  /**
   * 성능 측정 종료
   */
  static endPerformanceMeasure(label: string): void {
    if (!this.isDevelopment) return;
    console.timeEnd(`⏱️ ${label}`);
  }

  /**
   * 지역명 반환
   */
  private static getRegionName(lat: number, lng: number): string {
    // 한국 본토 + 제주도
    const koreaMainland = lat >= 33.0 && lat <= 38.9 && lng >= 124.5 && lng <= 131.9;
    // 독도
    const dokdo = lat >= 37.2 && lat <= 37.3 && lng >= 131.8 && lng <= 131.9;
    
    if (koreaMainland || dokdo) {
      return '🇰🇷 한국 (TMAP 사용)';
    } else {
      return '🌍 해외 (Google Maps 사용)';
    }
  }

  /**
   * GPS 정확도 등급 반환
   */
  private static getAccuracyGrade(accuracy: number): string {
    if (accuracy <= 5) return '🟢 매우 좋음';
    if (accuracy <= 15) return '🟡 좋음';
    if (accuracy <= 50) return '🟠 보통';
    if (accuracy <= 100) return '🔴 나쁨';
    return '⚫ 매우 나쁨';
  }

  /**
   * 전체 시스템 상태 체크
   */
  static checkSystemStatus(): void {
    if (!this.isDevelopment) return;

    console.group('🔧 시스템 상태 체크');
    
    // 환경변수 체크
    this.checkEnvironmentVariables();
    
    // 브라우저 지원 체크
    console.log('Geolocation 지원:', navigator.geolocation ? '✅' : '❌');
    console.log('Fetch API 지원:', typeof fetch !== 'undefined' ? '✅' : '❌');
    console.log('HTTPS 환경:', location.protocol === 'https:' ? '✅' : '⚠️ HTTP');
    
    // 외부 API 로드 상태
    console.log('Google Maps API:', typeof google !== 'undefined' ? '✅ 로드됨' : '⏳ 미로드');
    console.log('TMAP API:', typeof (window as any).Tmapv2 !== 'undefined' ? '✅ 로드됨' : '⏳ 미로드');
    
    console.groupEnd();
  }
}

// 개발 환경에서 전역 객체에 디버그 헬퍼 추가
if (process.env.NODE_ENV === 'development') {
  (window as any).DebugHelper = DebugHelper;
  console.log('🔧 DebugHelper가 전역 객체에 추가되었습니다. window.DebugHelper로 접근 가능합니다.');
}