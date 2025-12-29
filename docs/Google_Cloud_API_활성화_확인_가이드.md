# 🔍 Google Cloud Console API 활성화 확인 가이드

## 📋 개요

Google Maps Platform을 사용하기 위해서는 다음 API들이 활성화되어 있어야 합니다:
- **Maps JavaScript API** (필수)
- **Places API** (목적지 검색 사용 시)
- **Directions API** (길찾기 필수)

---

## 🚀 API 활성화 확인 방법

### 방법 1: APIs & Services → Library (권장)

가장 직관적이고 빠른 방법입니다.

#### 단계별 가이드

1. **Google Cloud Console 접속**
   - [Google Cloud Console](https://console.cloud.google.com/) 접속
   - 프로젝트 선택 (상단 프로젝트 선택 드롭다운)

2. **APIs & Services 메뉴로 이동**
   - 왼쪽 메뉴에서 **"APIs & Services"** 클릭
   - 하위 메뉴에서 **"Library"** 클릭

3. **API 검색 및 확인**
   - 검색창에 다음 API 이름을 입력하여 검색:
   
   **a) Maps JavaScript API**
   ```
   Maps JavaScript API
   ```
   - 검색 결과에서 **"Maps JavaScript API"** 클릭
   - **상태 확인**:
     - ✅ **"API enabled"** (초록색) → 활성화됨
     - ⚠️ **"Enable"** (파란색 버튼) → 비활성화됨 → 클릭하여 활성화

   **b) Places API**
   ```
   Places API
   ```
   - 검색 결과에서 **"Places API"** 클릭
   - 상태 확인 및 필요시 활성화

   **c) Directions API**
   ```
   Directions API
   ```
   - 검색 결과에서 **"Directions API"** 클릭
   - 상태 확인 및 필요시 활성화

---

### 방법 2: APIs & Services → Enabled APIs

현재 활성화된 API 목록을 한눈에 확인하는 방법입니다.

#### 단계별 가이드

