# 🇰🇷 TMAP 중심 AR 네비게이션 구현 가이드

## 📋 개요

국내에서 TMAP API를 사용하여 완전히 통합된 AR 네비게이션 시스템을 구현합니다.

**구현 플로우**:
1. 국내 위치 감지 → TMAP API 사용
2. TMAP 지도 불러오기
3. TMAP API로 위치정보 확인
4. TMAP API로 길찾기 진행
5. 카메라를 보며 길찾기에 따른 AR 네비게이션 적용

---

## 🎯 구현 완료 사항

### 1. TMAP 지도 통합

**파일**: `frontend/components/TmapMap.tsx`

- ✅ TMAP JavaScript API 동적 로딩
- ✅ 지도 표시 및 마커 관리
- ✅ 지도 클릭 이벤트 처리
- ✅ 현재 위치, 출발지, 도착지 마커 표시

### 2. TMAP 경로 계산

**파일**: `frontend/services/ARNavigationManager.ts`

- ✅ `getTmapWalkingRoute()`: TMAP 도보 경로 API 호출
- ✅ 개선된 `parseTmapData()`: 단계별 상세 정보 파싱
- ✅ turnType 기반 안내 문구 생성
- ✅ 거리 정보 포함 안내 문구

**주요 개선사항**:
- Point 타입 feature에서 단계별 정보 추출
- turnType에 따른 구체적인 안내 문구 생성
- 거리 정보를 안내 문구에 포함

### 3. AR 네비게이션 통합

**파일**: `frontend/hooks/useNavComputation.ts`

- ✅ TMAP 경로를 Google Maps 형식으로 변환
- ✅ 경로 좌표 기반 방향(bearing) 계산
- ✅ 단계별 거리 및 방향 정보 생성
- ✅ AR 화살표 표시에 필요한 데이터 제공

**주요 개선사항**:
- 경로 좌표를 사용하여 각 단계의 방향 계산
- `getRhumbLineBearing()`을 사용한 정확한 방향 계산
- 방향에 따른 안내 문구 자동 생성

### 4. TMAP 경로 파서 (신규)

**파일**: `frontend/services/TmapRouteParser.ts`

- ✅ TMAP API 응답을 AR 네비게이션 형식으로 변환
- ✅ 단계별 상세 정보 추출
- ✅ 방향(bearing) 계산
- ✅ Polyline 인코딩

---

## 🔄 전체 플로우

### 단계 1: 위치 감지 및 TMAP API 선택

```typescript
// ARNavigationManager.ts
const isKorea = this.checkIsKorea(origin.lat, origin.lng);

if (isKorea && this.tmapApiKey) {
  // TMAP API 사용
  result = await this.getTmapWalkingRoute(origin, destination);
}
```

### 단계 2: TMAP 지도 표시

```typescript
// ar-nav/select/page.tsx
{isKorea && !tmapError ? (
  <TmapMap
    center={mapCenter}
    markers={[
      { position: currentLocation, type: 'current' },
      { position: startLocation, type: 'start' },
      { position: destinationLocation, type: 'end' },
    ]}
    onMapClick={handleMapClick}
  />
) : (
  <GoogleMap ... />
)}
```

### 단계 3: TMAP 경로 계산

```typescript
// ARNavigationManager.ts
async getTmapWalkingRoute(origin: Location, destination: Location) {
  const response = await fetch(
    'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json',
    {
      method: 'POST',
      headers: {
        'appKey': this.tmapApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startX: origin.lng.toString(),
        startY: origin.lat.toString(),
        endX: destination.lng.toString(),
        endY: destination.lat.toString(),
        searchOption: "0", // 추천경로
        resCoordType: "WGS84GEO"
      })
    }
  );
  
  const data = await response.json();
  return this.parseTmapData(data);
}
```

### 단계 4: 경로 데이터 파싱

```typescript
// ARNavigationManager.ts - parseTmapData()
private parseTmapData(data: TmapResponse): NavigationRoute {
  const path: Location[] = [];
  const instructions: string[] = [];
  
  data.features.forEach((feature) => {
    // LineString: 경로 좌표 추출
    if (feature.geometry.type === "LineString") {
      feature.geometry.coordinates.forEach(coord => {
        path.push({ lat: coord[1], lng: coord[0] });
      });
    }
    
    // Point: 단계별 안내 정보 추출
    if (feature.geometry.type === "Point") {
      let instruction = feature.properties.description || '';
      
      // turnType에 따른 안내 문구 생성
      if (feature.properties.turnType) {
        const turnTypeMap = {
          '11': '직진',
          '12': '우회전',
          '13': '좌회전',
          // ...
        };
        instruction = turnTypeMap[feature.properties.turnType] + '하세요';
      }
      
      // 거리 정보 추가
      if (feature.properties.distance) {
        instruction += ` (${Math.round(feature.properties.distance)}m)`;
      }
      
      instructions.push(instruction);
    }
  });
  
  return { path, distance, duration, instructions };
}
```

### 단계 5: AR 네비게이션 변환

```typescript
// useNavComputation.ts
if (selectedService === 'TMAP') {
  const tmapRoute = await arNavigationManager.getDirections(...);
  
  // 경로 좌표를 기반으로 단계 생성
  for (let i = 0; i < tmapRoute.path.length - 1; i++) {
    const startLoc = tmapRoute.path[i];
    const endLoc = tmapRoute.path[i + 1];
    
    // 방향(bearing) 계산
    const stepBearing = getRhumbLineBearing(
      { latitude: startLoc.lat, longitude: startLoc.lng },
      { latitude: endLoc.lat, longitude: endLoc.lng }
    );
    
    steps.push({
      distance: stepDistance,
      bearing: stepBearing,
      instruction: tmapRoute.instructions[i],
      startLocation: startLoc,
      endLocation: endLoc,
    });
  }
}
```

