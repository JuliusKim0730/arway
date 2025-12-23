/**
 * TMAP API 키 검증 및 테스트 유틸리티
 */

export class TmapApiValidator {
  /**
   * TMAP API 키 형식 검증
   */
  static validateApiKeyFormat(apiKey: string): { isValid: boolean; message: string } {
    if (!apiKey) {
      return { isValid: false, message: 'API 키가 없습니다.' };
    }

    if (apiKey.length < 30) {
      return { isValid: false, message: 'API 키가 너무 짧습니다.' };
    }

    // TMAP API 키는 보통 l7xx로 시작하지만, 다른 형식도 있을 수 있음
    const commonPrefixes = ['l7xx', 'v6Sh', 'AIza'];
    const hasValidPrefix = commonPrefixes.some(prefix => apiKey.startsWith(prefix));
    
    if (!hasValidPrefix) {
      return { 
        isValid: false, 
        message: `API 키 형식이 일반적이지 않습니다. 일반적인 접두사: ${commonPrefixes.join(', ')}` 
      };
    }

    return { isValid: true, message: 'API 키 형식이 유효합니다.' };
  }

  /**
   * TMAP JavaScript API 로드 테스트
   */
  static async testTmapJSApiLoad(apiKey: string): Promise<{ success: boolean; message: string; details?: any }> {
    return new Promise((resolve) => {
      // 기존 스크립트 제거
      const existingScript = document.querySelector('script[src*="apis.openapi.sk.com/tmap/jsv2"]');
      if (existingScript) {
        existingScript.remove();
      }

      // 기존 Tmapv2 객체 제거
      if ((window as any).Tmapv2) {
        delete (window as any).Tmapv2;
      }

      const script = document.createElement('script');
      script.src = `https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${apiKey}`;
      script.async = true;

      const timeout = setTimeout(() => {
        resolve({
          success: false,
          message: 'TMAP JavaScript API 로드 타임아웃 (15초)',
          details: { timeout: true }
        });
      }, 15000);

      script.onload = () => {
        clearTimeout(timeout);
        
        setTimeout(() => {
          if ((window as any).Tmapv2) {
            const tmapObjects = Object.keys((window as any).Tmapv2);
            resolve({
              success: true,
              message: 'TMAP JavaScript API 로드 성공',
              details: { 
                availableObjects: tmapObjects,
                hasMap: !!(window as any).Tmapv2.Map,
                hasMarker: !!(window as any).Tmapv2.Marker,
                hasLatLng: !!(window as any).Tmapv2.LatLng
              }
            });
          } else {
            resolve({
              success: false,
              message: 'TMAP JavaScript API 로드됨, 하지만 Tmapv2 객체 없음',
              details: { scriptLoaded: true, tmapv2Available: false }
            });
          }
        }, 2000); // 2초 대기
      };

      script.onerror = (error) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          message: 'TMAP JavaScript API 스크립트 로드 실패',
          details: { error: error.toString() }
        });
      };

      document.head.appendChild(script);
    });
  }

  /**
   * TMAP REST API 테스트 (CORS 문제 확인)
   */
  static async testTmapRestApi(apiKey: string): Promise<{ success: boolean; message: string; details?: any }> {
    const testUrl = 'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json';
    
    const testData = {
      startX: "126.9780",
      startY: "37.5665",
      endX: "127.0276", 
      endY: "37.4979",
      startName: "서울시청",
      endName: "강남역"
    };

    try {
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'appKey': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(testData)
      });

      const responseText = await response.text();
      
      return {
        success: response.ok,
        message: response.ok ? 'TMAP REST API 호출 성공' : `TMAP REST API 호출 실패: ${response.status} ${response.statusText}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          responsePreview: responseText.substring(0, 200)
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `TMAP REST API 호출 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        details: { error: error instanceof Error ? error.message : error }
      };
    }
  }

  /**
   * 종합 테스트 실행
   */
  static async runFullTest(apiKey: string): Promise<{
    keyValidation: ReturnType<typeof TmapApiValidator.validateApiKeyFormat>;
    jsApiTest: Awaited<ReturnType<typeof TmapApiValidator.testTmapJSApiLoad>>;
    restApiTest: Awaited<ReturnType<typeof TmapApiValidator.testTmapRestApi>>;
  }> {
    console.log('🧪 TMAP API 종합 테스트 시작');
    
    const keyValidation = this.validateApiKeyFormat(apiKey);
    console.log('1️⃣ API 키 형식 검증:', keyValidation);
    
    const jsApiTest = await this.testTmapJSApiLoad(apiKey);
    console.log('2️⃣ JavaScript API 테스트:', jsApiTest);
    
    const restApiTest = await this.testTmapRestApi(apiKey);
    console.log('3️⃣ REST API 테스트:', restApiTest);
    
    return { keyValidation, jsApiTest, restApiTest };
  }
}

// 개발 환경에서 전역 객체에 추가
if (process.env.NODE_ENV === 'development') {
  (window as any).TmapApiValidator = TmapApiValidator;
  console.log('🧪 TmapApiValidator가 전역 객체에 추가되었습니다. window.TmapApiValidator로 접근 가능합니다.');
}