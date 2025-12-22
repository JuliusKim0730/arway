# ARWay Lite 설정 필수 사항 체크리스트

**작성일**: 2024년 12월 19일  
**목적**: Google Maps API 키 외 필요한 모든 설정 사항 정리

---

## 🔑 1. Google Maps API 설정 (필수)

### 1.1 Google Cloud Console 설정

#### 필수 API 활성화
다음 API들을 **반드시 활성화**해야 합니다:

1. **Directions API** (필수)
   - 경로 계산 및 네비게이션 안내
   - 사용 위치: `frontend/lib/googleMaps.ts` - `getDirections()`

2. **Places API** (필수)
   - 장소 검색 기능
   - 사용 위치: `frontend/lib/googleMaps.ts` - `searchPlaces()`, `autocompletePlaces()`, `getPlaceDetails()`
   - **중요**: Places API는 다음 서비스를 포함합니다:
     - Places API (New) - Text Search
     - Places API (New) - Autocomplete
     - Places API (New) - Place Details

3. **Maps JavaScript API** (필수)
   - 지도 표시 기능
   - 사용 위치: `frontend/components/GoogleMap.tsx`
   - **중요**: `libraries=places` 파라미터 사용

#### API 활성화 방법
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 또는 생성
3. "APIs & Services" > "Library" 메뉴 이동
4. 위 3개 API 검색 후 각각 "사용 설정" 클릭

### 1.2 API 키 생성 및 제한 설정

#### API 키 생성
1. "APIs & Services" > "Credentials" 메뉴 이동
2. "+ 자격 증명 만들기" > "API 키" 선택
3. 생성된 API 키 복사

#### API 키 제한 설정 (보안 필수)
1. 생성된 API 키 클릭하여 상세 페이지 이동
2. **애플리케이션 제한사항**:
   - "HTTP 리퍼러(웹사이트)" 선택
   - 다음 도메인 추가:
     ```
     http://localhost:3000/*
     https://yourdomain.com/*
     ```
3. **API 제한사항**:
   - "키 제한" 선택
   - 다음 API만 선택:
     - Directions API
     - Places API (New)
     - Maps JavaScript API

### 1.3 결제 정보 등록
- **중요**: 무료 티어 사용 시에도 결제 정보 등록이 필요합니다
- Google Cloud Console > "결제" 메뉴에서 결제 정보 등록
- 월 $200 크레딧 무료 제공 (일반적으로 충분함)

---

## ⚙️ 2. 환경 변수 설정 (필수)

### 2.1 프론트엔드 환경 변수

**파일**: `frontend/.env.local` (새로 생성)

```env
# Google Maps API Key (필수)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here

# Backend API URL (필수)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**주의사항**:
- `.env.local` 파일은 `.gitignore`에 포함되어 있어야 합니다
- API 키를 절대 Git에 커밋하지 마세요
- 환경 변수 변경 후 프론트엔드 서버 재시작 필요

### 2.2 백엔드 환경 변수 (선택사항)

**파일**: `backend/.env` (필요시 생성)

```env
# Database URL (기본값 사용 가능)
DATABASE_URL=postgresql://user:password@localhost:5433/arway_lite

