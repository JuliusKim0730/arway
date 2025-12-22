# 🚀 ARWay Lite - 개발 계획 및 이슈 트래킹

**작성일**: 2025-12-22  
**프로젝트 상태**: MVP 95% 완료, 인프라 설정 필요

---

## 📊 현재 상태 요약

### ✅ 완료된 작업 (95%)

#### 1. **프론트엔드** (100% 완료)
- ✅ AR 네비게이션 핵심 기능 구현
- ✅ GPS 위치 추적 및 필터링 (개선됨)
- ✅ 디바이스 방향 감지 및 스무딩 (개선됨)
- ✅ Google Maps API 통합
- ✅ 직선 경로 폴백 시스템
- ✅ 사용자 인증 (Google OAuth)
- ✅ 반응형 UI/UX

#### 2. **백엔드** (100% 완료)
- ✅ FastAPI 서버 구축
- ✅ PostgreSQL 데이터베이스 설계
- ✅ RESTful API 엔드포인트
- ✅ 데이터베이스 마이그레이션
- ✅ 시드 데이터 스크립트

#### 3. **Admin** (100% 완료)
- ✅ 관리자 대시보드
- ✅ 세션 통계 및 분석
- ✅ 목적지 관리

#### 4. **테스트** (100% 완료)
- ✅ 백엔드 단위 테스트
- ✅ 프론트엔드 컴포넌트 테스트
- ✅ 통합 테스트

---

## 🐛 현재 주요 이슈

### 🔴 **Critical (즉시 해결 필요)**

#### 1. **인프라 문제**
- **이슈**: Docker Desktop이 실행되지 않음
- **영향**: PostgreSQL 데이터베이스 접근 불가
- **해결 방법**:
  ```bash
  # Option 1: Docker Desktop 시작
  # Windows에서 Docker Desktop 앱 실행
  
  # Option 2: 로컬 PostgreSQL 사용
  # PostgreSQL 설치 및 실행
  # backend/.env에서 DATABASE_URL 수정
  ```
- **우선순위**: P0 (최우선)
- **예상 시간**: 10분

#### 2. **데이터베이스 연결 실패**
- **이슈**: PostgreSQL 포트 5433 연결 거부
- **영향**: 백엔드 서버 실행 불가
- **해결 방법**:
  ```bash
  # Docker 사용
  docker-compose up -d postgres
  
  # 또는 로컬 PostgreSQL
  # 1. PostgreSQL 서비스 시작
  # 2. 데이터베이스 생성
  createdb arway_lite
  createuser arway_user -P
  psql arway_lite -c "GRANT ALL PRIVILEGES ON DATABASE arway_lite TO arway_user;"
  ```
- **우선순위**: P0
- **예상 시간**: 15분

#### 3. **환경 변수 설정**
- **이슈**: 프론트엔드 `.env.local` 파일 누락
- **영향**: 프론트엔드 빌드 및 실행 시 설정 오류
- **해결 방법**:
  ```bash
  cd frontend
  cp .env.example .env.local
  # .env.local 파일 수정 (API URL, Google Maps API 키 등)
  ```
- **우선순위**: P0
- **예상 시간**: 5분

### 🟡 **Medium (개선 필요)**

#### 4. **AR 네비게이션 버그** (✅ 수정 완료)
- ~~**이슈 1**: 시작점→도착점 AR 네비게이션 동작 안됨~~
- ~~**이슈 2**: 현재 위치 조회의 정확한 위치 조율 안됨~~
- **상태**: ✅ 해결됨 (2025-12-22)
- **개선사항**:
  - GPS 위치 필터링 및 스무딩 알고리즘 추가
  - 적응형 GPS 설정 (정확도 기반)
  - 안정적인 폴백 시스템 (Google Maps API 실패 시)
  - 디바이스 방향 감지 개선

#### 5. **빌드 경고**
- **이슈**: NextAuth useSearchParams Suspense 경고
- **영향**: 프로덕션 빌드 실패 (일부 페이지)
- **해결 방법**:
  ```tsx
  // frontend/app/auth/signin/page.tsx
  import { Suspense } from 'react';
  
  export default function SignInPage() {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <SignInContent />
      </Suspense>
    );
  }
  ```
