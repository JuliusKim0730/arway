# 백엔드 서버 재시작 가이드

## 문제
`could not translate host name "db.zjesefcqdxuawinbvghh.supabase.co" to address: Name or service not known`

이 에러는 백엔드 서버가 Supabase 데이터베이스에 연결할 수 없을 때 발생합니다.

## 해결 방법

### 1. 백엔드 서버 재시작

```powershell
# 1. 현재 실행 중인 백엔드 서버 중지 (Ctrl+C)

# 2. 백엔드 서버 재시작
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. 데이터베이스 연결 테스트

```powershell
cd backend
.\venv\Scripts\python.exe -c "from app.database import SessionLocal; db = SessionLocal(); print('✅ 연결 성공!'); db.close()"
```

### 3. 네트워크 확인

```powershell
# DNS 해결 확인
nslookup db.zjesefcqdxuawinbvghh.supabase.co

# 포트 연결 확인
Test-NetConnection -ComputerName db.zjesefcqdxuawinbvghh.supabase.co -Port 6543
```

## 일반적인 원인

1. **백엔드 서버가 실행되지 않음**: 서버를 시작하세요
2. **네트워크 연결 문제**: 인터넷 연결 확인
3. **환경 변수 문제**: `.env` 파일 확인
4. **DNS 해결 문제**: 네트워크 설정 확인

## 빠른 해결

대부분의 경우 백엔드 서버를 재시작하면 해결됩니다.

