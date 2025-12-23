/**
 * Google Maps API 동적 로더
 * 필요할 때만 Google Maps API를 로드하여 성능 최적화
 */

interface GoogleMapsLoaderOptions {
  apiKey: string;
  libraries?: string[];
  language?: string;
  region?: string;
}

class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private isLoaded: boolean = false;
  private isLoading: boolean = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  /**
   * Google Maps API 로드
   */
  async load(options: GoogleMapsLoaderOptions): Promise<void> {
    // 이미 로드된 경우
    if (this.isLoaded) {
      return Promise.resolve();
    }

    // 로딩 중인 경우 기존 Promise 반환
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // 새로운 로딩 시작
    this.isLoading = true;
    this.loadPromise = this.loadGoogleMapsScript(options);

    try {
      await this.loadPromise;
      this.isLoaded = true;
      this.isLoading = false;
    } catch (error) {
      this.isLoading = false;
      this.loadPromise = null;
      throw error;
    }
  }

  /**
   * Google Maps 스크립트 동적 로드
   */
  private loadGoogleMapsScript(options: GoogleMapsLoaderOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      // 이미 로드된 경우 체크
      if (typeof google !== 'undefined' && google.maps) {
        resolve();
        return;
      }

      // 스크립트 URL 생성
      const params = new URLSearchParams({
        key: options.apiKey,
        libraries: (options.libraries || ['geometry', 'places']).join(','),
        language: options.language || 'ko',
        region: options.region || 'KR'
      });

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.defer = true;

      // 로드 완료 처리
      script.onload = () => {
        if (typeof google !== 'undefined' && google.maps) {
          console.log('✅ Google Maps API 로드 완료');
          resolve();
        } else {
          reject(new Error('Google Maps API 로드 실패: google 객체를 찾을 수 없습니다.'));
        }
      };

      // 로드 실패 처리
      script.onerror = () => {
        reject(new Error('Google Maps API 스크립트 로드 실패'));
      };

      // DOM에 스크립트 추가
      document.head.appendChild(script);
    });
  }

  /**
   * 로드 상태 확인
   */
  isGoogleMapsLoaded(): boolean {
    return this.isLoaded && typeof google !== 'undefined' && google.maps;
  }

  /**
   * 로딩 상태 확인
   */
  isGoogleMapsLoading(): boolean {
    return this.isLoading;
  }
}

// 싱글톤 인스턴스 내보내기
export const googleMapsLoader = GoogleMapsLoader.getInstance();

/**
 * Google Maps API 로드 헬퍼 함수
 */
export async function loadGoogleMaps(apiKey?: string): Promise<void> {
  const key = apiKey || process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  
  if (!key || key === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    throw new Error('Google Maps API 키가 설정되지 않았습니다. .env.local 파일에 REACT_APP_GOOGLE_MAPS_API_KEY를 설정해주세요.');
  }

  await googleMapsLoader.load({
    apiKey: key,
    libraries: ['geometry', 'places'],
    language: 'ko',
    region: 'KR'
  });
}

/**
 * Google Maps API 사용 가능 여부 확인
 */
export function isGoogleMapsAvailable(): boolean {
  return googleMapsLoader.isGoogleMapsLoaded();
}