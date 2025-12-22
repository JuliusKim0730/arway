# Supabase 테이블 생성 가이드

## 문제 상황

Supabase 프로젝트는 정상이지만 테이블이 없어서 백엔드 서버가 데이터베이스에 연결할 수 없습니다.

## 해결 방법

### 1. Supabase SQL Editor에서 테이블 생성

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard 접속
   - 프로젝트 선택: ARWAY

2. **SQL Editor 열기**
   - 좌측 메뉴에서 "SQL Editor" 클릭
   - 또는 상단 검색에서 "SQL Editor" 검색

3. **SQL 스크립트 실행**
   - `docs/CREATE_TABLES.sql` 파일의 내용을 복사
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭 (또는 `Ctrl+Enter`)

4. **실행 결과 확인**
   - 성공 메시지 확인: "Success. No rows returned"
   - 또는 "모든 테이블이 성공적으로 생성되었습니다!" 메시지 확인

### 2. 테이블 생성 확인

1. **Table Editor에서 확인**
   - 좌측 메뉴에서 "Table Editor" 클릭
   - 다음 테이블들이 생성되었는지 확인:
     - ✅ `users`
     - ✅ `destinations`
     - ✅ `navigation_sessions`
     - ✅ `navigation_points`
     - ✅ `favorites`
     - ✅ `analytics_events`
     - ✅ `feedback`

2. **Schema Visualizer에서 확인**
   - 좌측 메뉴에서 "Schema Visualizer" 클릭
   - 테이블들이 시각적으로 표시되는지 확인

### 3. 백엔드 서버 재시작

테이블 생성 후 백엔드 서버를 재시작하세요:

```powershell
cd "C:\Cursor Project\new_challange\backend"
.\restart_server.ps1
```

또는:

```powershell
cd "C:\Cursor Project\new_challange\backend"
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. 연결 테스트

백엔드 서버 시작 후:

1. **Health Check 확인**
   - 브라우저에서 http://localhost:8000/health 접속
   - 예상 결과: `{"status": "healthy", "database": "connected"}`

2. **디버깅 스크립트 실행**
   ```powershell
   cd backend
   $env:PYTHONIOENCODING="utf-8"
   .\venv\Scripts\python.exe full_debug.py
   ```

## 생성되는 테이블

### 1. users
- 사용자 정보 저장
- Google OAuth 연동

### 2. destinations
- 목적지 정보 저장
- Google Places API 연동

### 3. navigation_sessions
- 네비게이션 세션 관리
- 시작/도착 위치, 상태 추적

### 4. navigation_points
- 네비게이션 중 GPS 포인트 저장
- 실시간 위치 추적

### 5. favorites
- 사용자 즐겨찾기 저장

### 6. analytics_events
- 분석 이벤트 저장
- JSONB 형식으로 유연한 데이터 저장

### 7. feedback
- 사용자 피드백 저장
- 평점 및 코멘트

## 문제 해결

### 오류: "relation does not exist"
- **원인**: 테이블이 생성되지 않음
- **해결**: SQL 스크립트를 다시 실행

### 오류: "permission denied"
- **원인**: 권한 문제
- **해결**: Supabase Dashboard에서 올바른 프로젝트를 선택했는지 확인

### 오류: "type already exists"
- **원인**: ENUM 타입이 이미 존재
- **해결**: 무시하고 계속 진행 (IF NOT EXISTS 사용)

## 참고

- SQL 스크립트는 `IF NOT EXISTS`를 사용하여 안전하게 재실행 가능
- 트리거는 `DROP TRIGGER IF EXISTS`로 기존 트리거를 제거 후 재생성
- 모든 테이블은 UUID를 기본 키로 사용

