# 백엔드 서버 시작 가이드

## 문제 해결

### 503 Service Unavailable 오류

AR 네비게이션 실행 시 `POST http://localhost:8000/api/v1/auth/sync-user 503 (Service Unavailable)` 오류가 발생하는 경우:

**원인**: 백엔드 서버가 실행되지 않았거나 데이터베이스 연결 문제

**해결 방법**:

### 1. 백엔드 서버 시작

```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. 서버 상태 확인

브라우저에서 다음 URL을 열어 확인:
- http://localhost:8000/health
- http://localhost:8000/docs (API 문서)

### 3. 데이터베이스 연결 확인

```powershell
cd backend
.\venv\Scripts\python.exe -c "from app.database import SessionLocal; db = SessionLocal(); print('✅ 연결 성공!'); db.close()"
```

## 자동 시작 (선택사항)

### PowerShell 스크립트로 시작

`backend/start_server.ps1` 파일 생성:

```powershell
# 백엔드 서버 시작 스크립트
Write-Host "=== ARWay Lite Backend Server 시작 ===" -ForegroundColor Cyan

# 가상환경 확인
if (-not (Test-Path "venv\Scripts\python.exe")) {
    Write-Host "❌ 가상환경을 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "가상환경 생성: python -m venv venv" -ForegroundColor Yellow
    exit 1
}

# 서버 시작
Write-Host "`n서버 시작 중..." -ForegroundColor Green
Write-Host "접속 주소: http://localhost:8000" -ForegroundColor Green
Write-Host "API 문서: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "`n종료하려면 Ctrl+C를 누르세요.`n" -ForegroundColor Yellow

.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

사용 방법:
```powershell
cd backend
.\start_server.ps1
```

## 체크리스트

백엔드 서버가 정상적으로 실행되면:

- [ ] http://localhost:8000/health 접속 시 `{"status": "healthy", "database": "connected"}` 응답
- [ ] http://localhost:8000/docs 접속 시 Swagger UI 표시
- [ ] 프론트엔드에서 API 호출 시 503 오류 없음

## 문제 해결

### 포트 8000이 이미 사용 중인 경우

```powershell
# 포트 사용 중인 프로세스 확인
netstat -ano | findstr :8000

# 프로세스 종료 (PID는 위 명령어 결과에서 확인)
taskkill /PID <PID> /F
```

### 데이터베이스 연결 실패

1. `.env` 파일 확인:
   ```env
   DATABASE_URL=postgresql://...
   ```

2. Supabase 연결 확인:
   ```powershell
   # DNS 해결 확인
   nslookup db.zjesefcqdxuawinbvghh.supabase.co
   
   # 포트 연결 확인
   Test-NetConnection -ComputerName db.zjesefcqdxuawinbvghh.supabase.co -Port 6543
   ```

3. 백엔드 서버 재시작

## 참고

- 백엔드 서버는 프론트엔드 실행 전에 시작해야 합니다
- 개발 중에는 `--reload` 옵션으로 자동 재시작됩니다
- 프로덕션에서는 `--reload` 옵션을 제거하세요

