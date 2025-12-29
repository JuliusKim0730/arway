'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { PermissionConsentModal } from '@/components/PermissionConsentModal';

export default function ArNavStartPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSupported, setIsSupported] = useState<{
    geolocation: boolean;
    camera: boolean;
  } | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  useEffect(() => {
    // 권한 확인
    const checkPermissions = async () => {
      const hasConsented = localStorage.getItem('permissions_consented') === 'true';
      
      if (hasConsented) {
        setPermissionsGranted(true);
      } else {
        // 권한 상태 확인
        let locationGranted = false;
        let cameraGranted = false;

        if (navigator.permissions && navigator.permissions.query) {
          try {
            const locationStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
            locationGranted = locationStatus.state === 'granted';
          } catch (e) {}

          try {
            const cameraStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
            cameraGranted = cameraStatus.state === 'granted';
          } catch (e) {}
        }

        if (!locationGranted || !cameraGranted) {
          setShowPermissionModal(true);
        } else {
          setPermissionsGranted(true);
          localStorage.setItem('permissions_consented', 'true');
        }
      }
    };

    checkPermissions();
  }, []);

  useEffect(() => {
    if (!permissionsGranted) return;

    // 로그인 체크
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/ar-nav');
      return;
    }

    // 브라우저 지원 여부 확인
    setIsSupported({
      geolocation: !!navigator.geolocation,
      camera: !!navigator.mediaDevices?.getUserMedia,
    });
  }, [status, router, permissionsGranted]);

  const handleStart = () => {
    router.push('/ar-nav/select');
  };

  // 권한 동의 모달
  if (showPermissionModal) {
    return (
      <PermissionConsentModal
        onConsent={() => {
          setShowPermissionModal(false);
          setPermissionsGranted(true);
          localStorage.setItem('permissions_consented', 'true');
        }}
        onSkip={() => {
          setShowPermissionModal(false);
          setPermissionsGranted(true);
          localStorage.setItem('permissions_consented', 'true');
        }}
      />
    );
  }

  // 로딩 중이거나 로그인되지 않은 경우
  if (!permissionsGranted || status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col">
      {/* 헤더 */}
      <header className="p-4 sm:p-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          ARWay Lite
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm">SCQ 기반 AR 도보 네비게이션 실험</p>
      </header>

      {/* 설명 섹션 */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="max-w-md text-center space-y-4 sm:space-y-6">
          <div className="text-6xl sm:text-7xl mb-4 animate-bounce" role="img" aria-label="AR 네비게이션 아이콘">
            📍
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">직관적인 AR 네비게이션</h2>
          <p className="text-base sm:text-lg leading-relaxed text-gray-300 px-2">
            지도를 보지 않고도, 카메라 화면 위에서 방향을 안내받는 실험용 서비스입니다.
          </p>
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-blue-200 mx-2">
            <p className="font-semibold mb-1">⚠️ 주의사항</p>
            <p>현재는 도보 테스트용으로만 사용해주세요.</p>
          </div>
        </div>
      </main>

      {/* 기능 지원 상태 */}
      {isSupported && (
        <div className="px-4 sm:px-6 mb-4 space-y-1 sm:space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm">
            <span className={isSupported.geolocation ? 'text-green-400' : 'text-red-400'}>
              {isSupported.geolocation ? '✓' : '✕'}
            </span>
            <span className="text-gray-400">위치 서비스</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm">
            <span className={isSupported.camera ? 'text-green-400' : 'text-red-400'}>
              {isSupported.camera ? '✓' : '✕'}
            </span>
            <span className="text-gray-400">카메라</span>
          </div>
        </div>
      )}

      {/* 메인 CTA 버튼 */}
      <div className="p-4 sm:p-6 space-y-3">
        <button
          onClick={handleStart}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transform hover:scale-[1.02] active:scale-[0.98] text-base sm:text-lg"
          aria-label="도보 AR 네비게이션 시작하기"
        >
          도보 AR 네비 시작
        </button>
        <Link
          href="/ar-nav/history"
          className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 transform hover:scale-[1.02] active:scale-[0.98] text-base sm:text-lg text-center"
          aria-label="경로 히스토리 보기"
        >
          📜 경로 히스토리
        </Link>
      </div>

      {/* 푸터 */}
      <footer className="p-4 sm:p-6 text-center text-xs sm:text-sm text-gray-500 space-y-1">
        <p>카메라/위치 권한을 허용해야 사용할 수 있습니다.</p>
        <p className="text-xs">베타 버전 - 실험용 서비스</p>
      </footer>
    </div>
  );
}
