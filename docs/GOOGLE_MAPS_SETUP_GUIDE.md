# 구글 맵 API 설정 가이드

**작성일**: 2024년 12월 19일  
**목적**: 구글 맵 API 연동 설정 방법

---

## 📋 사전 준비

1. Google 계정 필요
2. 결제 정보 등록 필요 (무료 티어 사용 시에도 필요)
3. 신용카드 또는 계좌 정보

---

## 🔑 API 키 발급 단계

### 1단계: Google Cloud Console 접속

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. Google 계정으로 로그인

### 2단계: 프로젝트 생성

1. 상단 프로젝트 선택 드롭다운 클릭
2. "새 프로젝트" 클릭
3. 프로젝트 이름 입력 (예: "ARWay Lite")
4. "만들기" 클릭

### 3단계: API 활성화

1. 좌측 메뉴에서 "APIs & Services" > "Library" 클릭
2. 다음 API들을 검색하여 활성화:
   - **Directions API** (필수)
   - Maps JavaScript API (선택 - 지도 표시용)
   - Places API (선택 - 장소 검색용)
   - Geocoding API (선택 - 주소 변환용)

3. 각 API 페이지에서 "사용 설정" 버튼 클릭

### 4단계: API 키 생성

**Credentials란?**
- Google Cloud Console의 "Credentials"는 **키 및 사용자 인증정보**를 관리하는 섹션입니다
- API 키, OAuth 클라이언트 ID, 서비스 계정 키 등을 여기서 생성하고 관리합니다
- 우리는 여기서 **API 키**를 생성합니다

**API 키 생성 방법**:
1. 좌측 메뉴에서 "APIs & Services" > "Credentials" 클릭
2. 상단 "+ 자격 증명 만들기" (Create Credentials) 버튼 클릭
3. 드롭다운 메뉴에서 "API 키" (API key) 선택
4. API 키가 생성되면 팝업 창에 표시됨 → 복사 버튼 클릭하여 복사
5. **중요**: API 키를 복사한 후 안전한 곳에 저장하세요

### 5단계: API 키 제한 설정 (보안) ⚠️ 중요!

**왜 제한이 필요한가?**
- API 키가 노출되면 다른 사람이 사용할 수 있어 비용이 발생할 수 있습니다
- 제한을 설정하면 지정된 도메인과 API에서만 사용 가능합니다

**제한 설정 방법**:
1. 생성된 API 키를 클릭하여 상세 페이지로 이동
2. "애플리케이션 제한사항" (Application restrictions) 섹션에서:
   - "HTTP 리퍼러(웹사이트)" (HTTP referrers) 선택
   - "웹사이트 제한사항" (Website restrictions)에 다음 추가:
     ```
     http://localhost:3000/*
     https://yourdomain.com/*
     ```
   - 개발 중에는 `http://localhost:3000/*`만 추가해도 됩니다
3. "API 제한사항" (API restrictions) 섹션에서:
   - "키 제한" (Restrict key) 선택
   - "API 선택" (Select APIs) 클릭
   - Directions API만 선택 (또는 필요한 API만)
   - "저장" 클릭
4. 페이지 하단의 "저장" (Save) 버튼 클릭

**주의사항**:
- 제한 설정 후 몇 분 정도 지연될 수 있습니다
- 제한을 너무 엄격하게 설정하면 정상 작동하지 않을 수 있습니다

---

## ⚙️ 환경 변수 설정

### 프론트엔드 설정

**파일**: `frontend/.env.local` (새로 생성)

```env
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**주의사항**:
- `.env.local` 파일은 `.gitignore`에 포함되어 있어야 합니다
- API 키를 절대 Git에 커밋하지 마세요
- `.env.example` 파일만 커밋하세요

### 환경 변수 적용

1. `.env.local` 파일 생성
2. 위의 내용을 복사하여 붙여넣기
3. `your_api_key_here`를 실제 API 키로 교체
4. 프론트엔드 서버 재시작:
   ```bash
   cd frontend
   npm run dev
   ```

---

## 🧪 테스트 방법

### 1. API 키 확인

브라우저 콘솔에서 확인:
```javascript
console.log(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
```

### 2. 구글 맵 API 호출 테스트

AR 네비게이션 화면에서:
1. 목적지 선택
2. AR 네비 실행 화면으로 이동
3. 거리가 500m 이상이면 구글 맵 API 자동 호출
4. 상태 텍스트에 🗺️ 아이콘 표시 확인

### 3. API 호출 확인

브라우저 개발자 도구 > Network 탭:
- `directions/json` 요청 확인
- 응답 상태 확인 (200 OK)

---

## 🔒 보안 주의사항

### API 키 보안

1. **프론트엔드에서 사용 시**:
   - HTTP referrer 제한 필수
   - API 제한 설정 필수
   - 도메인 제한 설정 필수

2. **프로덕션 배포 시**:
   - 백엔드 프록시 방식 권장
   - API 키를 서버에서만 관리
   - 환경 변수로 관리

### 사용량 모니터링

1. Google Cloud Console > "APIs & Services" > "Dashboard"
2. 사용량 확인
3. 알림 설정:
   - "APIs & Services" > "Quotas"
   - 알림 임계값 설정 (예: 80%)

---

## 💰 비용 관리

### 무료 티어 확인

1. Google Cloud Console > "Billing"
2. "예산 및 알림" 설정
3. 월 예산 알림 설정 (예: $10)

### 사용량 제한 설정

1. "APIs & Services" > "Quotas"
2. Directions API 선택
3. 일일/월별 제한 설정

---

## 🐛 문제 해결

### API 키가 작동하지 않을 때

1. **API 활성화 확인**:
   - Directions API가 활성화되어 있는지 확인
   - 프로젝트가 올바른지 확인

2. **API 키 제한 확인**:
   - HTTP referrer 제한이 올바른지 확인
   - 도메인이 허용 목록에 있는지 확인

3. **환경 변수 확인**:
   - `.env.local` 파일이 올바른 위치에 있는지 확인
   - 변수 이름이 `NEXT_PUBLIC_`로 시작하는지 확인
   - 서버 재시작 확인

### CORS 에러

- 구글 맵 API는 CORS를 지원하므로 문제 없음
- 만약 에러가 발생하면 API 키 제한 설정 확인

### 요청 제한 초과

- Google Cloud Console에서 사용량 확인
- 무료 티어 한도 확인
- 필요시 결제 정보 확인

---

## 📝 체크리스트

- [ ] Google Cloud Console 프로젝트 생성
- [ ] Directions API 활성화
- [ ] API 키 생성
- [ ] API 키 제한 설정 (HTTP referrer, API 제한)
- [ ] `.env.local` 파일 생성
- [ ] 환경 변수 설정
- [ ] 프론트엔드 서버 재시작
- [ ] 테스트 실행
- [ ] 사용량 모니터링 설정

---

## 🚀 다음 단계

API 키 설정 완료 후:
1. AR 네비게이션 화면에서 테스트
2. 장거리 목적지로 테스트 (500m 이상)
3. 구글 맵 경로가 사용되는지 확인
4. 단계별 안내 기능 추가 (선택)

---

**마지막 업데이트**: 2024년 12월 19일

