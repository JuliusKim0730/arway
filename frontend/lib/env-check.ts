// 환경 변수 검증 유틸리티
export function checkEnvironmentVariables() {
  const requiredEnvVars = [
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID', 
    'GOOGLE_CLIENT_SECRET',
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('⚠️ 누락된 환경 변수:', missingVars);
    return false;
  }
  
  console.log('✅ 모든 필수 환경 변수가 설정되었습니다.');
  return true;
}

export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    vercelUrl: process.env.VERCEL_URL,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    hasGoogleMapsKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    hasGoogleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET
  };
}