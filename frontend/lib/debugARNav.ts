/**
 * AR 네비게이션 디버그 유틸리티 (개선된 버전)
 * 브라우저 콘솔에서 실행하여 기능 상태를 확인합니다.
 */

interface DebugResult {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

const debugResults: DebugResult[] = [];

function addResult(name: string, status: 'success' | 'warning' | 'error', message: string, details?: any) {
  debugResults.push({ name, status, message, details });
}

/**
 * 카메라 접근 테스트 (개선됨)
 */
async function testCameraAccess(): Promise<void> {
  return new Promise((resolve) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      addResult(
        '카메라 API',
        'error',
        'getUserMedia API를 지원하지 않습니다.',
        { available: false }
      );
      resolve();
      return;
    }

    addResult(
      '카메라 API',
      'success',
      'getUserMedia API 사용 가능',
      { available: true }
    );

    // 카메라 접근 시도 (후면 카메라 우선)
    navigator.mediaDevices
      .getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      .then((stream) => {
        const tracks = stream.getTracks();
        const videoTrack = tracks.find((track) => track.kind === 'video');
        
        if (videoTrack) {
          const capabilities = videoTrack.getCapabilities();
          const settings = videoTrack.getSettings();
          
          addResult(
            '카메라 접근',
            'success',
            '카메라 접근 성공 (후면 카메라)',
            {
              facingMode: settings.facingMode || 'unknown',
              width: settings.width,
              height: settings.height,
              frameRate: settings.frameRate,
              capabilities: capabilities,
            }
          );
          
          // 스트림 정리
          tracks.forEach((track) => track.stop());
        } else {
          addResult(
            '카메라 접근',
            'warning',
            '비디오 트랙을 찾을 수 없습니다',
            { tracks: tracks.map((t) => t.kind) }
          );
        }
        resolve();
      })
      .catch((error) => {
        // 후면 카메라 실패 시 전면 카메라 시도
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: 'user' } })
          .then((stream) => {
            const tracks = stream.getTracks();
            const videoTrack = tracks.find((track) => track.kind === 'video');
            
            if (videoTrack) {
              const settings = videoTrack.getSettings();
              addResult(
                '카메라 접근',
                'warning',
                '전면 카메라만 사용 가능 (후면 카메라 권장)',
                {
                  facingMode: settings.facingMode || 'user',
                  width: settings.width,
                  height: settings.height,
                }
              );
            }
            
            tracks.forEach((track) => track.stop());
            resolve();
          })
          .catch((fallbackError) => {
            let errorMessage = '알 수 없는 오류';
            let errorType = 'unknown';
            
            if (error.name === 'NotAllowedError') {
              errorMessage = '카메라 권한이 거부되었습니다';
              errorType = 'permission_denied';
            } else if (error.name === 'NotFoundError') {
              errorMessage = '카메라를 찾을 수 없습니다';
              errorType = 'not_found';
            } else if (error.name === 'NotReadableError') {
              errorMessage = '카메라에 접근할 수 없습니다 (다른 앱이 사용 중일 수 있음)';
              errorType = 'not_readable';
            } else if (error.message) {
              errorMessage = error.message;
              errorType = error.name || 'error';
            }
            
            addResult(
              '카메라 접근',
              'error',
              errorMessage,
              { error: errorType, name: error.name, message: error.message }
            );
            resolve();
          });
      });
  });
}

/**
 * GPS 위치 접근 테스트 (개선됨)
 */