- **우선순위**: P1
- **예상 시간**: 10분

#### 6. **메타데이터 경고**
- **이슈**: viewport 및 themeColor 메타데이터 경고
- **영향**: 빌드 시 경고 메시지 (기능에는 영향 없음)
- **해결 방법**: Next.js 14 메타데이터 API 업데이트
- **우선순위**: P2
- **예상 시간**: 30분

### 🟢 **Low (선택적 개선)**

#### 7. **성능 최적화**
- 이미지 최적화 (Next.js Image 컴포넌트)
- 코드 스플리팅 개선
- 캐싱 전략 구현
- **우선순위**: P3
- **예상 시간**: 2시간

#### 8. **사용자 경험 개선**
- 로딩 상태 개선
- 에러 메시지 개선
- 오프라인 지원
- **우선순위**: P3
- **예상 시간**: 3시간

---

## 📅 단계별 개발 계획

### **Phase 1: 인프라 설정 및 기본 동작 확인** (30분)

#### Step 1.1: Docker 및 데이터베이스 설정 (15분)
```bash
# 1. Docker Desktop 시작
# Windows: Docker Desktop 앱 실행

# 2. PostgreSQL 컨테이너 시작
docker-compose up -d postgres

# 3. 데이터베이스 연결 확인
docker-compose ps
docker-compose logs postgres
```

#### Step 1.2: 환경 변수 설정 (5분)
```bash
# Frontend
cd frontend
cp .env.example .env.local
# .env.local 파일 수정

# Backend (이미 존재하는지 확인)
cd backend
cat .env
```

#### Step 1.3: 데이터베이스 마이그레이션 (10분)
```bash
cd backend
# 가상환경 활성화
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 마이그레이션 실행
alembic upgrade head

# 시드 데이터 삽입
python -m app.database.seeds
```

### **Phase 2: 서버 실행 및 테스트** (20분)

#### Step 2.1: 백엔드 서버 시작 (5분)
```bash
cd backend
uvicorn app.main:app --reload

# 확인: http://localhost:8000/docs
```

#### Step 2.2: 프론트엔드 서버 시작 (5분)
```bash
cd frontend
npm install  # 필요시
npm run dev

# 확인: http://localhost:3000/ar-nav
```

#### Step 2.3: 기본 기능 테스트 (10분)
- [ ] 시작 화면 로드 확인
- [ ] 목적지 선택 화면 동작 확인
- [ ] AR 네비게이션 GPS 추적 확인
- [ ] 방향 화살표 회전 확인
- [ ] 도착 화면 표시 확인

### **Phase 3: 버그 수정 및 개선** (1시간)

#### Step 3.1: NextAuth Suspense 경고 수정 (10분)
```tsx
// frontend/app/auth/signin/page.tsx 수정
```

#### Step 3.2: 메타데이터 경고 수정 (30분)
```tsx
// layout.tsx 파일들에서 viewport 설정 분리
```

#### Step 3.3: 통합 테스트 (20분)
```bash
# 백엔드 테스트
cd backend
pytest tests/ -v

# 프론트엔드 테스트
cd frontend
npm test
```

### **Phase 4: 프로덕션 준비** (2시간)

#### Step 4.1: 프로덕션 빌드 테스트 (30분)
```bash
# Frontend
cd frontend
npm run build
npm start

# Backend
cd backend
# 프로덕션 설정 확인
```

#### Step 4.2: 성능 최적화 (1시간)
- 이미지 최적화
- 번들 크기 분석
- 캐싱 전략

#### Step 4.3: 배포 준비 (30분)
- 환경 변수 검증
- 보안 설정 확인
- 배포 스크립트 테스트

---

## 🎯 우선순위별 작업 목록

### **P0 (즉시 해결 - 30분)**
1. ✅ Docker Desktop 시작
2. ✅ PostgreSQL 데이터베이스 연결
3. ✅ 환경 변수 설정
4. ✅ 백엔드 서버 실행
5. ✅ 프론트엔드 서버 실행

