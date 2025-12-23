'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  // 로그인된 경우 자동으로 AR 네비게이션 페이지로 이동
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/ar-nav');
    }
  }, [status, router]);

  // 로그인 버튼 클릭 핸들러
  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn('google', {
        callbackUrl: '/ar-nav',
        redirect: true,
      });
    } catch (error) {
      console.error('로그인 오류:', error);
      setLoading(false);
    }
  };

  // 로딩 중 표시 - 타임아웃 추가
  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center space-y-6 px-4">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            ARWay Lite
          </h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">로그인 상태 확인 중...</p>
          
          {/* 임시 우회 버튼 추가 */}
          <div className="mt-8">
            <button
              onClick={() => router.push('/ar-nav')}
              className="text-blue-400 hover:text-blue-300 underline text-sm"
            >
              로그인 없이 계속하기 →
            </button>
          </div>
        </div>
      </main>
    );
  }

  // 로그인되지 않은 경우 메인 화면 표시 (로그인 버튼 포함)
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          ARWay Lite
        </h1>
        <p className="text-gray-400 mb-8">AR 도보 네비게이션 MVP</p>
        
        <div className="space-y-4">
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`
              w-full max-w-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
              text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 
              transform hover:scale-[1.02] active:scale-[0.98]
              disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                로그인 중...
              </span>
            ) : (
              <>
                <svg className="inline-block w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google로 로그인
              </>
            )}
          </button>
          
          <div className="text-sm text-gray-500 space-y-2">
            <p>또는 직접 이동:</p>
            <button
              onClick={() => router.push('/ar-nav')}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              /ar-nav
            </button>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 text-xs text-gray-500">
          <p>⚠️ 카메라 및 위치 권한이 필요합니다</p>
        </div>
      </div>
    </main>
  );
}
