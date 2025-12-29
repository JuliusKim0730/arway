# 🚨 배포 환경 Google Maps Directions API 에러 해결 가이드

## 📋 문제 증상

**로컬 환경에서는 정상 동작하지만, Vercel/Render 배포 후 "목적지 선택 → 길찾기" 단계에서 에러 발생**

에러 메시지: `Google Maps API 실패: REQUEST_DENIED` 또는 기타 Directions API 관련 에러

---

## 🔍 원인 분석

배포 환경에서만 발생하는 Google Maps Directions API 실패의 주요 원인:

### 1. Google API Key HTTP Referrer 제한 (가장 흔함)

**증상**: `REQUEST_DENIED` 또는 콘솔에 `RefererNotAllowedMapError`

**원인**: Google Cloud Console에서 API Key의 HTTP Referrer 제한에 배포 도메인이 포함되지 않음

**해결 방법**:

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. **APIs & Services** → **Credentials** 선택
3. 사용 중인 API Key 클릭
4. **Application restrictions** 섹션에서 **HTTP referrers (web sites)** 선택
5. **Website restrictions**에 다음 도메인 추가:
   ```
   http://localhost:*
   https://*.vercel.app/*
   https://<커스텀도메인>/*
   ```
6. **저장** 클릭

**중요**: 변경 후 최대 5분 정도 소요될 수 있으므로, 재배포 후 잠시 대기

---

### 2. Billing 미연결 또는 결제 이슈

**증상**: `REQUEST_DENIED` 또는 `BillingNotEnabledMapError`

**원인**: Google Maps API는 무료 할당량이 있지만, Directions API는 Billing 계정 연결이 필요할 수 있음

**해결 방법**:

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. **Billing** 메뉴 선택
3. 프로젝트에 결제 계정 연결
4. **APIs & Services** → **Dashboard**에서 다음 API 활성화 확인:
   - ✅ Maps JavaScript API
   - ✅ Places API (목적지 검색 사용 시)
   - ✅ Directions API (길찾기 필수)

---

### 3. 필요한 API 미활성화

**증상**: `ApiNotActivatedMapError` 또는 `REQUEST_DENIED`

**원인**: Directions API가 활성화되지 않음

**해결 방법**:

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. **APIs & Services** → **Library** 선택
3. 다음 API 검색 후 **Enable** 클릭:
   - **Maps JavaScript API** (필수)
   - **Places API** (목적지 검색 사용 시)
   - **Directions API** (길찾기 필수)

---

### 4. Vercel 환경 변수 미설정

**증상**: 지도는 보이지만 Directions 호출 시 에러

**원인**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`가 Vercel 환경 변수에 설정되지 않음

**해결 방법**:

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택 → **Settings** → **Environment Variables**
3. 다음 환경 변수 추가:
   ```
   Name: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
   Value: <실제_API_키>
   Environment: Production, Preview, Development (모두 선택)
   ```
4. **Save** 클릭
5. **Deployments** 탭에서 **Redeploy** 실행

**중요**: 환경 변수는 빌드 타임에 반영되므로, 변경 후 반드시 재배포 필요

---

### 5. 스크립트 로딩 파라미터 이슈

**증상**: 배포 환경에서만 스크립트 로딩 실패

**원인**: `marker` 라이브러리가 Advanced Marker와 충돌하거나 버전 이슈 발생

**해결 방법**: ✅ **이미 수정됨**

코드에서 `libraries=places,marker` → `libraries=places`로 변경 완료

**수정된 파일**: `frontend/components/GoogleMap.tsx`

```typescript
// 이전 (문제 발생 가능)
script.src = `${baseUrl}?key=${apiKey}&libraries=places,marker&callback=${callbackName}`;

// 수정 후 (안정화)
script.src = `${baseUrl}?key=${apiKey}&libraries=places&callback=${callbackName}`;
```

**참고**: Directions API는 `marker` 라이브러리와 무관하므로 제거해도 문제없음

---

## 🛠️ 코드 수정 사항

### 1. 상세한 에러 로깅 추가

**파일**: `frontend/services/ARNavigationManager.ts`

**변경 내용**:
- Directions API 호출 시 상세한 상태 정보 로깅
- 배포 환경에서 발생하는 에러에 대한 구체적인 안내 메시지 추가
- DirectionsService 초기화 재시도 로직 추가

**주요 개선점**:
```typescript
// 이전: 단순 에러 메시지
console.error(`Google Maps API 실패: ${status}`);

