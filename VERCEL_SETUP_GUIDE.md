# Vercel 배포 완벽 가이드

## 1. Vercel 프로젝트 설정

### 1.1 GitHub 연결
1. [Vercel Dashboard](https://vercel.com/dashboard)에 로그인
2. "New Project" 클릭
3. GitHub 저장소 `JuliusKim0730/arway` 선택
4. Import 클릭

### 1.2 프로젝트 설정
- **Framework Preset**: Next.js
- **Root Directory**: `frontend` (중요!)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## 2. 환경 변수 설정 (필수!)

Vercel Dashboard → Project → Settings → Environment Variables에서 다음 변수들을 설정:

### 2.1 NextAuth 설정
```
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET=your-super-secret-key-minimum-32-characters
```

### 2.2 Google OAuth 설정
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2.3 API 및 Google Maps 설정
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## 3. Google OAuth 설정

### 3.1 Google Cloud Console 설정
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 또는 새 프로젝트 생성
3. "APIs & Services" → "Credentials" 이동
4. "Create Credentials" → "OAuth 2.0 Client IDs" 선택

### 3.2 OAuth 클라이언트 설정
- **Application type**: Web application
- **Name**: ARWay Lite
- **Authorized JavaScript origins**: 
  - `https://your-vercel-domain.vercel.app`
- **Authorized redirect URIs**: 
  - `https://your-vercel-domain.vercel.app/api/auth/callback/google`

## 4. 배포 확인 사항

### 4.1 필수 파일 확인
- ✅ `frontend/package.json` (Next.js 의존성 포함)
- ✅ `frontend/next.config.js` (환경 변수 설정)
- ✅ `frontend/app/layout.tsx` (루트 레이아웃)
- ✅ `frontend/app/page.tsx` (홈 페이지)
- ✅ `frontend/app/api/auth/[...nextauth]/route.ts` (NextAuth API)
- ✅ `vercel.json` (배포 설정)

### 4.2 환경 변수 확인
모든 환경 변수가 Vercel Dashboard에서 올바르게 설정되었는지 확인

### 4.3 도메인 확인
- Vercel에서 제공하는 도메인이 Google OAuth 설정과 일치하는지 확인
- `NEXTAUTH_URL`이 실제 배포된 도메인과 일치하는지 확인

## 5. 문제 해결

### 5.1 404 에러
- Root Directory가 `frontend`로 설정되었는지 확인
- Build Command가 올바른지 확인

### 5.2 API 라우트 404 에러
- NextAuth API 라우트 파일이 올바른 위치에 있는지 확인
- 환경 변수가 모두 설정되었는지 확인

### 5.3 OAuth 에러
- Google OAuth 설정에서 도메인이 올바른지 확인
- `NEXTAUTH_SECRET`이 32자 이상인지 확인

## 6. 배포 후 테스트

1. 메인 페이지 접속 확인
2. Google 로그인 테스트
3. API 라우트 동작 확인 (`/api/auth/session`)
4. 모든 페이지 라우팅 확인

## 7. 성능 최적화 (선택사항)

### 7.1 Vercel Functions 설정
```json
{
  "functions": {
    "frontend/app/api/auth/[...nextauth]/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### 7.2 헤더 설정
보안 헤더가 `vercel.json`에 포함되어 있는지 확인

---

## 주의사항

⚠️ **환경 변수는 반드시 Vercel Dashboard에서 설정해야 합니다**
⚠️ **Root Directory를 `frontend`로 설정하는 것이 핵심입니다**
⚠️ **Google OAuth 도메인 설정을 정확히 해야 합니다**