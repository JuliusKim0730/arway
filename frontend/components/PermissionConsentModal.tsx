'use client';

import { useState, useEffect } from 'react';

interface PermissionConsentModalProps {
  onConsent: () => void;
  onSkip?: () => void;
}

export function PermissionConsentModal({ onConsent, onSkip }: PermissionConsentModalProps) {
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isRequesting, setIsRequesting] = useState(false);

  // 현재 권한 상태 확인
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    // 위치 권한 확인
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const locationStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        setLocationPermission(locationStatus.state === 'granted' ? 'granted' : locationStatus.state === 'denied' ? 'denied' : 'prompt');
      } catch (e) {
        // 일부 브라우저에서는 지원하지 않음
        setLocationPermission('prompt');
      }
    }

    // 카메라 권한 확인
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const cameraStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setCameraPermission(cameraStatus.state === 'granted' ? 'granted' : cameraStatus.state === 'denied' ? 'denied' : 'prompt');
      } catch (e) {
        // 일부 브라우저에서는 지원하지 않음
        setCameraPermission('prompt');
      }
    }
  };

  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    setIsRequesting(true);
    try {
      await new Promise<void>((resolve, reject) => {
        // 타임아웃을 더 길게 설정 (실내 환경 고려)
        const timeout = setTimeout(() => {
          console.warn('위치 권한 요청 타임아웃 (실내 환경일 수 있음)');
          // 타임아웃이 발생해도 권한은 요청됨 (사용자가 허용했을 수 있음)
          setLocationPermission('prompt'); // 'prompt' 상태 유지하여 사용자가 수동으로 허용 가능하도록
          setIsRequesting(false);
          resolve();
        }, 15000); // 15초로 증가

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeout);
            setLocationPermission('granted');
            setIsRequesting(false);
            resolve();
          },
          (error) => {
            clearTimeout(timeout);
            if (error.code === error.PERMISSION_DENIED) {
              setLocationPermission('denied');
            } else if (error.code === error.TIMEOUT) {
              console.warn('위치 정보 요청 타임아웃 (실내 환경일 수 있음)');
              setLocationPermission('prompt'); // 타임아웃 시에도 prompt 상태 유지
            } else {
              console.warn('위치 정보 요청 실패:', error.message);
              setLocationPermission('prompt');
            }
            setIsRequesting(false);
            resolve(); // reject 대신 resolve로 변경하여 UI가 멈추지 않도록
          },
          { 
            timeout: 15000, // 15초로 증가
            enableHighAccuracy: true,
            maximumAge: 60000 // 1분간 캐시된 위치 허용
          }
        );
      });
    } catch (error) {
      console.warn('위치 권한 요청 실패:', error);
      setIsRequesting(false);
    }
  };

  const requestCameraPermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('이 브라우저는 카메라를 지원하지 않습니다.');
      return;
    }

    setIsRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // 스트림 즉시 정리 (권한만 확인)
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraPermission('denied');
      }
      console.warn('카메라 권한 요청 실패:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleRequestAll = async () => {
    await Promise.all([
      requestLocationPermission(),
      requestCameraPermission()
    ]);
    
    // 두 권한 모두 요청 완료 후 콜백 호출
    if (locationPermission === 'granted' || cameraPermission === 'granted') {
      onConsent();
    }
  };

  const allGranted = locationPermission === 'granted' && cameraPermission === 'granted';
  const hasDenied = locationPermission === 'denied' || cameraPermission === 'denied';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            권한이 필요합니다
          </h2>
          <p className="text-gray-400 text-sm">
            AR 네비게이션을 사용하려면 위치 정보와 카메라 접근 권한이 필요합니다.
          </p>
        </div>

        {/* 위치 권한 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <p className="text-white font-medium">위치 정보</p>
                <p className="text-gray-400 text-xs">현재 위치를 파악하기 위해 필요합니다</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {locationPermission === 'granted' && (
                <span className="text-green-400 text-sm">✓ 허용됨</span>
              )}
              {locationPermission === 'denied' && (
                <span className="text-red-400 text-sm">✗ 거부됨</span>
              )}
              {locationPermission === 'prompt' && (
                <button
                  onClick={requestLocationPermission}
                  disabled={isRequesting}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors disabled:opacity-50"
                >
                  허용
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 카메라 권한 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📷</span>
              <div>
                <p className="text-white font-medium">카메라</p>
                <p className="text-gray-400 text-xs">AR 네비게이션 화면을 표시하기 위해 필요합니다</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {cameraPermission === 'granted' && (
                <span className="text-green-400 text-sm">✓ 허용됨</span>
              )}
              {cameraPermission === 'denied' && (
                <span className="text-red-400 text-sm">✗ 거부됨</span>
              )}
              {cameraPermission === 'prompt' && (
                <button
                  onClick={requestCameraPermission}
                  disabled={isRequesting}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors disabled:opacity-50"
                >
                  허용
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 안내 메시지 */}
        {hasDenied && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
            <p className="text-yellow-200 text-xs">
              ⚠️ 일부 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.
            </p>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          {onSkip && (
            <button
              onClick={onSkip}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              건너뛰기
            </button>
          )}
          <button
            onClick={allGranted ? onConsent : handleRequestAll}
            disabled={isRequesting}
            className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
              allGranted
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
            }`}
          >
            {allGranted ? '시작하기' : isRequesting ? '요청 중...' : '모두 허용'}
          </button>
        </div>
      </div>
    </div>
  );
}

