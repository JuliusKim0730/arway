# 구글 맵 네비게이션 API 연동 가이드

**작성일**: 2024년 12월 19일  
**목적**: 구글 맵 API 연동 가능성 및 비용 분석

---

## ✅ 연동 가능 여부

**답**: 네, 연동 가능합니다!

구글 맵 API는 다양한 네비게이션 기능을 제공하며, 현재 프로젝트에 통합할 수 있습니다.

---

## 💰 비용 정보

### 무료 티어 (Free Tier)

구글 맵 플랫폼은 **월 $200 크레딧**을 무료로 제공합니다.

**주요 API별 무료 사용량** (월 $200 크레딧 기준):

1. **Directions API** (경로 안내)
   - 무료: 월 40,000회 요청
   - 초과 시: $5.00 / 1,000회

2. **Maps JavaScript API** (지도 표시)
   - 무료: 월 28,000회 로드
   - 초과 시: $7.00 / 1,000회

3. **Places API** (장소 검색)
   - 무료: 월 17,000회 요청
   - 초과 시: $17.00 / 1,000회

4. **Geocoding API** (주소 변환)
   - 무료: 월 40,000회 요청
   - 초과 시: $5.00 / 1,000회

### 예상 비용 계산

**현재 프로젝트 사용 시나리오**:
- 사용자당 세션당 1회 경로 계산
- 월 1,000명 사용자, 평균 2회 사용
- 총 2,000회 요청

**비용**: **무료** (월 40,000회 한도 내)

---

## 🎯 연동 가능한 기능

### 1. Directions API (경로 안내)
**현재**: 직선 거리 계산 (geolib)
**연동 후**: 실제 도로 경로 계산

**장점**:
- 실제 도로를 따라가는 경로 제공
- 도보 전용 경로 계산 가능
- 경로 상세 정보 (거리, 예상 시간, 단계별 안내)

**API 엔드포인트**:
```
GET https://maps.googleapis.com/maps/api/directions/json
?origin=37.511,127.029
&destination=37.5561,126.9723
&mode=walking
&key=YOUR_API_KEY
```

### 2. Places API (장소 검색)
**현재**: 하드코딩된 목적지 목록
**연동 후**: 실시간 장소 검색

**장점**:
- 사용자가 원하는 장소 검색
- 자동완성 기능
- 장소 상세 정보 (주소, 평점, 영업시간 등)

### 3. Geocoding API (주소 변환)
**현재**: 좌표만 사용
**연동 후**: 주소 ↔ 좌표 변환

**장점**:
- 주소 입력으로 목적지 설정
- 좌표를 주소로 변환하여 표시

---

## 🔧 구현 방법

### 옵션 1: 프론트엔드 직접 연동 (권장)

**장점**:
- 백엔드 부하 감소
- 빠른 응답 속도
- API 키를 프론트엔드에서 관리

**단점**:
- API 키가 노출될 수 있음 (도메인 제한으로 보완 가능)

**구현 예시**:
```typescript
// frontend/lib/googleMaps.ts
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function getDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: 'walking' | 'driving' | 'transit' = 'walking'
) {
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status === 'OK') {
    return {
      distance: data.routes[0].legs[0].distance.value, // 미터
      duration: data.routes[0].legs[0].duration.value, // 초
      steps: data.routes[0].legs[0].steps, // 단계별 안내
      polyline: data.routes[0].overview_polyline.points, // 경로 좌표
    };
  }
  
  throw new Error(data.error_message || '경로를 찾을 수 없습니다.');
}
```

### 옵션 2: 백엔드 프록시 연동

**장점**:
- API 키 보안 강화
- 요청 제한 및 캐싱 가능
- 통계 수집 용이

**단점**:
- 백엔드 부하 증가
- 추가 구현 필요

**구현 예시**:
```python
# backend/app/api/v1/directions.py
import httpx
from fastapi import APIRouter, Query
from app.config import settings

router = APIRouter()

@router.get("/directions")
async def get_directions(
    origin_lat: float = Query(...),
    origin_lng: float = Query(...),
    dest_lat: float = Query(...),
    dest_lng: float = Query(...),
    mode: str = Query("walking")
):
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin": f"{origin_lat},{origin_lng}",
        "destination": f"{dest_lat},{dest_lng}",
        "mode": mode,
        "key": settings.GOOGLE_MAPS_API_KEY
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        return response.json()
```

---

## 📋 연동 단계별 가이드

