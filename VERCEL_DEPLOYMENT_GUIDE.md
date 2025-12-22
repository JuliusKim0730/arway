# 🚀 ARWay Lite - Vercel 배포 가이드 (수정됨)

## ✅ 배포 준비 완료

### 🔧 **수정 완료된 사항**
1. **Google Maps AdvancedMarkerElement 에러 수정** ✅
2. **NextAuth Suspense 에러 수정** ✅
3. **Vercel 환경 변수 설정 수정** ✅
   - `vercel.json`에서 잘못된 `@` 문법 제거
   - 환경 변수는 Vercel 대시보드에서 직접 설정

---

## 🌐 **Vercel 배포 단계**

### **1단계: Vercel 계정 연결**

1. **Vercel 웹사이트 접속**
   - https://vercel.com 방문
   - GitHub 계정으로 로그인

2. **새 프로젝트 생성**
   - "New Project" 버튼 클릭
   - GitHub에서 `JuliusKim0730/arway` 저장소 선택
   - "Import" 클릭

### **2단계: 프로젝트 설정**

#### **Framework 설정**
- **Framework Preset**: Next.js (자동 감지됨)
- **Root Directory**: `frontend` ⚠️ **중요!**
- **Build Command**: `npm run build` (자동 설정됨)
- **Output Directory**: `.next` (자동 설정됨)
- **Install Command**: `npm install` (자동 설정됨)

### **3단계: 환경 변수 설정 (중요!)**

⚠️ **주의**: 환경 변수는 반드시 Vercel 대시보드에서 설정해야 합니다.

#### **설정 방법**
1. Vercel 프로젝트 대시보드 → **Settings** 탭
2. 왼쪽 메뉴에서 **Environment Variables** 클릭
3. 아래 변수들을 하나씩 추가:

#### **필수 환경 변수**

| Name | Value | Environment |
|------|-------|-------------|
| `NEXTAUTH_URL` | `https://your-app-name.vercel.app` | Production |
| `NEXTAUTH_SECRET` | `your-random-secret-32-chars` | All |
| `GOOGLE_CLIENT_ID` | `your-google-client-id` | All |
| `GOOGLE_CLIENT_SECRET` | `your-google-client-secret` | All |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `your-google-maps-api-key` | All |
| `NEXT_PUBLIC_API_URL` | `https://your-backend-url` | All |

#### **환경 변수 값 예시**

```bash
# NextAuth 설정
NEXTAUTH_URL=https://arway-julius.vercel.app
NEXTAUTH_SECRET=your-32-character-random-secret-key-here

# Google OAuth (Google Cloud Console에서 발급)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy-your-google-maps-api-key

# 백엔드 API (선택사항 - 오프라인 모드 지원)
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

#### **현재 로컬 값 확인**
```powershell
# 프론트엔드 .env.local에서 값 복사
cd frontend
cat .env.local
```

### **4단계: 배포 실행**

1. **Deploy 버튼 클릭**
2. **빌드 과정 모니터링** (2-5분 소요)
3. **배포 완료 확인**

---

## 🔧 **배포 후 필수 설정**

### **1. Google OAuth 설정 업데이트**

Google Cloud Console (https://console.cloud.google.com) 에서:

1. **API 및 서비스** → **사용자 인증 정보**
2. **OAuth 2.0 클라이언트 ID** 선택
3. **승인된 JavaScript 원본** 추가:
   ```
   https://your-app-name.vercel.app
   ```
4. **승인된 리디렉션 URI** 추가:
   ```
   https://your-app-name.vercel.app/api/auth/callback/google
   ```

### **2. NEXTAUTH_URL 업데이트**

배포 완료 후 실제 URL로 업데이트:
1. Vercel 대시보드 → **Settings** → **Environment Variables**
2. `NEXTAUTH_URL` 값을 실제 배포 URL로 변경
3. **Save** 후 **Redeploy** 실행

---

## 🚨 **일반적인 배포 에러 해결**

### **1. "Environment Variable references Secret" 에러**
- **원인**: `vercel.json`에 잘못된 `@` 문법 사용
- **해결**: ✅ 이미 수정됨 (환경 변수는 대시보드에서만 설정)

### **2. "Root Directory not found" 에러**
- **원인**: Root Directory 설정 누락
- **해결**: Root Directory를 `frontend`로 설정

### **3. "Build failed" 에러**
```bash
# 로컬에서 빌드 테스트
cd frontend
npm run build

# 에러 확인 후 수정
```

### **4. "OAuth redirect_uri_mismatch" 에러**
- **원인**: Google OAuth 설정 미업데이트
- **해결**: Google Cloud Console에서 리디렉션 URI 추가

---

## 🧪 **배포 테스트 체크리스트**

### **기본 기능**
- [ ] 메인 페이지 로딩 (https://your-app.vercel.app)
- [ ] Google 로그인 동작
- [ ] 지도 표시 (Google Maps API)
- [ ] GPS 권한 요청
- [ ] 카메라 권한 요청

### **AR 네비게이션**
- [ ] 목적지 선택 화면
- [ ] 지도 클릭으로 시작/도착 설정
- [ ] AR 네비게이션 시작
- [ ] 방향 화살표 표시
- [ ] 거리 계산 및 표시

### **모바일 테스트**
- [ ] iOS Safari 동작
- [ ] Android Chrome 동작
- [ ] 터치 인터페이스
- [ ] 세로/가로 모드

---

## 🎯 **단계별 배포 가이드**

### **Step 1: 즉시 배포**
1. https://vercel.com 접속
2. GitHub 로그인
3. "New Project" → `JuliusKim0730/arway` 선택
4. **Root Directory**: `frontend` 설정 ⚠️
5. Deploy 클릭

### **Step 2: 환경 변수 설정**
1. 배포 완료 후 Settings → Environment Variables
2. 위 표의 6개 변수 모두 추가
3. Save 후 Redeploy

### **Step 3: Google OAuth 설정**
1. Google Cloud Console 접속
2. OAuth 클라이언트 설정 업데이트
3. 승인된 도메인에 Vercel URL 추가

### **Step 4: 최종 테스트**
1. 배포된 URL 접속
2. 전체 기능 테스트
3. 모바일에서 테스트

---

## 📱 **오프라인 모드 지원**

ARWay Lite는 백엔드 없이도 동작합니다:
- ✅ **Google Maps API만으로 완전 동작**
- ✅ **직선 경로 네비게이션 지원**
- ✅ **오프라인 모드 자동 전환**

`NEXT_PUBLIC_API_URL`을 설정하지 않아도 됩니다!

---

## 🎉 **배포 성공!**

성공적으로 배포되면:
- **라이브 URL**: https://your-app-name.vercel.app
- **자동 HTTPS**: SSL 인증서 자동 적용
- **글로벌 CDN**: 전 세계 빠른 접속
- **자동 배포**: GitHub 푸시 시 자동 업데이트

---

**작성일**: 2025-12-22 (수정됨)  
**GitHub**: https://github.com/JuliusKim0730/arway  
**문의**: GitHub Issues