// 수정 후: 상세한 디버깅 정보
console.error('❌ Google Directions API 실패:', {
  status,
  statusText: this.getDirectionsStatusText(status),
  result: result ? { routes: result.routes?.length || 0 } : null,
  mapsVersion: window.google?.maps?.version || 'N/A',
  apiKeySet: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  currentUrl: window.location.href
});
```

### 2. DirectionsService 초기화 가드 강화

**변경 내용**:
- `initializeGoogleMapsWithRetry()` 메서드 추가
- 최대 3회 재시도 로직 구현
- 초기화 실패 시 상세한 에러 정보 제공

### 3. 에러 메시지 개선

**변경 내용**:
- `REQUEST_DENIED` 에러 시 가능한 원인과 해결 방법 안내
- `OVER_QUERY_LIMIT`, `ZERO_RESULTS` 등 각 에러 코드별 안내 메시지 추가

---

## ✅ 체크리스트

배포 전 확인 사항:

- [ ] Google Cloud Console에서 API Key의 HTTP Referrer 제한에 배포 도메인 추가
  - `https://*.vercel.app/*`
  - 커스텀 도메인 사용 시 `https://<도메인>/*`
- [ ] Billing 계정 연결 확인
- [ ] 다음 API 활성화 확인:
  - [ ] Maps JavaScript API
  - [ ] Places API (목적지 검색 사용 시)
  - [ ] Directions API
  - 💡 **확인 방법**: `docs/Google_Cloud_API_활성화_확인_가이드.md` 참조
- [ ] Vercel 환경 변수에 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 설정 확인
- [ ] 환경 변수 변경 후 재배포 완료

---

## 🧪 테스트 방법

### 1. 배포 환경에서 콘솔 확인

브라우저 개발자 도구(F12) → Console 탭에서 다음 로그 확인:

**정상 동작 시**:
```
✅ Google Directions API 성공: {
  status: "OK",
  statusText: "성공",
  mapsVersion: "3.xx",
  ...
}
```

**에러 발생 시**:
```
❌ Google Directions API 실패: {
  status: "REQUEST_DENIED",
  statusText: "요청 거부",
  ...
}
💡 가능한 원인:
1. API Key의 HTTP Referrer 제한에 배포 도메인이 포함되지 않음
   → Google Cloud Console에서 https://*.vercel.app/* 추가 필요
2. Billing이 연결되지 않음
   → Google Cloud Console에서 결제 계정 연결 필요
3. Directions API가 활성화되지 않음
   → Google Cloud Console에서 Directions API 활성화 필요
```

### 2. Network 탭 확인

브라우저 개발자 도구 → Network 탭에서:

1. **Directions API 호출 확인**:
   - URL: `https://maps.googleapis.com/maps/api/directions/...`
   - Status: `200 OK` (정상) 또는 `403 Forbidden` (에러)

2. **에러 응답 확인**:
   - Response에 `RefererNotAllowedMapError` → HTTP Referrer 제한 문제
   - Response에 `BillingNotEnabledMapError` → Billing 연결 문제
   - Response에 `ApiNotActivatedMapError` → API 미활성화 문제

---

## 🔧 추가 디버깅 팁

### 1. API Key 유효성 확인

브라우저 콘솔에서 직접 테스트:

```javascript
// API Key 확인
console.log('API Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? '설정됨' : '설정되지 않음');

// Google Maps 로드 상태 확인
console.log('Google Maps:', window.google?.maps ? '로드됨' : '로드 안됨');
console.log('Maps Version:', window.google?.maps?.version || 'N/A');
```

### 2. DirectionsService 초기화 확인

```javascript
// DirectionsService 초기화 테스트
try {
  const service = new google.maps.DirectionsService();
  console.log('✅ DirectionsService 초기화 성공');
} catch (err) {
  console.error('❌ DirectionsService 초기화 실패:', err);
}
```

### 3. 간단한 Directions 요청 테스트

```javascript
const service = new google.maps.DirectionsService();
service.route({
  origin: { lat: 37.5665, lng: 126.9780 }, // 서울시청
  destination: { lat: 37.4997, lng: 127.0839 }, // 강남역
  travelMode: google.maps.TravelMode.WALKING
}, (result, status) => {
  console.log('Status:', status);
  console.log('Result:', result);
});
```

---

## 📝 요약

배포 환경에서 Google Maps Directions API 에러가 발생하는 경우:

1. **가장 흔한 원인**: HTTP Referrer 제한에 배포 도메인 미추가
2. **두 번째 원인**: Billing 계정 미연결 또는 Directions API 미활성화
3. **세 번째 원인**: Vercel 환경 변수 미설정 또는 재배포 누락

**우선순위별 해결 순서**:
1. ✅ Google Cloud Console에서 HTTP Referrer 제한 확인 및 수정
2. ✅ Billing 계정 연결 및 Directions API 활성화 확인
3. ✅ Vercel 환경 변수 설정 확인 후 재배포
4. ✅ 브라우저 콘솔에서 상세한 에러 로그 확인

---

## 🔗 참고 링크

- [Google Maps Platform 문서](https://developers.google.com/maps/documentation)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Vercel 환경 변수 설정](https://vercel.com/docs/concepts/projects/environment-variables)
- [Google Maps API 에러 코드](https://developers.google.com/maps/documentation/directions/get-directions#DirectionsStatus)

