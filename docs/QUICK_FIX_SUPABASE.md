# Supabase 연결 문제 빠른 해결 가이드

## 현재 문제

- DNS 해결 실패
- IPv6만 제공됨 (IPv4 없음)
- 연결 타임아웃 발생

## 해결 방법 (3단계)

### 1단계: Supabase Dashboard에서 연결 풀러 정보 확인

1. https://supabase.com/dashboard 접속
2. 프로젝트 **ARWAY** 선택
3. **Settings** > **Database** 메뉴 클릭
4. **Connection string** 섹션에서 **Connection pooling** 확인
5. 연결 문자열 복사 (형식 예시):
   ```
   postgresql://postgres.zjesefcqdxuawinbvghh:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
   ```

### 2단계: .env 파일 업데이트

```powershell
cd "C:\Cursor Project\new_challange\backend"
notepad .env
```

`DATABASE_URL` 라인을 복사한 연결 문자열로 교체하고, `?sslmode=require` 추가:

```env
DATABASE_URL=postgresql://postgres.zjesefcqdxuawinbvghh:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require
```

**중요**: 
- `[PASSWORD]`를 실제 비밀번호로 교체
- `[REGION]`을 실제 리전으로 교체 (예: `ap-northeast-2`)

### 3단계: 백엔드 서버 재시작

```powershell
cd "C:\Cursor Project\new_challange\backend"
.\restart_server.ps1
```

### 4단계: Health Check 확인

브라우저에서 접속:
- http://localhost:8000/health

또는 PowerShell에서:
```powershell
curl http://localhost:8000/health
```

**예상 결과**:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

## 자동 업데이트 스크립트 사용

```powershell
cd "C:\Cursor Project\new_challange"
.\scripts\update_supabase_connection.ps1
```

스크립트가 연결 문자열 입력을 요청하면 Supabase Dashboard에서 복사한 문자열을 붙여넣으세요.

## 문제가 계속되면

1. **Supabase 프로젝트 상태 확인**
   - Dashboard에서 프로젝트가 "Active" 상태인지 확인
   - 프로젝트가 일시 중지되었는지 확인

2. **연결 테스트**
   ```powershell
   # 연결 풀러 호스트 테스트
   Test-NetConnection -ComputerName aws-0-ap-northeast-2.pooler.supabase.com -Port 6543
   ```

3. **방화벽 확인**
   - Windows 방화벽이 포트 6543을 차단하고 있는지 확인
   - 회사/학교 네트워크에서 포트가 차단되었는지 확인

## 참고

- 연결 풀러 사용을 권장합니다 (IPv4 제공 가능)
- SSL 연결이 필요하므로 `sslmode=require` 필수
- 비밀번호는 대소문자를 구분합니다

