📌 SCQ AR Navigation – 상세 PRD (Product Requirements Document)
1. Product Overview
Product Name

ARWay Lite (SCQ 기반 AR 도보 네비 MVP)

Version

0.1.0 – MVP

Product Purpose

현실 카메라 영상 위에 AR 방향 화살표와 거리 정보를 표시하여,
지도를 열지 않고도 직감적인 방향 안내를 제공한다.

핵심 가치

화면만 들고 있어도 방향을 알 수 있음

GPS 방향 오차 최소화

UI만으로 실사용성 검증 가능

SCQ 엔진 미래 통합이 가능한 구조

2. Target User
Primary Users

낯선 공간에서 길찾기를 자주 하는 사람

해외 여행객

길치 사용자

Secondary Users

시각적 가이드가 필요한 사용자

시니어 모바일 사용자

3. 문제 정의 (Problem Statement)

현재 길찾기 경험은 복잡하다.
유저는 다음 문제를 겪는다:

지도 UI 이해 스트레스

화살표 방향이 실제 방향과 다름

차량 위주의 지도 UX

본 제품은 AR 오버레이 기반 직관적 방향 제공을 통해 문제를 해결한다.

4. Goal & Non-goal
Goal

목적지를 향한 방향 표시 + 거리 감소의 동작 검증

지도 엔진 없이 자체 계산 방향 시스템 검증

AR 카메라 오버레이 시 안정성 검증

Non-goal (제외)

Google Maps 네비 UX 대체

실시간 경로 재계산

VO 기반 AR 정렬

자동차 운전 네비게이션

5. Feature Requirements
핵심 기능

1️⃣ 카메라 프리뷰 실행
2️⃣ GPS tracking
3️⃣ 목적지 bearing 계산
4️⃣ device heading 계산
5️⃣ overlay 화살표 rotate 처리
6️⃣ 남은 거리 표시

6. User Flow
앱 실행
→ 시작 화면
→ 목적지 선택
→ 카메라 실행 허가
→ 현재 위치 획득
→ 방향 및 거리 계산
→ AR 화면 표시
→ 5m 이하 → 도착 화면 출력

7. User Journey
단계	사용자 행동	시스템 동작
Launch	앱 실행	권한 요청
Select Target	목적지 클릭	좌표 저장
Activate AR	네비 시작 클릭	카메라 + GPS 시작
Walk	직진	화살표 회전
Arrive	목표 지점 접근	도착 화면 표시
8. Screen Requirements
Screen 1 — Start

CTA 버튼: 네비 시작

단순한 설명 텍스트

Screen 2 — Destination Select

목적지 목록

각 항목은 lat/lng 값을 내장

Screen 3 — AR Mode (핵심)

전면 카메라 프리뷰

중앙 화살표 오버레이

상단 거리 표시

heading 기반 회전

뒤로 가기 버튼

Screen 4 — Arrival

도착 안내 텍스트

다시하기 버튼

9. Functional Requirements
FR01 – GPS enable/disable

권한 없으면 앱 종료

FR02 – Heading stabilization

device orientation fallback 로직 포함

FR03 – 거리 계산

geolib 사용

FR04 – bearing 계산

geolib 사용

FR05 – 업데이트 주기

1초 인터벌

FR06 – 화면 FPS

30fps 유지

10. UI Requirements
화살표 단위

3D → 성능 이슈 있으므로 2D

색상

사용자 시인성 고려 (화이트)

폰트

세미볼드

11. Technical Requirements
OS

모바일 웹 (iOS/Android)

Sensor

GPS

Compass

Camera

프레임율 목표

30fps

12. Error Handling
상황	대응
GPS 불가	앱 종료 권고
orientation 부정확	fallback 안내
카메라 권한 거부	앱 종료
13. Analytics Requirements

평균 거리 정확도

heading 변동 폭

사용 완료율

14. KPI
KPI	기준
1인 평균 도보 성공률	>80%
화살표 흔들림 안정성	>90%
평균 사용 시간	>3분
15. Success Criteria

MVP가 성공했다고 볼 조건:

1️⃣ 유저가 방향성으로 길을 찾았다고 보고됨
2️⃣ 방향 오차가 ±15° 이하
3️⃣ 거리 오차 평균 <10%