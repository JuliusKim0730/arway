# 🌐 클라우드 환경변수 설정 가이드

## ⚠️ 중요: 로컬 파일에 API 키 저장 금지!

클라우드 배포 시에는 **절대로** `.env.local` 파일에 실제 API 키를 저장하면 안 됩니다:
- 🚫 보안 위험 (GitHub에 노출)
- 🚫 배포 시 작동하지 않음
- 🚫 환경별 설정 불가능

## 🔵 Vercel 환경변수 설정

### 1. Vercel 대시보드 접속
1. https://vercel.com 로그인
2. 프로젝트 선택 (arway)
3. **Settings** 탭 클릭
4. 왼쪽 메뉴에서 **Environment Variables** 선택

### 2. API 키 추가

#### TMAP API 키 설정
```
Name: REACT_APP_TMAP_API_KEY
Value: l7xx1234567890abcdef1234567890abcdef12
Environment: ✅ Production ✅ Preview ✅ Development
```

#### Google Maps API 키 설정
```
Name: REACT_APP_GOOGLE_MAPS_API_KEY
Value: AIzaSy-your-google-maps-api-key-here
Environment: ✅ Production ✅ Preview ✅ Development
```

### 3. 배포 재실행
- **Save** 버튼 클릭
- **Deployments** 탭으로 이동
- **Redeploy** 버튼 클릭

## 🟢 Render 환경변수 설정

### 1. Render 대시보드 접속
1. https://render.com 로그인
2. 프론트엔드 서비스 선택 (arway-frontend)
3. **Environment** 탭 클릭

### 2. API 키 추가

#### TMAP API 키 설정
```
Key: REACT_APP_TMAP_API_KEY
Value: l7xx1234567890abcdef1234567890abcdef12
```

#### Google Maps API 키 설정
```
Key: REACT_APP_GOOGLE_MAPS_API_KEY
Value: AIzaSy-your-google-maps-api-key-here
```

### 3. 자동 재배포
- **Save Changes** 클릭
- 자동으로 재배포 시작

## 🔐 API 키 발급 방법

### TMAP API 키 발급
1. **TMAP 개발자 센터**: https://tmapapi.sktelecom.com/
2. **회원가입/로그인**
3. **앱 등록**:
   - 앱 이름: "AR Navigation App"
   - 서비스 URL: 배포된 도메인 (예: https://arway-julius.vercel.app)
4. **API 신청**: "도보 경로 안내" 선택
5. **API 키 복사**: `l7xx`로 시작하는 키

### Google Maps API 키 발급
1. **Google Cloud Console**: https://console.cloud.google.com/
2. **프로젝트 생성** 또는 기존 프로젝트 선택
3. **API 및 서비스** → **라이브러리**
4. **Maps JavaScript API** 및 **Directions API** 활성화
5. **사용자 인증 정보** → **API 키 만들기**
6. **API 키 제한 설정**:
   - HTTP 리퍼러: 배포된 도메인 추가
   - API 제한: Maps JavaScript API, Directions API만 선택

## 🧪 환경변수 설정 확인

### 로컬 개발 환경
```bash
# .env.local (개발용 - 실제 키 사용 금지)
REACT_APP_TMAP_API_KEY=YOUR_TMAP_API_KEY_HERE
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
```

### 배포 환경 확인
1. 배포된 사이트 접속
2. 개발자 도구 → Console
3. 다음 메시지 확인:
   - ✅ "🇰🇷 국내 위치 감지: TMAP API 기반 경로를 요청합니다."
   - ✅ "🌍 해외 위치 감지: Google Maps API 기반 경로를 요청합니다."

## 🚨 보안 주의사항

### ✅ 올바른 방법
- 클라우드 플랫폼 대시보드에서 환경변수 설정
- API 키에 도메인 제한 설정
- 프로덕션/개발 환경 분리

### 🚫 잘못된 방법
- `.env.local`에 실제 API 키 저장
- GitHub에 API 키 커밋
- API 키 제한 없이 사용

## 🔄 환경변수 업데이트 프로세스

### Vercel
1. Settings → Environment Variables
2. 기존 변수 **Edit** 클릭
3. 새 값 입력 → **Save**
4. Deployments → **Redeploy**

### Render
1. Environment 탭
2. 기존 변수 **Edit** 클릭  
3. 새 값 입력 → **Save Changes**
4. 자동 재배포 대기

## 📱 모바일 테스트

환경변수 설정 후 모바일에서 테스트:
1. **iOS Safari**: GPS 권한 허용 후 테스트
2. **Android Chrome**: 위치 권한 허용 후 테스트
3. **한국 위치**: TMAP API 사용 확인
4. **해외 위치**: Google Maps API 사용 확인

## 🎯 배포 체크리스트

- [ ] TMAP API 키 클라우드 플랫폼에 설정
- [ ] Google Maps API 키 클라우드 플랫폼에 설정
- [ ] API 키에 도메인 제한 설정
- [ ] 배포 후 재배포 실행
- [ ] 실제 디바이스에서 테스트
- [ ] 한국/해외 위치별 API 동작 확인

---

**중요**: 로컬 개발 시에만 `.env.local` 사용하고, 배포 시에는 반드시 클라우드 플랫폼의 환경변수 설정을 사용하세요!