# 🚀 프로덕션 배포 및 테스트 체크리스트

**작성일**: 2025-12-22  
**배포 플랫폼**: Vercel (프론트엔드) + Render (백엔드)

---

## ✅ 배포 후 테스트 가능 여부

**네, 배포된 사이트에서도 완전히 테스트 가능합니다!**

다만 다음 설정을 확인해야 합니다:

---

## 📋 배포 전 필수 체크리스트

### 1️⃣ Render 백엔드 설정 확인

#### A. Render 대시보드에서 확인할 사항

1. **서비스 URL 확인**
   - Render 대시보드 → `arway-backend` 서비스
   - URL 예시: `https://arway-backend.onrender.com`
   - 이 URL을 복사해두세요!

2. **환경 변수 확인**
   - `CORS_ORIGINS`에 Vercel 도메인이 포함되어 있는지 확인
   - 현재 설정: `https://arway-self.vercel.app,http://localhost:3000`
   - ⚠️ **실제 Vercel 도메인과 일치하는지 확인 필요!**

3. **데이터베이스 연결 확인**
   - `DATABASE_URL`이 Supabase URL로 설정되어 있는지 확인
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 설정 확인

#### B. render.yaml 업데이트 (필요시)

만약 실제 Vercel 도메인이 다르다면:

```yaml
envVars:
  - key: CORS_ORIGINS
    value: https://your-actual-vercel-domain.vercel.app,https://arway-self.vercel.app,http://localhost:3000
```

---

### 2️⃣ Vercel 프론트엔드 설정 확인

#### A. 필수 환경 변수 설정

Vercel 대시보드 → Settings → Environment Variables:

| 변수명 | 설명 | 예시 값 |
|--------|------|---------|
| `NEXT_PUBLIC_API_URL` | **Render 백엔드 URL** | `https://arway-backend.onrender.com` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API 키 | `AIzaSy-...` |
| `NEXTAUTH_URL` | Vercel 배포 URL | `https://arway-self.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth 시크릿 키 | `32자 랜덤 문자열` |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 시크릿 | `GOCSPX-xxx` |

#### B. Next.js 환경 변수 확인

⚠️ **중요**: Next.js는 `NEXT_PUBLIC_` 접두사가 있는 변수만 클라이언트에서 접근 가능합니다.

현재 코드에서 사용 중인 변수:
- ✅ `NEXT_PUBLIC_API_URL` - 백엔드 URL
- ✅ `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API 키
- ❌ `REACT_APP_TMAP_API_KEY` - Next.js에서는 사용 불가! (Create React App 전용)

#### C. TMAP API 키 설정 (Next.js용)

Next.js에서는 `REACT_APP_` 접두사를 사용하지 않습니다. 대신:

**옵션 1: 환경 변수로 설정**
```bash
# Vercel 환경 변수에 추가
NEXT_PUBLIC_TMAP_API_KEY=l7xx...
```

**옵션 2: 코드에서 직접 사용 (현재 방식)**
- `components/TmapNavigationComponent.tsx`에서 직접 설정
- 또는 런타임에 사용자 입력으로 설정

---

### 3️⃣ Google OAuth 설정 업데이트

Google Cloud Console에서:

1. **승인된 JavaScript 원본** 추가:
   ```
   https://arway-self.vercel.app
   ```

2. **승인된 리디렉션 URI** 추가:
   ```
   https://arway-self.vercel.app/api/auth/callback/google
   ```

---

## 🧪 배포 후 테스트 가이드

### Step 1: 기본 연결 테스트

1. **Vercel 사이트 접속**
   ```
   https://arway-self.vercel.app
   ```

2. **브라우저 개발자 도구 열기** (F12)
   - Console 탭 확인
   - Network 탭 확인

3. **API 연결 확인**
   ```javascript
   // Console에서 실행
   fetch('https://arway-backend.onrender.com/health')
     .then(r => r.json())
     .then(console.log)
   ```
   - 예상 결과: `{ "status": "ok" }`

### Step 2: SCQ 기능 테스트

#### A. 지오펜스 API 테스트
```javascript
// Console에서 실행
fetch('https://arway-backend.onrender.com/api/v1/geofences?lat=37.4979&lng=127.0276&radius=1000')
  .then(r => r.json())
  .then(console.log)
```

#### B. 건물 목록 API 테스트
```javascript
fetch('https://arway-backend.onrender.com/api/v1/buildings')
  .then(r => r.json())
  .then(console.log)
```

#### C. POI 조회 API 테스트
```javascript
fetch('https://arway-backend.onrender.com/api/v1/pois?lat=37.4979&lng=127.0276&radius=100')
  .then(r => r.json())
  .then(console.log)
```

### Step 3: 프론트엔드 통합 테스트

1. **AR 네비게이션 페이지 접속**
   ```
   https://arway-self.vercel.app/ar-nav/select
   ```