### **P1 (오늘 중 해결 - 1시간)**
1. ⬜ NextAuth Suspense 경고 수정
2. ⬜ 기본 기능 통합 테스트
3. ⬜ 프로덕션 빌드 테스트

### **P2 (이번 주 - 2시간)**
1. ⬜ 메타데이터 경고 수정
2. ⬜ 에러 핸들링 개선
3. ⬜ 로딩 상태 개선

### **P3 (선택적 - 3시간)**
1. ⬜ 성능 최적화
2. ⬜ 오프라인 지원
3. ⬜ 추가 테스트 작성

---

## 📝 체크리스트

### **인프라 설정**
- [ ] Docker Desktop 실행 중
- [ ] PostgreSQL 컨테이너 실행 중
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 시드 데이터 삽입 완료

### **서버 실행**
- [ ] 백엔드 서버 실행 중 (http://localhost:8000)
- [ ] 프론트엔드 서버 실행 중 (http://localhost:3000)
- [ ] Admin 서버 실행 중 (http://localhost:3001) - 선택사항

### **기능 테스트**
- [ ] 시작 화면 로드
- [ ] Google OAuth 로그인
- [ ] 목적지 선택
- [ ] AR 네비게이션 시작
- [ ] GPS 위치 추적
- [ ] 방향 화살표 표시
- [ ] 거리 계산
- [ ] 도착 감지
- [ ] 피드백 제출

### **빌드 및 배포**
- [ ] 프론트엔드 프로덕션 빌드 성공
- [ ] 백엔드 테스트 통과
- [ ] 프론트엔드 테스트 통과
- [ ] 배포 스크립트 테스트

---

## 🔧 빠른 시작 가이드

### **1분 안에 시작하기**

```bash
# 1. Docker Desktop 시작 (GUI)

# 2. 터미널 1: 데이터베이스 시작
docker-compose up -d postgres

# 3. 터미널 2: 백엔드 시작
cd backend
.\venv\Scripts\activate
alembic upgrade head
python -m app.database.seeds
uvicorn app.main:app --reload

# 4. 터미널 3: 프론트엔드 시작
cd frontend
npm run dev

# 5. 브라우저에서 접속
# http://localhost:3000/ar-nav
```

---

## 📚 참고 문서

- [README.md](./README.md) - 프로젝트 개요
- [PRD.md](./PRD.md) - 제품 요구사항
- [workflow.md](./workflow.md) - 기술 설계
- [IMPLEMENTATION_STATUS.md](./docs/IMPLEMENTATION_STATUS.md) - 구현 상태
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - 테스트 가이드

---

## 🎉 최근 개선사항 (2025-12-22)

### **AR 네비게이션 버그 수정**
1. **GPS 위치 정확도 개선**
   - 위치 필터링 시스템 추가 (이상치 제거)
   - 적응형 GPS 설정 (정확도 기반 동적 조정)
   - 가중 평균 계산 (최신 위치 우선)
   - 비현실적 이동 감지 및 필터링

2. **AR 네비게이션 동작 안정화**
   - 안정적인 폴백 시스템 (Google Maps API 실패 시)
   - 단순화된 경로 계산 로직
   - 디바운싱 적용 (500ms)
   - 더 직관적인 방향 안내

3. **디바이스 방향 감지 개선**
   - 방향 값 스무딩 (급격한 변화 보정)
   - 360도 경계 처리
   - 보정 상태 표시

4. **디버그 기능 강화**
   - 카메라 전면/후면 감지
   - GPS 연속 추적 테스트
   - 정확도 기반 상태 평가

---

## 💡 다음 단계 제안

1. **즉시 실행**: Docker Desktop 시작 → 데이터베이스 연결 → 서버 실행
2. **테스트**: 기본 기능 동작 확인
3. **개선**: NextAuth 경고 수정
4. **최적화**: 성능 및 UX 개선
5. **배포**: 프로덕션 환경 준비

---

**작성자**: Kiro AI Assistant  
**최종 업데이트**: 2025-12-22 17:15 KST
