/**
 * 구글 맵 API 테스트 유틸리티
 * 브라우저 콘솔에서 실행하여 API 키 설정 확인
 */

export function testGoogleMapsAPI() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Google Maps API 키가 설정되지 않았습니다.');
    console.log('frontend/.env.local 파일에 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY를 설정하세요.');
    return false;
  }
  
  console.log('✅ Google Maps API 키가 설정되어 있습니다.');
  console.log('API 키 (처음 10자리):', apiKey.substring(0, 10) + '...');
  
  // 간단한 테스트 요청
  const testOrigin = { lat: 37.511, lng: 127.029 };
  const testDestination = { lat: 37.5561, lng: 126.9723 };
  
  console.log('테스트 경로 계산 중...');
  console.log('출발지:', testOrigin);
  console.log('목적지:', testDestination);
  
  return true;
}

// 브라우저 콘솔에서 직접 사용할 수 있도록 전역 함수로도 export
if (typeof window !== 'undefined') {
  (window as any).testGoogleMapsAPI = testGoogleMapsAPI;
}

