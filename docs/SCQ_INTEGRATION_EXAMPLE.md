# SCQ Intelligence Layer 통합 예제

**작성일**: 2025-12-22

---

## AR 네비게이션 페이지에 통합하기

### 1. 기본 통합

```tsx
// frontend/app/ar-nav/run/page.tsx

import { SCQIntegration } from '@/components/SCQIntegration';
import { Geofence, POI } from '@/lib/scq';

export default function ArNavRunPage() {
  // ... 기존 코드 ...
  
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [poiDatabase, setPoiDatabase] = useState<POI[]>([]);
  const [isIndoor, setIsIndoor] = useState(false);
  const [arAction, setArAction] = useState<any>(null);
  const [recognizedPois, setRecognizedPois] = useState<POI[]>([]);
  
  // 지오펜스 로드 (예: 백엔드 API에서)
  useEffect(() => {
    // TODO: 백엔드에서 지오펜스 데이터 로드
    setGeofences([
      {
        id: 'building-1',
        name: '백화점 A',
        type: 'building',
        polygon: [
          { lat: 37.5665, lng: 126.9780 },
          { lat: 37.5666, lng: 126.9780 },
          { lat: 37.5666, lng: 126.9781 },
          { lat: 37.5665, lng: 126.9781 },
        ],
        entryPoints: [
          {
            id: 'entry-1',
            lat: 37.5665,
            lng: 126.9780,
            name: '정문',
          },
        ],
      },
    ]);
  }, []);
  
  // POI 데이터베이스 로드
  useEffect(() => {
    // TODO: 백엔드에서 POI 데이터 로드
    setPoiDatabase([
      {
        id: 'poi-1',
        name: '스타벅스',
        type: 'restaurant',
        position: { x: 5, y: 5, floor: 1 },
        priority: 0.7,
      },
    ]);
  }, []);
  
  return (
    <div>
      {/* SCQ 통합 컴포넌트 */}
      <SCQIntegration
        route={route}
        geofences={geofences}
        poiDatabase={poiDatabase}
        userGoal={{ targetPoiId: targetPoiId }}
        onIndoorModeChange={(indoor) => {
          setIsIndoor(indoor);
          console.log('Indoor mode changed:', indoor);
        }}
        onARActionChange={(action) => {
          setArAction(action);
          console.log('AR Action:', action);
        }}
        onPOIChange={(pois) => {
          setRecognizedPois(pois);
          console.log('Recognized POIs:', pois);
        }}
      />
      
      {/* 실내 모드 표시 */}
      {isIndoor && (
        <div className="fixed top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50">
          실내 모드 활성화
        </div>
      )}
      
      {/* AR 행동 지시 표시 */}
      {arAction && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-6 py-4 rounded-lg z-50">
          <div className="text-2xl font-bold mb-2">
            {arAction.action === 'GO_STRAIGHT' && '⬆️'}
            {arAction.action === 'TURN_LEFT' && '⬅️'}
            {arAction.action === 'TURN_RIGHT' && '➡️'}
            {arAction.action === 'TAKE_ESCALATOR' && '🔼'}
            {arAction.action === 'TAKE_ELEVATOR' && '🛗'}
          </div>
          <div className="text-lg">{arAction.description}</div>
          <div className="text-sm text-gray-300 mt-1">
            {Math.round(arAction.distanceToAction)}m
          </div>
        </div>
      )}
      
      {/* 인식된 POI 표시 */}
      {recognizedPois.length > 0 && (
        <div className="fixed top-20 right-4 bg-gray-800 text-white p-4 rounded-lg z-50 max-w-xs">
          <h3 className="font-bold mb-2">주변 장소</h3>
          {recognizedPois.map((poi) => (
            <div key={poi.id} className="mb-2 p-2 bg-gray-700 rounded">
              <div className="font-medium">{poi.name}</div>
              <div className="text-xs text-gray-400">{poi.type}</div>
            </div>
          ))}
        </div>
      )}
      
      {/* 기존 AR 네비게이션 UI */}
      {/* ... */}
    </div>
  );
}
```

### 2. 수동 제어 예제

```tsx
import { useSCQ } from '@/hooks/useSCQ';

function ManualSCQControl() {
  const { output, tick, isInitialized } = useSCQ({
    enabled: false, // 자동 실행 비활성화
  });
  
  const handleManualTick = async () => {
    if (!isInitialized) return;
    
    await tick({
      gps: {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        accuracy: 10,
        timestamp: Date.now(),
      },
      geofences: geofences,
      route: route,
    });
  };
  
  return (
    <button onClick={handleManualTick}>
      SCQ 실행
    </button>
  );
}
```

### 3. 백엔드 API 사용 예제

```typescript
// 백엔드 API를 통한 SCQ Unit 실행
async function callSCQUnit1(gps: GPSLocation, geofences: Geofence[]) {
  const response = await fetch('http://localhost:8000/api/v1/scq/unit1/indoor-outdoor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gps: {
        lat: gps.lat,
        lng: gps.lng,
        accuracy: gps.accuracy,
      },
      geofences: geofences.map(g => ({
        id: g.id,
        type: g.type,
        polygon: g.polygon,
        entry_points: g.entryPoints,
      })),
    }),
  });
  
  return await response.json();
}
```

---

## 데이터 준비

### 지오펜스 데이터 생성

```typescript
// 백엔드에서 지오펜스 데이터 제공 API 필요
// 예: GET /api/v1/geofences/?lat=37.5665&lng=126.9780
```

### 실내 맵 데이터 생성

```typescript
// 백엔드에서 실내 맵 데이터 제공 API 필요
// 예: GET /api/v1/indoor-maps/?building_id=building-1
```

### POI 데이터베이스 구축

```typescript
// 백엔드 destinations 테이블을 POI로 확장하거나
// 별도 POI 테이블 생성 필요
```

---

## 성능 모니터링

```typescript
import { getSCQOrchestrator } from '@/lib/scq';

const orchestrator = getSCQOrchestrator();

// Unit별 성능 모니터링
orchestrator.startAutoTick(
  inputProvider,
  (output) => {
    console.log('Unit #1 confidence:', output.indoorOutdoor.confidence);
    console.log('Unit #2 confidence:', output.indoorPose?.confidence);
    console.log('Unit #3 confidence:', output.arGuidance.confidence);
    console.log('Unit #4 confidence:', output.poiRecognition?.confidence);
  },
  5
);
```

---

## 다음 단계

1. 지오펜스 데이터 API 구현
2. 실내 맵 데이터 API 구현
3. POI 데이터베이스 확장
4. AR 렌더링 통합 (Three.js)
5. VPS API 통합 (선택)

