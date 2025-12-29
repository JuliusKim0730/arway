# SCQ Intelligence Layer

SCQ (Soft Convex Quantization) Intelligence Layer는 실내/실외 전환 판단, 실내 위치 추정, AR 행동 지시, POI 인식 등의 기능을 제공하는 질의 기반 시스템입니다.

## 구조

```
lib/scq/
├── types.ts              # 타입 정의
├── unit1_indoor_outdoor.ts    # Unit #1: 실내/실외 전환
├── unit2_indoor_positioning.ts # Unit #2: 실내 위치 추정
├── unit3_ar_guidance.ts        # Unit #3: AR 행동 지시
├── unit4_poi_recognition.ts    # Unit #4: POI 인식
├── orchestrator.ts             # SCQ Orchestrator
└── index.ts                    # Export
```

## 사용 예제

### 기본 사용

```typescript
import { getSCQOrchestrator } from '@/lib/scq';

const orchestrator = getSCQOrchestrator();
await orchestrator.initialize();

const result = await orchestrator.tick({
  gps: {
    lat: 37.5665,
    lng: 126.9780,
    accuracy: 10,
    timestamp: Date.now(),
  },
  geofences: [],
  route: { steps: [] },
});
```

### React Hook 사용

```typescript
import { useSCQ } from '@/hooks/useSCQ';

function MyComponent() {
  const { output, tick } = useSCQ({
    enabled: true,
    maxHz: 5,
  });
  
  // output.indoorOutdoor, output.arGuidance 등 사용
}
```

## Unit별 설명

### Unit #1: 실내/실외 전환 판단
- 지오펜스 진입 확인
- GPS 정확도 기반 판단
- 이동 패턴 분석
- 히스테리시스 적용

### Unit #2: 실내 위치 추정
- VPS 결과 우선 사용
- 랜드마크 매칭
- IMU 기반 추정
- 다중 가설 추적

### Unit #3: AR 행동 지시
- 경로상 가장 가까운 점 찾기
- 다음 행동 결정
- AR 앵커 위치 계산
- 스무딩 적용

### Unit #4: POI 인식
- 거리 기반 필터링
- 카메라 기반 매칭
- 우선순위 계산
- Top-K 선택