### 1단계: API 키 발급

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "APIs & Services" > "Library"에서 다음 API 활성화:
   - Directions API
   - Maps JavaScript API (선택)
   - Places API (선택)
   - Geocoding API (선택)
4. "Credentials" > "Create Credentials" > "API Key" 생성
5. API 키 제한 설정 (HTTP referrer 제한 권장)

### 2단계: 환경 변수 설정

**프론트엔드** (`.env.local`):
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**백엔드** (`.env`):
```
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 3단계: 코드 구현

현재 `useNavComputation` 훅을 확장하여 구글 맵 API를 사용하도록 수정

---

## 🔄 현재 시스템과의 통합

### 현재 시스템
- **거리 계산**: geolib의 `getDistance()` - 직선 거리
- **방위각 계산**: geolib의 `getRhumbLineBearing()` - 직선 방향
- **경로**: 없음 (직선 경로만)

### 구글 맵 API 통합 후
- **거리 계산**: Directions API - 실제 도로 거리
- **방위각 계산**: 경로의 첫 번째 단계 방향
- **경로**: 실제 도로를 따라가는 경로
- **추가 기능**: 단계별 안내, 예상 시간, 경로 시각화

---

## 💡 추천 통합 방안

### 하이브리드 방식 (권장)

**단거리**: 기존 geolib 사용 (무료, 빠름)
**장거리**: 구글 맵 API 사용 (정확한 경로)

```typescript
export async function getRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
) {
  // 직선 거리 계산
  const straightDistance = getDistance(origin, destination);
  
  // 500m 이하는 직선 경로 사용 (빠르고 무료)
  if (straightDistance < 500) {
    return {
      distance: straightDistance,
      bearing: getRhumbLineBearing(origin, destination),
      useGoogleMaps: false,
    };
  }
  
  // 500m 이상은 구글 맵 API 사용 (정확한 경로)
  return {
    ...await getDirections(origin, destination, 'walking'),
    useGoogleMaps: true,
  };
}
```

---

## ⚠️ 주의사항

### 1. API 키 보안
- 프론트엔드에서 사용 시 HTTP referrer 제한 필수
- 백엔드 프록시 방식 권장 (프로덕션)

### 2. 사용량 모니터링
- Google Cloud Console에서 사용량 모니터링 설정
- 일일/월별 제한 설정 권장
- 알림 설정으로 예상치 못한 비용 방지

### 3. 캐싱 전략
- 동일한 경로는 캐싱하여 API 호출 최소화
- Redis 또는 메모리 캐시 사용 권장

### 4. 대체 방안
- 무료 대안: OpenStreetMap (OSRM), Mapbox (제한적 무료)
- 오프라인: 자체 경로 계산 알고리즘

---

## 🚀 구현 우선순위

### Phase 1: 기본 연동 (1-2일)
1. API 키 발급 및 설정
2. Directions API 기본 연동
3. 거리 계산 개선 (직선 → 도로)

### Phase 2: 기능 확장 (3-5일)
1. Places API 연동 (장소 검색)
2. 경로 시각화 (지도 표시)
3. 단계별 안내 추가

### Phase 3: 최적화 (1주)
1. 캐싱 구현
2. 하이브리드 방식 적용
3. 에러 처리 및 폴백

---

## 📊 비용 예상

### 시나리오별 비용

**소규모 사용** (월 1,000회):
- Directions API: 무료 (40,000회 한도 내)
- **총 비용**: $0

**중규모 사용** (월 10,000회):
- Directions API: 무료 (40,000회 한도 내)
- **총 비용**: $0

**대규모 사용** (월 50,000회):
- Directions API: 10,000회 초과 × $5.00 / 1,000회 = $50
- **총 비용**: $50/월

---

## ✅ 결론

### 연동 가능 여부
✅ **가능합니다**

### 무료 여부
✅ **월 $200 크레딧 무료 제공** (대부분의 경우 무료로 사용 가능)

### 추천 사항
1. **하이브리드 방식**: 단거리는 geolib, 장거리는 구글 맵 API
2. **백엔드 프록시**: API 키 보안 강화
3. **캐싱 구현**: API 호출 최소화
4. **사용량 모니터링**: 예상치 못한 비용 방지

---

## 🔗 참고 자료

- [Google Maps Platform 가격](https://mapsplatform.google.com/pricing/)
- [Directions API 문서](https://developers.google.com/maps/documentation/directions)
- [Places API 문서](https://developers.google.com/maps/documentation/places)
- [API 키 보안 가이드](https://developers.google.com/maps/api-security-best-practices)

---

**마지막 업데이트**: 2024년 12월 19일