# Google Maps API Key (백엔드에서 사용하는 경우만)
GOOGLE_MAPS_API_KEY=your_api_key_here
```

**참고**: 현재 구현에서는 백엔드에서 Google Maps API를 직접 호출하지 않으므로 선택사항입니다.

---

## 🗄️ 3. 데이터베이스 설정 (필수)

### 3.1 PostgreSQL 데이터베이스

#### Docker로 PostgreSQL 실행
```powershell
cd "C:\Cursor Project\new_challange"
docker-compose up -d postgres
```

#### 데이터베이스 마이그레이션 실행
```powershell
cd backend
.\venv\Scripts\python.exe -m alembic upgrade head
```

#### 초기 데이터 시드 (선택사항)
```powershell
.\venv\Scripts\python.exe app/database/seeds.py
```

### 3.2 데이터베이스 스키마 확인

다음 테이블이 생성되어 있어야 합니다:
- `users` - 사용자 정보
- `destinations` - 목적지 정보 (Google Places API 사용 시 자동 생성)
- `navigation_sessions` - 네비게이션 세션
- `navigation_points` - 네비게이션 포인트
- `favorites` - 즐겨찾기

---

## 📱 4. 브라우저 권한 설정 (필수)

### 4.1 위치 권한 (GPS)
- 브라우저에서 위치 권한 허용 필요
- HTTPS 또는 localhost에서만 작동
- 권한 거부 시 "위치 권한 요청" 버튼으로 재요청 가능

### 4.2 카메라 권한
- AR 네비게이션 화면에서 카메라 접근 권한 필요
- 브라우저에서 카메라 권한 허용 필요

### 4.3 디바이스 방향 권한
- iOS Safari: Settings > Safari > Motion & Orientation Access
- Android Chrome: 자동 허용

---

## 🔧 5. 개발 환경 설정

### 5.1 Node.js 및 npm
- Node.js 18.x 이상 필요
- npm 또는 yarn 설치 필요

### 5.2 Python 및 가상환경
- Python 3.9 이상 필요
- 백엔드 가상환경 생성 및 활성화:
  ```powershell
  cd backend
  python -m venv venv
  .\venv\Scripts\activate
  pip install -r requirements.txt
  ```

### 5.3 Docker (선택사항)
- PostgreSQL 데이터베이스 실행용
- Docker Desktop 설치 필요

---

## 🧪 6. 테스트 및 확인 사항

### 6.1 Google Maps API 작동 확인

#### 브라우저 콘솔에서 확인
```javascript
// API 키 확인
console.log(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

// Google Maps API 사용 가능 여부
import { isGoogleMapsAvailable } from '@/lib/googleMaps';
console.log(isGoogleMapsAvailable());
```

#### 기능별 테스트
1. **지도 표시**: 목적지 선택 페이지에서 지도가 표시되는지 확인
2. **장소 검색**: 검색창에 장소명 입력하여 결과가 나오는지 확인
3. **경로 계산**: AR 네비게이션 시작 후 경로가 계산되는지 확인

### 6.2 네트워크 요청 확인

브라우저 개발자 도구 > Network 탭에서 다음 요청 확인:
- `directions/json` - Directions API 호출
- `place/textsearch/json` - Places API 검색
- `maps/api/js` - Maps JavaScript API 로드

### 6.3 에러 확인

#### 일반적인 에러 및 해결 방법

1. **"Google Maps API 키가 설정되지 않았습니다"**
   - `.env.local` 파일 확인
   - 환경 변수 이름 확인 (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
   - 프론트엔드 서버 재시작

2. **"This API project is not authorized to use this API"**
   - Google Cloud Console에서 해당 API 활성화 확인
   - API 키 제한 설정 확인

3. **"RefererNotAllowedMapError"**
   - API 키의 HTTP referrer 제한 확인
   - `http://localhost:3000/*` 추가 확인

4. **"REQUEST_DENIED"**
   - API 키 제한 설정 확인
   - 결제 정보 등록 확인

---

## 📋 7. 체크리스트

### Google Cloud Console
- [ ] 프로젝트 생성 또는 선택
- [ ] Directions API 활성화
- [ ] Places API (New) 활성화
- [ ] Maps JavaScript API 활성화
- [ ] API 키 생성
- [ ] API 키 제한 설정 (HTTP referrer, API 제한)
- [ ] 결제 정보 등록

### 환경 변수
- [ ] `frontend/.env.local` 파일 생성
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 설정
- [ ] `NEXT_PUBLIC_API_URL` 설정
- [ ] 프론트엔드 서버 재시작

### 데이터베이스
- [ ] PostgreSQL 실행 (Docker 또는 직접 설치)
- [ ] 데이터베이스 마이그레이션 실행
- [ ] 데이터베이스 연결 확인

### 브라우저 권한
- [ ] 위치 권한 허용
- [ ] 카메라 권한 허용
- [ ] 디바이스 방향 권한 확인 (iOS)

### 테스트
- [ ] 지도 표시 확인
- [ ] 장소 검색 기능 확인
- [ ] 경로 계산 기능 확인
- [ ] AR 네비게이션 작동 확인

---

## 🚨 중요 주의사항

### 보안
1. **API 키 보안**:
   - API 키를 절대 Git에 커밋하지 마세요
   - 프로덕션 배포 시 API 키 제한 설정 필수
   - HTTP referrer 제한 설정 필수

2. **사용량 모니터링**:
   - Google Cloud Console에서 사용량 모니터링 설정
   - 예산 알림 설정 권장

### 비용 관리
- 무료 티어: 월 $200 크레딧
- Directions API: 월 40,000회 무료
- Places API: 월 17,000회 무료
- Maps JavaScript API: 월 28,000회 무료

### 성능 최적화
- Places API 검색 결과 캐싱 고려
- Directions API 호출 최소화 (필요시에만 호출)
- 지도 로드 지연 (lazy loading) 고려

---

## 📞 문제 해결

### API 키 관련 문제
1. Google Cloud Console > APIs & Services > Credentials 확인
2. API 활성화 상태 확인
3. API 키 제한 설정 확인

### 데이터베이스 관련 문제
1. Docker 컨테이너 상태 확인: `docker ps`
2. 데이터베이스 연결 확인: `backend/scripts/check_database.ps1`
3. 마이그레이션 상태 확인: `alembic current`

### 브라우저 권한 관련 문제
1. 브라우저 설정에서 권한 확인
2. HTTPS 사용 (localhost는 예외)
3. 브라우저 콘솔에서 에러 메시지 확인

---

**마지막 업데이트**: 2024년 12월 19일