1. **Google Cloud Console 접속**
   - [Google Cloud Console](https://console.cloud.google.com/) 접속
   - 프로젝트 선택

2. **Enabled APIs 페이지로 이동**
   - 왼쪽 메뉴에서 **"APIs & Services"** 클릭
   - 하위 메뉴에서 **"Enabled APIs"** 클릭

3. **활성화된 API 목록 확인**
   - 페이지에 현재 활성화된 모든 API 목록이 표시됩니다
   - 검색창에 다음을 입력하여 확인:
     - `Maps JavaScript API`
     - `Places API`
     - `Directions API`

   **확인 방법**:
   - ✅ 목록에 표시됨 → 활성화됨
   - ❌ 목록에 없음 → 비활성화됨 → 활성화 필요

---

### 방법 3: Dashboard에서 확인

프로젝트 대시보드에서 API 사용량을 확인하는 방법입니다.

#### 단계별 가이드

1. **Google Cloud Console 접속**
   - [Google Cloud Console](https://console.cloud.google.com/) 접속
   - 프로젝트 선택

2. **Dashboard로 이동**
   - 왼쪽 메뉴에서 **"APIs & Services"** 클릭
   - 하위 메뉴에서 **"Dashboard"** 클릭

3. **API 사용량 확인**
   - 페이지 상단에 **"API & Services"** 섹션이 표시됩니다
   - 활성화된 API 목록이 표시되며, 사용량 그래프도 확인 가능합니다

---

## ✅ API 활성화 방법

API가 비활성화되어 있는 경우 활성화하는 방법:

### 단계별 가이드

1. **API Library 페이지로 이동**
   - **APIs & Services** → **Library**

2. **API 검색**
   - 검색창에 API 이름 입력 (예: `Maps JavaScript API`)

3. **API 선택**
   - 검색 결과에서 해당 API 클릭

4. **활성화**
   - API 상세 페이지에서 **"Enable"** 버튼 클릭
   - 활성화 완료까지 몇 초 소요될 수 있습니다

5. **확인**
   - 버튼이 **"API enabled"** (초록색)로 변경되면 완료

---

## 🔍 빠른 확인 체크리스트

다음 순서로 빠르게 확인하세요:

### 1단계: APIs & Services → Library 접속
- [ ] Google Cloud Console 접속
- [ ] 프로젝트 선택
- [ ] APIs & Services → Library 메뉴 클릭

### 2단계: Maps JavaScript API 확인
- [ ] 검색창에 `Maps JavaScript API` 입력
- [ ] 검색 결과에서 API 클릭
- [ ] 상태 확인:
  - [ ] ✅ "API enabled" → 활성화됨
  - [ ] ⚠️ "Enable" 버튼 → 비활성화됨 → 클릭하여 활성화

### 3단계: Places API 확인
- [ ] 검색창에 `Places API` 입력
- [ ] 검색 결과에서 API 클릭
- [ ] 상태 확인 및 필요시 활성화

### 4단계: Directions API 확인
- [ ] 검색창에 `Directions API` 입력
- [ ] 검색 결과에서 API 클릭
- [ ] 상태 확인 및 필요시 활성화

---

## 📝 API별 상세 정보

### Maps JavaScript API

**용도**: 지도 표시 및 기본 지도 기능

**필수 여부**: ✅ **필수** (지도 표시에 필요)

**활성화 확인**:
- APIs & Services → Library → `Maps JavaScript API` 검색
- 상태: "API enabled" 확인

---

### Places API

**용도**: 장소 검색 및 자동완성

**필수 여부**: ⚠️ **조건부** (목적지 검색 기능 사용 시 필요)

**활성화 확인**:
- APIs & Services → Library → `Places API` 검색
- 상태: "API enabled" 확인

**참고**: 
- 목적지 검색 기능(`PlaceSearch` 컴포넌트)을 사용하는 경우 필수
- 지도만 표시하는 경우 선택사항

---

### Directions API

**용도**: 경로 계산 및 길찾기

**필수 여부**: ✅ **필수** (AR 네비게이션 길찾기 기능에 필요)

**활성화 확인**:
- APIs & Services → Library → `Directions API` 검색
- 상태: "API enabled" 확인

**중요**: 
- AR 네비게이션의 핵심 기능이므로 반드시 활성화 필요
- 비활성화 시 길찾기 기능이 작동하지 않음

---

## 🚨 자주 발생하는 문제

### 문제 1: API가 활성화되어 있는데도 에러 발생

**원인**:
- Billing 계정이 연결되지 않음
- API Key의 HTTP Referrer 제한 문제

**해결**:
1. **Billing 확인**: APIs & Services → Billing → 결제 계정 연결 확인
2. **API Key 확인**: APIs & Services → Credentials → API Key → HTTP Referrer 제한 확인

---

### 문제 2: API 활성화 후에도 에러 발생

**원인**:
- API 활성화 후 몇 분 정도 소요될 수 있음
- 브라우저 캐시 문제

**해결**:
1. **대기**: API 활성화 후 5-10분 대기
2. **브라우저 새로고침**: Ctrl+F5 (강력 새로고침)
3. **재배포**: Vercel에서 재배포 실행

---

### 문제 3: API 활성화 버튼이 보이지 않음

**원인**:
- 프로젝트에 대한 권한 부족
- Billing 계정 미연결

**해결**:
1. **권한 확인**: IAM & Admin → IAM에서 자신의 역할 확인
2. **Billing 연결**: Billing 메뉴에서 결제 계정 연결

---

## 🔗 관련 링크

- [Google Cloud Console](https://console.cloud.google.com/)
- [Maps JavaScript API 문서](https://developers.google.com/maps/documentation/javascript)
- [Places API 문서](https://developers.google.com/maps/documentation/places/web-service)
- [Directions API 문서](https://developers.google.com/maps/documentation/directions)

---

## 💡 팁

### 빠른 확인 방법

**터미널에서 확인** (고급 사용자용):

```bash
# gcloud CLI 설치 필요
gcloud services list --enabled --filter="name:Maps OR name:Places OR name:Directions"
```

### API 활성화 상태 한눈에 보기

**Enabled APIs 페이지**에서 다음 필터 사용:
- 검색: `Maps` 또는 `Places` 또는 `Directions`
- 모든 관련 API가 한 번에 표시됨

---

## 요약

1. **가장 빠른 방법**: APIs & Services → Library → API 이름 검색 → 상태 확인
2. **한눈에 보기**: APIs & Services → Enabled APIs → 검색으로 확인
3. **활성화 필요 시**: API 상세 페이지에서 "Enable" 버튼 클릭
4. **확인 후**: 5-10분 대기 후 재배포 및 테스트