2. **기능별 테스트**
   - [ ] 지도 로딩 (Google Maps)
   - [ ] 현재 위치 표시
   - [ ] 목적지 검색
   - [ ] 경로 계산
   - [ ] AR 네비게이션 시작
   - [ ] SCQ 기능 (실내/실외 전환, POI 인식)

### Step 4: CORS 에러 확인

만약 CORS 에러가 발생한다면:

1. **브라우저 Console 확인**
   ```
   Access to fetch at 'https://arway-backend.onrender.com/...' 
   from origin 'https://arway-self.vercel.app' has been blocked by CORS policy
   ```

2. **해결 방법**
   - Render 대시보드 → Environment → `CORS_ORIGINS` 확인
   - Vercel 도메인이 포함되어 있는지 확인
   - 없으면 추가 후 재배포

---

## 🔧 문제 해결 가이드

### 문제 1: "API 연결 실패"

**증상**: Network 탭에서 404 또는 CORS 에러

**해결**:
1. `NEXT_PUBLIC_API_URL` 환경 변수 확인
2. Render 백엔드가 실행 중인지 확인
3. Render 로그 확인 (대시보드 → Logs)

### 문제 2: "CORS 에러"

**증상**: Console에 CORS 관련 에러 메시지

**해결**:
1. Render → Environment → `CORS_ORIGINS` 확인
2. Vercel 도메인 추가 후 재배포
3. 백엔드 재시작 (Render 자동 재배포)

### 문제 3: "Google Maps 로딩 실패"

**증상**: 지도가 표시되지 않음

**해결**:
1. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 확인
2. Google Cloud Console에서 API 키 제한 설정 확인
3. Vercel 도메인이 허용된 리퍼러에 포함되어 있는지 확인

### 문제 4: "NextAuth 로그인 실패"

**증상**: Google 로그인 후 리디렉션 실패

**해결**:
1. `NEXTAUTH_URL`이 실제 Vercel 도메인과 일치하는지 확인
2. Google Cloud Console에서 리디렉션 URI 확인
3. `NEXTAUTH_SECRET` 설정 확인

---

## 📊 배포 상태 확인 명령어

### Render 백엔드 상태 확인
```bash
# 헬스 체크
curl https://arway-backend.onrender.com/health

# API 문서 확인
curl https://arway-backend.onrender.com/docs
```

### Vercel 프론트엔드 상태 확인
```bash
# 메인 페이지 확인
curl https://arway-self.vercel.app

# 환경 변수 확인 (빌드 시점에만 확인 가능)
# Vercel 대시보드 → Settings → Environment Variables
```

---

## 🎯 최종 체크리스트

### 배포 전
- [ ] Render 백엔드 URL 확인 및 복사
- [ ] Vercel 환경 변수에 `NEXT_PUBLIC_API_URL` 설정
- [ ] Render `CORS_ORIGINS`에 Vercel 도메인 추가
- [ ] Google OAuth 리디렉션 URI 업데이트
- [ ] Google Maps API 키에 Vercel 도메인 추가

### 배포 후
- [ ] Vercel 사이트 접속 확인
- [ ] API 연결 테스트 (Console에서 fetch)
- [ ] CORS 에러 확인
- [ ] 지도 로딩 확인
- [ ] 로그인 기능 확인
- [ ] AR 네비게이션 기능 확인
- [ ] SCQ 기능 확인 (지오펜스, POI 등)

---

## 🚀 빠른 배포 가이드

### 1. GitHub 푸시
```bash
git add .
git commit -m "SCQ 통합 및 배포 준비"
git push origin main
```

### 2. Render 자동 배포 확인
- Render 대시보드 → `arway-backend` → Deployments
- 배포 완료 대기 (5-10분)

### 3. Vercel 자동 배포 확인
- Vercel 대시보드 → Deployments
- 배포 완료 대기 (2-5분)

### 4. 환경 변수 확인 및 설정
- Vercel → Settings → Environment Variables
- `NEXT_PUBLIC_API_URL` = Render 백엔드 URL
- 기타 필수 변수 확인

### 5. 테스트 실행
- 배포된 사이트 접속
- 위의 "배포 후 테스트 가이드" 따라하기

---

## 📝 참고 사항

### Render 무료 플랜 제한사항
- **15분 비활성 시 슬립 모드**: 첫 요청 시 약 30초 지연 가능
- **해결책**: Keep-Alive 엔드포인트 사용 또는 UptimeRobot 설정

### Vercel 무료 플랜 제한사항
- **빌드 시간 제한**: 45분/월
- **대역폭 제한**: 100GB/월
- **함수 실행 시간**: 10초 (Hobby 플랜)

### 성능 최적화
- 첫 로딩 시 Render 백엔드가 슬립 모드에서 깨어나는 시간 고려
- 프론트엔드에서 재시도 로직 구현 (이미 구현됨)

---

**배포 후 문제가 발생하면 위의 "문제 해결 가이드"를 참고하세요!**

