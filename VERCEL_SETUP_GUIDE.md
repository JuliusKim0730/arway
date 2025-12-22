# Vercel 배포 완벽 가이드 (업데이트)

## 🚨 중요: vercel.json 삭제됨 - Dashboard 설정 필수!

## 1. Vercel 프로젝트 설정 (필수!)

### 1.1 GitHub 연결
1. [Vercel Dashboard](https://vercel.com/dashboard)에 로그인
2. "New Project" 클릭
3. GitHub 저장소 `JuliusKim0730/arway` 선택
4. **Import 클릭하기 전에 아래 설정 먼저!**

### 1.2 프로젝트 설정 (매우 중요!)
**Configure Project 섹션에서:**
- **Framework Preset**: Next.js
- **Root Directory**: `frontend` ⚠️ 이것이 핵심!
- **Build Command**: `npm run build` (기본값)
- **Output Directory**: `.next` (기본값)
- **Install Command**: `npm install` (기본값)

⚠️ **Root Directory를 `frontend`로 설정하지 않으면 배포가 실패합니다!**

### 1.3 배포 시작
위 설정을 완료한 후 "Deploy" 버튼 클릭

## 2. 환경 변수 설정 (필수!)

배포 완료 후 즉시 설정해야 합니다:

Vercel Dashboard → Project → Settings → Environment Variables

### 2.1 NextAuth 설정
```
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET=your-super-secret-key-minimum-32-characters-long
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

**환경 변수 설정 후 반드시 "Redeploy" 버튼을 클릭하세요!**

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

## 4. 배포 확인 단계별 가이드

### 4.1 첫 번째 배포 (Root Directory 설정만)
1. Root Directory를 `frontend`로 설정
2. Deploy 클릭
3. 배포 성공 확인 (사이트는 아직 제대로 작동하지 않을 수 있음)

### 4.2 두 번째 배포 (환경 변수 설정 후)
1. 환경 변수 모두 설정
2. "Redeploy" 클릭
3. 완전한 기능 테스트

### 4.3 테스트 페이지들
- **메인 페이지**: `https://your-domain.vercel.app`
- **디버그 페이지**: `https://your-domain.vercel.app/debug`
- **API 테스트**: `https://your-domain.vercel.app/api/auth/session`

## 5. 문제 해결

### 5.1 "No such file or directory" 에러
- Root Directory가 `frontend`로 설정되었는지 확인
- 설정 후 새로 배포했는지 확인

### 5.2 404 에러
- Root Directory 설정 확인
- 환경 변수 설정 확인
- Redeploy 실행

### 5.3 NextAuth 에러
- 모든 환경 변수가 설정되었는지 확인
- Google OAuth 도메인 설정 확인
- `NEXTAUTH_SECRET`이 32자 이상인지 확인

## 6. 성공 확인 체크리스트

- [ ] Root Directory가 `frontend`로 설정됨
- [ ] 첫 번째 배포 성공
- [ ] 모든 환경 변수 설정 완료
- [ ] Google OAuth 설정 완료
- [ ] 두 번째 배포 (Redeploy) 완료
- [ ] 메인 페이지 접속 가능
- [ ] `/debug` 페이지에서 모든 환경 변수가 녹색으로 표시
- [ ] Google 로그인 테스트 성공

---

## ⚠️ 핵심 포인트

1. **Root Directory 설정이 가장 중요합니다**
2. **환경 변수 설정 후 반드시 Redeploy 하세요**
3. **Google OAuth 도메인을 정확히 설정하세요**
4. **문제가 있으면 `/debug` 페이지를 먼저 확인하세요**