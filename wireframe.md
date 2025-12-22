1️⃣ 화면별 상세 와이어프레임

전체 공통 컨셉:

모바일 기준(세로)

상단 헤더 / 본문 / 하단 CTA 구조

배경: 어두운 톤 + 내용 카드/버튼은 밝은 톤

N1. 시작 화면 /ar-nav
레이아웃 개요
┌─────────────────────────────┐
│          헤더(상단)         │
│  [ ARWay Lite ]             │
│  [ 부제: AR 도보 네비 MVP ] │
├─────────────────────────────┤
│         설명 섹션           │
│  "도보 전용 AR 네비게이션   │
│   실험용 서비스입니다."     │
│                             │
├─────────────────────────────┤
│        메인 CTA 영역        │
│   [ 도보 AR 네비 시작 ]     │
│                             │
├─────────────────────────────┤
│         하단 푸터           │
│  • 베타 버전 안내 텍스트    │
│  • 이용 권한/주의 문구      │
└─────────────────────────────┘

요소 상세

헤더

서비스 로고 or 텍스트: ARWay Lite

서브텍스트: SCQ 기반 AR 네비게이션 실험

설명 영역

1~2줄 소개:

“지도를 보지 않고도, 카메라 화면 위에서 방향을 안내받는 실험용 서비스입니다.”

작은 주의 문구:

“현재는 도보 테스트용으로만 사용해주세요.”

메인 CTA 버튼

라벨: 도보 AR 네비 시작

액션: /ar-nav/select로 라우팅

푸터

“카메라/위치 권한을 허용해야 사용할 수 있습니다.”

N2. 목적지 선택 화면 /ar-nav/select
레이아웃 개요
┌─────────────────────────────┐
│           헤더              │
│  [ ← ]  목적지 선택         │
├─────────────────────────────┤
│     목적지 카드 리스트      │
│  ┌───────────────────────┐  │
│  │ 테스트 목적지 1        │  │
│  │ - 회사 앞 카페         │  │
│  │ [ 이 위치로 안내 ]     │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ 테스트 목적지 2        │  │
│  │ - 역 출구              │  │
│  │ [ 이 위치로 안내 ]     │  │
│  └───────────────────────┘  │
├─────────────────────────────┤
│        하단 안내문구        │
│  "MVP 버전에서는 1~2개     │
│   고정된 목적지만 지원"    │
└─────────────────────────────┘

요소 상세

헤더

좌측: 뒤로 가기 < → /ar-nav

중앙: 목적지 선택

목적지 카드(반복)

제목: 테스트 목적지 1

설명: 현재 위치 근처의 테스트용 목적지

내부 데이터:

lat, lng (코드에 하드코딩)

버튼: 이 위치로 안내

클릭 시:

targetLatLng를 상태나 스토리지에 저장

/ar-nav/run으로 이동

하단 안내

“실제 버전에서는 지도 검색, 즐겨찾기 등으로 확장됩니다.”

N3. AR 네비 실행 화면 /ar-nav/run (핵심)
레이아웃 개요
┌─────────────────────────────┐
│   상단 HUD (거리/상태)      │
│  남은 거리: 120m            │
│  상태: 방향 거의 맞음      │
├─────────────────────────────┤
│      카메라/AR 영역         │
│  ┌───────────────────────┐  │
│  │     [카메라 프리뷰]    │  │
│  │                       │  │
│  │          ▲            │  │
│  │       (화살표)        │  │
│  │                       │  │
│  └───────────────────────┘  │
├─────────────────────────────┤
│        하단 컨트롤          │
│  [ 뒤로 ]    [ 도착 테스트 ]│
└─────────────────────────────┘

요소 상세

상단 HUD 영역

남은 거리: XXm

geolib 거리값 연동

상태 텍스트

예:

방향 맞는 중 (relativeAngle 기준 임계값 내)

방향 많이 틀렸음

도착 근처

카메라 영역

실제 구현 전까지:

어두운 배경 div에 "카메라 프리뷰 영역" 텍스트

중앙 화살표:

SVG or 텍스트 "▲"

CSS transform: rotate(relativeAngle)로 회전 예정

하단 버튼

뒤로 → /ar-nav/select

도착 테스트 (임시)

클릭 시 /ar-nav/arrived

실제 구현 시: distance < 5m일 때 자동 이동으로 대체

N4. 도착 화면 /ar-nav/arrived
레이아웃 개요
┌─────────────────────────────┐
│           헤더              │
│       안내 완료             │
├─────────────────────────────┤
│       성공 메시지           │
│   🎉 도착했습니다!          │
│   AR 네비가 목적지까지      │
│   안내를 완료했어요.        │
├─────────────────────────────┤
│       만족도 피드백         │
│   이 안내는 도움이 되었나요?│
│   [ 😃 ]   [ 😐 ]           │
├─────────────────────────────┤
│         하단 버튼           │
│ [ 다시 안내 받기 ] [ 처음으로 ]│
└─────────────────────────────┘

