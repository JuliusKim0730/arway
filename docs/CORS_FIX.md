# CORS 및 백엔드 에러 해결 가이드

## 문제
- CORS 에러: `No 'Access-Control-Allow-Origin' header`
- ARWAY 제품에서 출발과 도착 설정 후 네비게이션 동작 시 발생
- `POST http://localhost:8000/api/v1/auth/sync-user` 요청 실패

## 해결 사항

### 1. CORS 설정 개선 (`backend/app/main.py`)
- **개발 환경(DEBUG=True)**: localhost의 모든 포트에서 자동 허용 (정규식 사용)
- **프로덕션 환경**: 환경 변수에 명시된 origin만 허용
- `allow_methods` 명시적 설정
- `expose_headers` 추가

**변경 내용:**
```python
# 개발 모드: localhost의 모든 포트 허용 (정규식 사용)
if settings.debug:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
```

### 2. 환경 변수 설정 (`backend/.env`)
- `CORS_ORIGINS` 환경 변수 추가 (프로덕션 환경용)
- 기본값: `http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001`

### 3. 에러 핸들링 추가 (`backend/app/api/v1/auth.py`)
- try-catch 블록 추가
- 에러 로깅 추가
- 데이터베이스 rollback 추가

## 백엔드 서버 재시작 필요

변경사항을 적용하려면 백엔드 서버를 재시작해야 합니다:

### 방법 1: PowerShell에서 직접 실행
```powershell
# 백엔드 디렉토리로 이동
cd "C:\Cursor Project\new_challange\backend"

# 가상환경 활성화 (필요한 경우)
.\venv\Scripts\Activate.ps1

# 백엔드 서버 시작
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 방법 2: 재시작 스크립트 사용
```powershell
cd "C:\Cursor Project\new_challange\backend"
.\restart_server.ps1
```

### 방법 3: 기존 서버 중지 후 재시작
```powershell
# 1. 기존 서버 중지 (Ctrl+C)
# 2. 포트 8000 사용 중인 프로세스 확인 및 종료 (필요한 경우)
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force

# 3. 서버 재시작
cd "C:\Cursor Project\new_challange\backend"
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 서버 실행 확인

서버가 정상적으로 실행되었는지 확인:

1. **헬스 체크**: 브라우저에서 `http://localhost:8000/health` 접속
2. **API 문서**: `http://localhost:8000/docs` 접속
3. **로그 확인**: 서버 시작 시 다음과 같은 로그가 표시되어야 함:
   ```
   [DEBUG] 개발 모드: localhost의 모든 포트에서 CORS 허용
   [DEBUG] CORS Origins: ['http://localhost:3000', ...]
   ```

## 테스트

재시작 후 다음을 테스트하세요:

1. 프론트엔드에서 목적지 선택 (`http://localhost:3000/ar-nav/select`)
2. 출발 위치 설정
3. "AR 네비게이션 시작하기" 버튼 클릭
4. CORS 에러가 해결되었는지 확인
5. 브라우저 콘솔에서 에러 메시지 확인

## 추가 문제 해결

만약 여전히 에러가 발생한다면:

### 1. 백엔드 서버 실행 확인
```powershell
# 포트 8000이 사용 중인지 확인
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
```

### 2. 백엔드 서버 로그 확인
- 서버 콘솔에서 CORS 관련 로그 확인
- `[DEBUG] CORS 허용 (개발 모드): http://localhost:3000` 메시지 확인

### 3. 데이터베이스 연결 확인
```powershell
# 헬스 체크 엔드포인트 호출
Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET
```

### 4. 환경 변수 확인 (`backend/.env`)
- `DEBUG=True` 설정 확인
- `CORS_ORIGINS` 설정 확인 (선택사항, 개발 모드에서는 자동 처리)

### 5. 브라우저 캐시 클리어
- 브라우저 개발자 도구에서 "Disable cache" 활성화
- 하드 리프레시: `Ctrl+Shift+R` (Windows) 또는 `Cmd+Shift+R` (Mac)

### 6. 네트워크 탭 확인
- 브라우저 개발자 도구 > Network 탭
- `sync-user` 요청의 Response Headers에서 `Access-Control-Allow-Origin` 확인

## 참고사항

- **개발 환경**: `DEBUG=True`일 때 localhost의 모든 포트에서 자동 허용
- **프로덕션 환경**: `DEBUG=False`일 때 환경 변수에 명시된 origin만 허용
- CORS 설정 변경 후 반드시 서버 재시작 필요