async function testGPSAccess(): Promise<void> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      addResult(
        'GPS API',
        'error',
        'Geolocation API를 지원하지 않습니다',
        { available: false }
      );
      resolve();
      return;
    }

    addResult(
      'GPS API',
      'success',
      'Geolocation API 사용 가능',
      { available: true }
    );

    // 고정밀 위치 요청
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const accuracy = position.coords.accuracy;
        let accuracyStatus: 'success' | 'warning' | 'error' = 'success';
        let accuracyMessage = 'GPS 위치 정보 획득 성공';
        
        if (accuracy > 50) {
          accuracyStatus = 'warning';
          accuracyMessage = 'GPS 정확도가 낮습니다 (50m 이상)';
        } else if (accuracy > 100) {
          accuracyStatus = 'error';
          accuracyMessage = 'GPS 정확도가 매우 낮습니다 (100m 이상)';
        }
        
        addResult(
          'GPS 위치',
          accuracyStatus,
          accuracyMessage,
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: new Date(position.timestamp).toISOString(),
          }
        );
        
        // 연속 위치 추적 테스트 (5초간)
        let watchCount = 0;
        const watchId = navigator.geolocation.watchPosition(
          (watchPosition) => {
            watchCount++;
            if (watchCount === 1) {
              addResult(
                'GPS 연속 추적',
                'success',
                'GPS 연속 추적 기능 정상 작동',
                {
                  updateCount: watchCount,
                  accuracy: watchPosition.coords.accuracy,
                }
              );
            }
            
            if (watchCount >= 3) {
              navigator.geolocation.clearWatch(watchId);
              resolve();
            }
          },
          (watchError) => {
            addResult(
              'GPS 연속 추적',
              'error',
              'GPS 연속 추적 실패',
              { error: watchError.message }
            );
            navigator.geolocation.clearWatch(watchId);
            resolve();
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 1000,
          }
        );
        
        // 5초 후 강제 종료
        setTimeout(() => {
          navigator.geolocation.clearWatch(watchId);
          if (watchCount === 0) {
            addResult(
              'GPS 연속 추적',
              'warning',
              'GPS 연속 추적 업데이트 없음',
              { timeout: true }
            );
          }
          resolve();
        }, 5000);
      },
      (error) => {
        let errorMessage = '알 수 없는 오류';
        let errorType = 'unknown';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 권한이 거부되었습니다';
            errorType = 'permission_denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다';
            errorType = 'position_unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = '위치 정보 요청 시간 초과';
            errorType = 'timeout';
            break;
          default:
            errorMessage = error.message || '알 수 없는 오류';
            errorType = 'unknown';
        }
        
        addResult(
          'GPS 위치',
          'error',
          errorMessage,
          { error: errorType, code: error.code, message: error.message }
        );
        resolve();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * DeviceOrientation 접근 테스트
 */
async function testDeviceOrientation(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent) {
      addResult(
        'DeviceOrientation API',
        'error',
        'DeviceOrientation API를 지원하지 않습니다',
        { available: false }
      );
      resolve();
      return;
    }

    addResult(
      'DeviceOrientation API',
      'success',
      'DeviceOrientation API 사용 가능',
      { available: true }
    );

    // iOS 13+ 권한 요청
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any)
        .requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            addResult(
              'DeviceOrientation 권한',
              'success',
              'DeviceOrientation 권한 허용됨',
              { permission: 'granted' }
            );
            
            // 이벤트 리스너 테스트
            const handler = (event: DeviceOrientationEvent) => {
              addResult(
                'DeviceOrientation 데이터',
                'success',
                'DeviceOrientation 데이터 수신 성공',
                {
                  alpha: event.alpha,
                  beta: event.beta,
                  gamma: event.gamma,
                }
              );
              window.removeEventListener('deviceorientation', handler);
              resolve();
            };
            
            window.addEventListener('deviceorientation', handler);
            
            // 2초 후 타임아웃
            setTimeout(() => {
              window.removeEventListener('deviceorientation', handler);
              if (debugResults.find((r) => r.name === 'DeviceOrientation 데이터') === undefined) {
                addResult(
                  'DeviceOrientation 데이터',
                  'warning',
                  'DeviceOrientation 데이터를 받지 못했습니다',
                  { timeout: true }
                );
                resolve();
              }
            }, 2000);
          } else {
            addResult(
              'DeviceOrientation 권한',
              'error',
              'DeviceOrientation 권한이 거부되었습니다',
              { permission: response }
            );
            resolve();
          }
        })
        .catch((error: Error) => {
          addResult(
            'DeviceOrientation 권한',
            'error',
            'DeviceOrientation 권한 요청 실패',
            { error: error.message }
          );
          resolve();
        });
    } else {
      // 권한 요청이 필요 없는 경우 (Android 등)
      addResult(
        'DeviceOrientation 권한',
        'success',
        '권한 요청 불필요 (자동 허용)',
        { permission: 'auto' }
      );
      
      const handler = (event: DeviceOrientationEvent) => {
        addResult(
          'DeviceOrientation 데이터',
          'success',
          'DeviceOrientation 데이터 수신 성공',
          {
            alpha: event.alpha,
            beta: event.beta,
            gamma: event.gamma,
          }
        );
        window.removeEventListener('deviceorientation', handler);
        resolve();
      };
      
      window.addEventListener('deviceorientation', handler);
      
      // 2초 후 타임아웃
      setTimeout(() => {
        window.removeEventListener('deviceorientation', handler);
        if (debugResults.find((r) => r.name === 'DeviceOrientation 데이터') === undefined) {
          addResult(
            'DeviceOrientation 데이터',
            'warning',
            'DeviceOrientation 데이터를 받지 못했습니다',
            { timeout: true }
          );
          resolve();
        }
      }, 2000);
    }
  });
}

