📌 SCQ AR Navigation – Technical Planning Document

최초 검증(MVP) 중심 설계 문서

🟦 1. 프로젝트 목적
🎯 목표 정의

본 프로젝트는 SCQ 기반 AR Navigation 기술 검증을 위해,
도보 환경에서 카메라 화면 위에 방향성 화살표를 안정적으로 표시하는 AR 인터페이스를 MVP로 구현하는 데 목적이 있다.

즉,

지도 없음

길찾기 없음

GPS 경로 계산 없음

차량 연동 없음

기술 검증 핵심은:

카메라 프레임 위에 오브젝트를 흔들림 없이 유지하고, 방향/거리 기반 HUD를 표시하는 것.

🟦 2. MVP 스코프
포함 (Must)

카메라 프리뷰 표시

목적지 좌표를 기준으로 방향성 화살표 표시

현재 위치 추적 (Geolocation)

거리 계산 및 시각화

AR HUD 오버레이

사용자 화면 인터랙션

제외 (Later)

턴바이턴 네비게이션

지도/Polyline

자동차 네비게이션

음성 안내

도로 인식 / 차선 인식

지도 검색 API 연동

SCQ 통합

🟦 3. 기술 스택
Web MVP 기준

Next.js + React + TypeScript

TailwindCSS

Browser Geolocation

DeviceOrientation API

CSS transform 기반 AR 오버레이

MediaDevices.getUserMedia()

선택 확장 방향

WebXR

ARCore Android Native

Unity AR Foundation

🟦 4. 설치 라이브러리 목록
npm install next react react-dom
npm install -D typescript @types/react @types/node
npm install -D tailwindcss postcss autoprefixer
npm install geolib


선택:

npm install three @types/three

🟦 5. 파일 구조
/app
  /ar-nav
    page.tsx              → 네비 시작 홈 (N1)
    /select
      page.tsx            → 목적지 선택 화면 (N2)
    /run
      page.tsx            → 네비 실행 화면 (N3)
    /arrived
      page.tsx            → 도착 화면 (N4)

🟦 6. UI 화면 정의
🟩 N1 – AR 네비 시작 화면

요소

"도보 AR 네비 시작" 버튼

액션

N2로 이동

🟩 N2 – 목적지 선택 화면

요소

목적지 1개 or 여러 개 목록화

핵심

목적지는 하드코딩 좌표로 설정

예시:

targetLatLng = { lat: 37.511, lng: 127.029 }

🟩 N3 – AR 네비 실행 화면 (핵심 MVP)

구조

전체 카메라 프리뷰

상단 텍스트: 현재 거리 표시

중앙: 방향 화살표

하단: 진행 상태

기능

위치 watchPosition

heading 감지 또는 수동 시뮬레이션

거리 계산:

geolib.getDistance

각도 계산:

geolib.getRhumbLineBearing

relativeAngle → 화살표 rotate

종료 조건

distance < 5m → N4

🟩 N4 – 도착 화면

구조

도착 완료 메시지

👍 / 👎 피드백

네비 재시작

🟦 7. 기술 흐름도 (Step by Step)
사용자 → N1 → 버튼 → N2
N2 → 목적지 선택 → 좌표 저장 → N3 실행

N3에서:
카메라 ON
↓
GPS watchPosition
↓
위도/경도 업데이트
↓
bearing 계산
↓
relativeAngle 계산
↓
UI 오버레이 업데이트
↓
거리 < 5m → N4 이동

🟦 8. 핵심 수학/계산 로직
bearing 계산
import { getRhumbLineBearing } from "geolib"
bearing = getRhumbLineBearing(current, target)

relative angle
relativeAngle = bearing - deviceHeading

distance 계산
distance = getDistance(current, target)

🟦 9. 실제 UX 흐름

1️⃣ 사용자가 [네비 시작]
2️⃣ 목적지 선택
3️⃣ 카메라 실행 + 허가
4️⃣ 화면 중앙 화살표가 목표 방향 가리킴
5️⃣ 걸을수록 거리 숫자가 감소
6️⃣ 5m 진입 → 자동 종료

🟦 10. 테스트 시나리오
Case 1 – 정지 테스트

화살표가 heading에 맞춰 자연 회전?

Case 2 – 걷기 테스트

거리 감소 정확도 확인

Case 3 – 성능 검증

FPS 감소 현상 확인

Case 4 – 기기별 편차

iPhone vs Samsung

🟦 11. SCQ 향후 통합 포인트

이 MVP는 SCQ가 들어올 구조적 공간까지 고려되어 있다.

적용 예정 위치
카메라 → 프레임 처리 → 방향/자세 추정 모델 → SCQ 최적화

SCQ 미션

baseline vs SCQ latency 비교

CPU-only 모델 실험

모바일 inference

현재 MVP는 모델 없이도:

UI 오버레이

heading 계산

UX 구조

이 모든 것을 검증할 수 있다.

🟦 12. 확장 로드맵
Phase 1 – 현재

도보용 AR 화살표만

Phase 2

카메라 기반 방향 추정 모델 추가

Phase 3

Google Maps Directions 연동

Phase 4

자동차 모드

Phase 5

AR 글라스 확장

🟦 13. 핵심 성공 조건 요약
조건	목표
AR 정렬 안정성	화면 jitter <5cm
Latency	<120ms
FPS	30fps 유지
UX 효과	길찾기 스트레스 감소
🟦 14. MVP 성공 기준 (투자가 가능해지는 기준)

화살표 흔들림 억제 → 영상 증거

5명 사용자 실사용 결과

기술 재사용성 문서화

지도 없이도 “방향 안내” UX 감동 확인

🟦 15. 이 문서가 보장하는 것

이 설계는:

Cursor로 개발 가능

스타트업 PoC 기준 충족

기술 검증 중심

SCQ 통합 기반 확보

확장 방향성 완전 보장