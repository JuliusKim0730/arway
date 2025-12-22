'use client';

import { getEnvironmentInfo } from '@/lib/env-check';

export default function DebugPage() {
  const envInfo = getEnvironmentInfo();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">배포 상태 확인</h1>
        
        <div className="grid gap-6">
          {/* 환경 정보 */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">환경 정보</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Node Environment:</span>
                <span className="font-mono">{envInfo.nodeEnv}</span>
              </div>
              <div className="flex justify-between">
                <span>NextAuth URL:</span>
                <span className="font-mono">{envInfo.nextAuthUrl || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span>Vercel URL:</span>
                <span className="font-mono">{envInfo.vercelUrl || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span>API URL:</span>
                <span className="font-mono">{envInfo.apiUrl || 'Not set'}</span>
              </div>
            </div>
          </div>

          {/* 환경 변수 상태 */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">환경 변수 상태</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>NextAuth Secret:</span>
                <span className={`px-2 py-1 rounded text-sm ${envInfo.hasNextAuthSecret ? 'bg-green-600' : 'bg-red-600'}`}>
                  {envInfo.hasNextAuthSecret ? '✅ 설정됨' : '❌ 누락'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Google OAuth:</span>
                <span className={`px-2 py-1 rounded text-sm ${envInfo.hasGoogleOAuth ? 'bg-green-600' : 'bg-red-600'}`}>
                  {envInfo.hasGoogleOAuth ? '✅ 설정됨' : '❌ 누락'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Google Maps API:</span>
                <span className={`px-2 py-1 rounded text-sm ${envInfo.hasGoogleMapsKey ? 'bg-green-600' : 'bg-red-600'}`}>
                  {envInfo.hasGoogleMapsKey ? '✅ 설정됨' : '❌ 누락'}
                </span>
              </div>
            </div>
          </div>

          {/* API 테스트 */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">API 테스트</h2>
            <div className="space-y-4">
              <button
                onClick={() => fetch('/api/auth/session').then(r => r.json()).then(console.log)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                NextAuth Session 테스트
              </button>
              <button
                onClick={() => fetch('/api/auth/providers').then(r => r.json()).then(console.log)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded ml-4"
              >
                Auth Providers 테스트
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              결과는 브라우저 콘솔에서 확인하세요 (F12)
            </p>
          </div>

          {/* 네비게이션 */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">페이지 테스트</h2>
            <div className="space-y-2">
              <a href="/" className="block text-blue-400 hover:text-blue-300">홈페이지</a>
              <a href="/ar-nav" className="block text-blue-400 hover:text-blue-300">AR 네비게이션</a>
              <a href="/auth/signin" className="block text-blue-400 hover:text-blue-300">로그인 페이지</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}