### 단계 6: AR 화살표 표시

```typescript
// ar-nav/run/page.tsx
const { distance, bearing, relativeAngle, statusText } = useNavComputation(
  currentLocation,
  targetLocation,
  heading
);

// 카메라 위에 AR 화살표 오버레이
<ArrowIndicator 
  angle={relativeAngle} 
  distance={distance}
/>
```

---

## 🎨 사용자 경험 플로우

### 1. 목적지 선택 페이지

1. **위치 감지**: GPS로 현재 위치 확인
2. **지도 표시**: TMAP 지도 로드 (한국 위치인 경우)
3. **목적지 선택**: 
   - 검색으로 선택
   - 지도 클릭으로 선택
4. **경로 미리보기**: 선택 시 지도에 경로 표시 (향후 구현)

### 2. AR 네비게이션 시작

1. **"AR 네비게이션 시작" 버튼 클릭**
2. **경로 계산**: TMAP API로 도보 경로 요청
3. **카메라 활성화**: 후면 카메라 시작
4. **GPS 추적 시작**: 실시간 위치 업데이트

### 3. AR 네비게이션 실행

1. **실시간 위치 추적**: GPS 위치 1초마다 업데이트
2. **방향 추적**: 나침반으로 현재 방향 추적
3. **경로 계산**: 현재 위치에서 목적지까지 거리/방향 계산
4. **AR 화살표 표시**: 카메라 위에 방향 화살표 오버레이
5. **안내 문구 표시**: "직진하세요", "우회전하세요" 등

### 4. 도착 감지

1. **반경 감지**: 목적지 반경 5m 이내 진입 감지
2. **지속 시간 확인**: 2초 동안 반경 내 유지 확인
3. **도착 처리**: 진동 피드백 및 도착 페이지로 이동

---

## 🔧 기술적 세부사항

### TMAP API 응답 구조

```typescript
interface TmapResponse {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "LineString" | "Point";
      coordinates: number[][]; // [경도, 위도]
    };
    properties: {
      totalDistance?: number; // 전체 거리 (미터)
      totalTime?: number; // 전체 시간 (초)
      description?: string; // 안내 문구
      turnType?: string; // 회전 타입 (11: 직진, 12: 우회전, 13: 좌회전)
      pointType?: string; // 포인트 타입
      distance?: number; // 단계별 거리
      time?: number; // 단계별 시간
    };
  }>;
}
```

### 경로 변환 로직

1. **LineString 추출**: 전체 경로 좌표 배열 생성
2. **Point 추출**: 단계별 안내 포인트 추출
3. **방향 계산**: 각 단계의 시작점과 끝점으로 bearing 계산
4. **안내 문구 생성**: turnType과 거리 정보를 포함한 안내 문구 생성

### AR 네비게이션 계산

1. **현재 위치**: GPS로 실시간 추적
2. **목적지 위치**: 사용자가 선택한 위치
3. **경로 단계**: TMAP API에서 받은 경로 단계
4. **현재 단계**: 현재 위치에 가장 가까운 경로 단계 찾기
5. **상대 각도**: 목적지 방향 - 현재 방향 = 화살표 각도

---

## ✅ 체크리스트

### 환경 설정

- [ ] TMAP API 키 발급: [TMAP API 포털](https://tmapapi.sktelecom.com/)
- [ ] 환경 변수 설정: `NEXT_PUBLIC_TMAP_API_KEY`
- [ ] 로컬 테스트: `.env.local` 파일에 API 키 설정

### 기능 테스트

- [ ] 한국 위치에서 TMAP 지도 표시 확인
- [ ] 목적지 선택 시 TMAP 경로 계산 확인
- [ ] AR 네비게이션 시작 시 카메라 활성화 확인
- [ ] 실시간 위치 추적 확인
- [ ] AR 화살표 방향 정확도 확인
- [ ] 도착 감지 기능 확인

### 에러 처리

- [ ] TMAP API 키 없을 때 폴백 처리
- [ ] TMAP API 호출 실패 시 폴백 처리
- [ ] GPS 신호 없을 때 처리
- [ ] 카메라 권한 거부 시 처리

---

## 🚀 향후 개선 사항

### 1. 경로 미리보기

- TMAP 지도에 계산된 경로를 폴리라인으로 표시
- 경로 정보 (거리, 예상 시간) 표시

### 2. 음성 안내

- Text-to-Speech API를 사용한 음성 안내
- "100미터 앞에서 우회전하세요" 등

### 3. 실시간 경로 재계산

- 사용자가 경로를 벗어났을 때 자동 재계산
- 대안 경로 제시

### 4. POI 표시

- 경로 주변 관심 장소(POI) 표시
- 카메라 위에 POI 정보 오버레이

---

## 📝 요약

✅ **구현 완료**:
- TMAP 지도 통합
- TMAP 경로 계산
- AR 네비게이션 통합
- 실시간 위치 추적
- AR 화살표 표시

🎯 **핵심 기능**:
1. 국내 위치 감지 → TMAP API 자동 선택
2. TMAP 지도로 목적지 선택
3. TMAP API로 정확한 도보 경로 계산
4. 카메라 위에 AR 네비게이션 오버레이
5. 실시간 위치 및 방향 추적

이제 국내에서 완전히 TMAP 중심의 AR 네비게이션이 가능합니다! 🎉