요소 상세

피드백 버튼

😃 / 😐 → 클릭 시 간단한 로그 남길 수 있는 구조(나중에 analytics 연동)

하단 버튼

다시 안내 받기 → /ar-nav/select

처음으로 → /ar-nav

2️⃣ 기술 아키텍처 다이어그램

실제 그림은 못 그리지만, 레이어/모듈/흐름 기준으로 구조를 텍스트로 정리해볼게.
피그마나 미로에서 이대로 박스/화살표로 옮기면 된다.

2-1. 전체 레이어 구조
[ Presentation Layer (Next.js / React)]
        │
        ▼
[ Navigation Logic Layer (Nav State, Hooks)]
        │
        ▼
[ Sensor Abstraction Layer (Geolocation, Orientation)]
        │
        ▼
[ Calculation Layer (Distance, Bearing, Relative Angle)]
        │
        ▼
[ Rendering Layer (HUD UI, Arrow Rotation)]
        │
        ▼
[ (미래) SCQ Model Layer (Direction Estimation, Pose) ]

2-2. 컴포넌트 & 모듈 구조
1) 프론트 페이지 컴포넌트

ArNavStartPage (/ar-nav)

ArNavSelectPage (/ar-nav/select)

ArNavRunPage (/ar-nav/run)

ArNavArrivedPage (/ar-nav/arrived)

2) 상태/로직 훅(Hooks)

useNavTarget()

현재 선택된 목적지 타겟(lat, lng, id)

set/get, 로컬스토리지 or 전역 상태 관리

useGeolocationWatcher()

watchPosition 핸들링

currentLatLng, accuracy, error 반환

useHeading()

DeviceOrientation 이벤트 구독

헤딩(deg, 0~360) 반환

지원 안 될 경우 fallback 전략 포함

useNavComputation(target, current, heading)

거리/방위/relativeAngle 계산

상태: distance, bearing, relativeAngle, statusText

이렇게 나누면, UI와 계산 로직이 분리되어 나중에 SCQ/모델을 아래에 붙이기 좋음.

3) Browser API 레이어

Geolocation API

navigator.geolocation.watchPosition

DeviceOrientation API

window.addEventListener('deviceorientation', ...)

MediaDevices

navigator.mediaDevices.getUserMedia
(현재는 사용 예정 위치만 확보, MVP UI에서는 placeholder)

4) 계산/유틸 레이어

geoUtils.ts

getDistance(current, target)

getBearing(current, target)

normalizeAngle(angle)

navStatus.ts

getNavStatus(distance, relativeAngle)

예:

|angle| < 15° → "방향 거의 맞음"

|angle| > 60° → "큰 방향 오차"

5) (향후) SCQ 모델 레이어

scqModel.ts (나중에 도입)

export async function initScqDirectionModel() {
  // SCQ 기반 방향 추정 모델 로드
}

export function predictDirectionFromFrame(frame): number {
  // frame → 방향(heading or steering angle) 추정
}


현재 MVP에서는 이 레이어 비워둠,
대신 인터페이스만 정의해두면 나중에 모델 붙이기 좋음.

2-3. 시퀀스 다이어그램(텍스트 버전)
유저가 네비 실행할 때
User
 │
 │  (1) /ar-nav 접속
 ▼
ArNavStartPage
 │ 클릭 "도보 AR 네비 시작"
 ▼
Router → /ar-nav/select
 ▼
ArNavSelectPage
 │ 카드 선택 "테스트 목적지 1"
 │ └─ useNavTarget().setTarget(target)
 ▼
Router → /ar-nav/run
 ▼
ArNavRunPage
 │ ├─ useNavTarget().getTarget()
 │ ├─ useGeolocationWatcher() 시작
 │ ├─ useHeading() 시작
 │ └─ 내부 useEffect 루프:
 │      (current, heading, target) → useNavComputation()
 │                          │
 │                          └─ geoUtils.getDistance, getBearing
 │                               ↓
 │                      relativeAngle / statusText 업데이트
 │
 │ UI: 거리/화살표/HUD 렌더링
 │
 │ distance < 5m → Router → /ar-nav/arrived
 ▼
ArNavArrivedPage
 │
 └─ 피드백/다시 시작

2-4. 성능/테스트 관점 흐름

useGeolocationWatcher – 1초 간격 GPS 업데이트

useHeading – 센서 이벤트 수신 (수십 Hz 가능)

UI는 30~60fps 렌더링

useNavComputation – 값 변할 때마다 재계산

화살표 회전 – CSS transform만 변경 → 비용 매우 낮음

→ 이 구조면 나중에 SCQ 모델을 추가해도 “계산 레이어” 내부에만 변화가 생기고,
UI/페이지 구조는 그대로 유지된다.