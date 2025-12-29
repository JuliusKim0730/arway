'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PermissionConsentModal } from '@/components/PermissionConsentModal';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // 권한 확인 및 모달 표시
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // 로컬 스토리지에서 권한 동의 여부 확인
        const hasConsented = localStorage.getItem('permissions_consented') === 'true';
        
        if (hasConsented) {
          setPermissionsGranted(true);
          return;
        }

        // 권한 상태 확인 (타임아웃 설정)
        let locationGranted = false;
        let cameraGranted = false;

        // 타임아웃 설정 (5초)
        const permissionCheckPromise = new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('권한 확인 타임아웃 - 기본값으로 진행');
            resolve();
          }, 5000);

          (async () => {
            if (navigator.permissions && navigator.permissions.query) {
              try {
                const locationStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
                locationGranted = locationStatus.state === 'granted';
              } catch (e) {
                console.warn('위치 권한 확인 실패:', e);
              }

              try {
                const cameraStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
                cameraGranted = cameraStatus.state === 'granted';
              } catch (e) {
                console.warn('카메라 권한 확인 실패:', e);
              }
            }
            clearTimeout(timeout);
            resolve();
          })();
        });

        await permissionCheckPromise;

        // 둘 다 허용되지 않았으면 모달 표시
        if (!locationGranted || !cameraGranted) {
          setShowPermissionModal(true);
        } else {
          setPermissionsGranted(true);
          localStorage.setItem('permissions_consented', 'true');
        }
      } catch (error) {
        console.error('권한 확인 중 오류:', error);
        // 오류 발생 시 모달 표시
        setShowPermissionModal(true);
      }
    };

    checkPermissions();
  }, []);

  // NextAuth 동적 로딩 (권한 동의와 독립적으로 실행)
  useEffect(() => {
    const initAuth = async () => {
      try {
        // NextAuth가 제대로 설정되어 있는지 확인 (타임아웃 설정)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
          const response = await fetch('/api/auth/session', {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const session = await response.json();
            if (session?.user) {
              // 이미 로그인된 경우 AR 네비게이션으로 이동
              router.push('/ar-nav');
              return;
            }
          }
        } catch (error: any) {
          clearTimeout(timeoutId);
          if (error.name !== 'AbortError') {
            console.warn('NextAuth 초기화 실패:', error);
          }
        }
      } catch (error) {
        console.warn('NextAuth 초기화 중 오류:', error);
      }
      setAuthReady(true);
    };

    // 권한 모달이 표시되지 않았거나 권한이 허용된 경우에만 실행
    if (!showPermissionModal || permissionsGranted) {
      // 1초 후에 인증 상태 확인 (NextAuth 초기화 대기)
      const timer = setTimeout(initAuth, 1000);
      return () => clearTimeout(timer);
    }
  }, [router, permissionsGranted, showPermissionModal]);

  // Google 로그인 핸들러
  const handleLogin = async () => {
    setLoading(true);
    try {
      // NextAuth signIn 사용
      const { signIn } = await import('next-auth/react');
      
      // 타임아웃 설정 (10초)
      const loginPromise = signIn('google', {
        callbackUrl: '/ar-nav',
        redirect: true,
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('로그인 타임아웃')), 10000);
      });
      
      await Promise.race([loginPromise, timeoutPromise]);
    } catch (error: any) {
      console.error('로그인 오류:', error);
      setLoading(false);
      
      // 타임아웃이거나 네트워크 오류인 경우
      if (error.message === '로그인 타임아웃' || error.message?.includes('network')) {
        alert('로그인 요청이 시간 초과되었습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.');
      } else {
        // 기타 오류는 조용히 처리하고 AR 네비게이션으로 이동
        console.warn('로그인 실패, 게스트 모드로 진행');
      }
      
      // 로그인 실패 시에도 AR 네비게이션으로 이동 (게스트 모드)
      router.push('/ar-nav');
    }
  };

  // 최대 3초 후에는 강제로 메인 화면 표시 (무한 로딩 방지)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!authReady && !showPermissionModal) {
        console.warn('초기화 타임아웃 - 메인 화면으로 전환');
        setAuthReady(true);
        setPermissionsGranted(true); // 권한 확인을 건너뛰고 진행
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [authReady, showPermissionModal]);

  // 초기 로딩 중 (권한 모달이 표시되지 않은 경우에만)
  if (!authReady && !showPermissionModal) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center space-y-6 px-4">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            ARWay Lite
          </h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">앱 초기화 중...</p>
          
          {/* 즉시 우회 버튼 */}
          <div className="mt-4">
            <button
              onClick={() => {
                setPermissionsGranted(true);
                setAuthReady(true);
                router.push('/ar-nav');
              }}
              className="text-blue-400 hover:text-blue-300 underline text-sm"
            >
              바로 시작하기 →
            </button>
          </div>
        </div>
      </main>
    );
  }

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

  // 메인 화면
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="text-center space-y-6 px-4 max-w-md mx-auto">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          ARWay Lite
        </h1>
        <p className="text-gray-400 mb-8">AR 도보 네비게이션 MVP</p>
        
        {/* 지역 선택 메뉴 */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">지역을 선택하세요</h2>
          
          <div className="grid grid-cols-1 gap-3">
            {/* 국내 (TMAP) */}
            <button
              onClick={() => {
                localStorage.setItem('preferredService', 'TMAP');
                router.push('/ar-nav');
              }}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 
                text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl 
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 
                transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">🇰🇷</span>
                <div className="text-left">
                  <div className="font-bold">국내 (한국)</div>
                  <div className="text-sm opacity-90">TMAP 네비게이션</div>
                </div>
              </div>
            </button>

            {/* 해외 (Google Maps) */}
            <button
              onClick={() => {
                localStorage.setItem('preferredService', 'Google Maps');
                router.push('/ar-nav');
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
                text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 
                transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">🌍</span>
                <div className="text-left">
                  <div className="font-bold">해외 (Global)</div>
                  <div className="text-sm opacity-90">Google Maps 네비게이션</div>
                </div>
              </div>
            </button>

            {/* 자동 선택 */}
            <button
              onClick={() => {
                localStorage.removeItem('preferredService');
                router.push('/ar-nav');
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 
                text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl 
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 
                transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl">📍</span>
                <div className="text-left">
                  <div className="font-bold">자동 선택</div>
                  <div className="text-sm opacity-90">GPS 위치 기반</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 로그인 섹션 */}
        <div className="pt-6 border-t border-gray-700">
          <p className="text-sm text-gray-400 mb-4">선택사항: 히스토리 저장을 위한 로그인</p>
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`
              w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 
              text-white font-medium py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl 
              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 
              transform hover:scale-[1.02] active:scale-[0.98]
              disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                로그인 중...
              </span>
            ) : (
              <>
                <svg className="inline-block w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google로 로그인
              </>
            )}
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <p>⚠️ 카메라 및 위치 권한이 필요합니다</p>
        </div>
      </div>
    </main>
  );
}