/**
 * API 연결 테스트
 */
async function testAPIConnection(): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  try {
    // 목적지 목록 조회 테스트
    const response = await fetch(`${apiUrl}/api/v1/destinations/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      addResult(
        'API 연결',
        'success',
        'API 연결 성공',
        {
          url: apiUrl,
          status: response.status,
          destinationCount: Array.isArray(data) ? data.length : 0,
        }
      );
      
      // 검색 기능 테스트
      if (Array.isArray(data) && data.length > 0) {
        const testSearchTerm = data[0].name.substring(0, Math.min(3, data[0].name.length));
        try {
          const searchResponse = await fetch(`${apiUrl}/api/v1/destinations/?search=${encodeURIComponent(testSearchTerm)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            addResult(
              '목적지 검색 API',
              'success',
              '목적지 검색 기능 정상 작동',
              {
                searchTerm: testSearchTerm,
                resultCount: Array.isArray(searchData) ? searchData.length : 0,
              }
            );
          } else {
            addResult(
              '목적지 검색 API',
              'warning',
              '목적지 검색 API 응답 오류',
              { status: searchResponse.status }
            );
          }
        } catch (error) {
          addResult(
            '목적지 검색 API',
            'error',
            '목적지 검색 API 호출 실패',
            { error: error instanceof Error ? error.message : String(error) }
          );
        }
      }
    } else {
      addResult(
        'API 연결',
        'error',
        'API 연결 실패',
        {
          url: apiUrl,
          status: response.status,
          statusText: response.statusText,
        }
      );
    }
  } catch (error) {
    addResult(
      'API 연결',
      'error',
      'API 연결 오류',
      {
        url: apiUrl,
        error: error instanceof Error ? error.message : String(error),
      }
    );
  }
}

/**
 * 결과 출력
 */
function printResults(): void {
  console.log('\n========================================');
  console.log('AR 네비게이션 디버그 결과');
  console.log('========================================\n');
  
  debugResults.forEach((result) => {
    const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    const statusColor = result.status === 'success' ? 'color: green' : result.status === 'warning' ? 'color: orange' : 'color: red';
    
    console.log(`%c${icon} ${result.name}: ${result.message}`, statusColor);
    
    if (result.details) {
      console.log('   상세:', result.details);
    }
    console.log('');
  });
  
  const successCount = debugResults.filter((r) => r.status === 'success').length;
  const totalCount = debugResults.length;
  
  console.log('========================================');
  console.log(`총 ${successCount}/${totalCount} 항목 정상`);
  console.log('========================================\n');
}

/**
 * 메인 디버그 함수
 * 브라우저 콘솔에서 debugARNav() 실행
 */
export async function debugARNav(): Promise<void> {
  console.log('AR 네비게이션 디버그 시작...\n');
  
  debugResults.length = 0; // 결과 초기화
  
  // 순차적으로 테스트 실행
  await testCameraAccess();
  await testGPSAccess();
  await testDeviceOrientation();
  await testAPIConnection();
  
  // 결과 출력
  printResults();
  
  return Promise.resolve();
}

// 전역 함수로 등록 (브라우저 콘솔에서 직접 호출 가능)
if (typeof window !== 'undefined') {
  (window as any).debugARNav = debugARNav;
}

