# Google Maps API RefererNotAllowedMapError 해결 가이드

## 문제
```
Google Maps JavaScript API error: RefererNotAllowedMapError
Your site URL to be authorized: http://localhost:3000/ar-nav/select
```

## 해결 방법

### 1. Google Cloud Console 접속
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 (ARWay Lite 프로젝트)

### 2. API 및 서비스 > 사용자 인증 정보
1. 좌측 메뉴에서 **"API 및 서비스"** > **"사용자 인증 정보"** 클릭
2. Google Maps API 키 찾기 (예: `AIzaSyBvULe9GYcGghMFhp989F9T_VL9QE8w2Vs`)

### 3. API 키 제한사항 수정
1. API 키 클릭하여 편집
2. **"애플리케이션 제한사항"** 섹션에서:
   - **"HTTP 리퍼러(웹사이트)"** 선택
   - **"웹사이트 제한사항"** 섹션에서 다음 URL 추가:
     ```
     http://localhost:3000/*
     http://localhost:3000/ar-nav/*
     http://localhost:3000/ar-nav/select
     ```
   - 프로덕션 도메인도 추가 (예: `https://yourdomain.com/*`)

3. **"API 제한사항"** 섹션에서:
   - **"키 제한"** 선택
   - 다음 API 활성화 확인:
     - Maps JavaScript API
     - Places API
     - Directions API
     - Geocoding API

### 4. 저장 및 적용
1. **"저장"** 클릭
2. 변경사항 적용까지 1-2분 소요될 수 있음

### 5. 테스트
브라우저를 새로고침하고 다시 시도:
```
http://localhost:3000/ar-nav/select
```

## 참고사항

- 개발 환경에서는 `localhost`를 허용해야 합니다
- 프로덕션 배포 시 실제 도메인도 추가해야 합니다
- 와일드카드(`*`)를 사용하여 모든 경로를 허용할 수 있습니다

## 추가 문제 해결

### Google Maps API가 여러 번 로드되는 경우
- 이미 수정 완료: `GoogleMap.tsx` 컴포넌트에서 전역 스크립트 로드 상태 관리 추가

### API 키가 작동하지 않는 경우
1. API 키가 올바른지 확인
2. 필요한 API가 활성화되어 있는지 확인
3. 결제 계정이 연결되어 있는지 확인 (일부 API는 결제 필요)

