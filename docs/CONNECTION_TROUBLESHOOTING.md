# Supabase 연결 문제 해결 가이드

## 현재 문제

연결 타임아웃 오류가 계속 발생합니다:
```
connection to server at "210.220.163.82", port 5432 failed: timeout expired
```

## 해결 방법

### 방법 1: Supabase Dashboard에서 연결 문자열 확인 및 업데이트

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 프로젝트 ARWAY 선택

2. **연결 문자열 확인**
   - Settings > Database 메뉴 클릭
   - "Connection string" 섹션 확인
   - **중요**: "Direct connection" 또는 "Connection pooling" 중 하나 선택

3. **올바른 연결 문자열 형식**

   **직접 연결 (포트 5432)**:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.zjesefcqdxuawinbvghh.supabase.co:5432/postgres
   ```

   **연결 풀러 (포트 6543)**:
   ```
   postgresql://postgres.zjesefcqdxuawinbvghh:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

4. **`.env` 파일 업데이트**
   - `backend/.env` 파일 열기
   - `DATABASE_URL`을 Supabase Dashboard에서 복사한 정확한 문자열로 업데이트
   - 비밀번호 확인 (대소문자 구분)

### 방법 2: 방화벽 확인

1. **Windows 방화벽 확인**
   ```powershell
   # 방화벽 규칙 확인
   Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*PostgreSQL*"}
   ```

2. **포트 연결 테스트**
   ```powershell
   # 포트 5432 연결 테스트
   Test-NetConnection -ComputerName db.zjesefcqdxuawinbvghh.supabase.co -Port 5432
   
   # 포트 6543 연결 테스트
   Test-NetConnection -ComputerName db.zjesefcqdxuawinbvghh.supabase.co -Port 6543
   ```

3. **방화벽 규칙 추가 (필요시)**
   - Windows 방화벽 설정 열기
   - "고급 설정" 클릭
   - "인바운드 규칙" > "새 규칙"
   - 포트 선택 > TCP > 특정 로컬 포트: 5432, 6543
   - 연결 허용 선택

### 방법 3: Supabase 프로젝트 설정 확인

1. **프로젝트 상태 확인**
   - Dashboard에서 프로젝트가 "Active" 상태인지 확인
   - 프로젝트가 일시 중지되었는지 확인

2. **네트워크 설정 확인**
   - Settings > Database
   - "Connection pooling" 설정 확인
   - "IP allowlist" 확인 (모든 IP 허용인지 확인)

3. **데이터베이스 비밀번호 확인**
   - Settings > Database
   - "Database password" 확인
   - 비밀번호가 올바른지 확인 (대소문자 구분)

### 방법 4: 연결 문자열 형식 변경

Supabase의 새로운 연결 풀러 형식을 사용:

```env
# 연결 풀러 형식 (권장)
DATABASE_URL=postgresql://postgres.zjesefcqdxuawinbvghh:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# 직접 연결 형식
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.zjesefcqdxuawinbvghh.supabase.co:5432/postgres
```

**중요**: 
- 연결 풀러 형식은 `postgres.[PROJECT-REF]` 형식의 사용자 이름 사용
- 호스트 이름도 `aws-0-[REGION].pooler.supabase.com` 형식 사용

### 방법 5: 테스트 연결

1. **psql로 직접 연결 테스트**
   ```powershell
   # psql이 설치되어 있는 경우
   psql "postgresql://postgres:[PASSWORD]@db.zjesefcqdxuawinbvghh.supabase.co:5432/postgres"
   ```

2. **Python으로 연결 테스트**
   ```powershell
   cd backend
   $env:PYTHONIOENCODING="utf-8"
   .\venv\Scripts\python.exe -c "import psycopg2; conn = psycopg2.connect('postgresql://postgres:[PASSWORD]@db.zjesefcqdxuawinbvghh.supabase.co:5432/postgres'); print('연결 성공!'); conn.close()"
   ```

## 코드 변경 사항

다음 변경을 적용했습니다:

1. **IP 주소 변환 비활성화**: Supabase는 호스트 이름을 직접 사용해야 함
2. **연결 타임아웃 증가**: 15초 → 30초
3. **Keepalive 설정 추가**: 연결 유지 개선

## 다음 단계

1. Supabase Dashboard에서 정확한 연결 문자열 확인
2. `.env` 파일 업데이트
3. 백엔드 서버 재시작
4. 연결 테스트

## 참고

- Supabase 연결 문자열은 프로젝트마다 다를 수 있습니다
- 연결 풀러 형식과 직접 연결 형식이 다릅니다
- 비밀번호는 대소문자를 구분합니다
- 방화벽이나 네트워크 설정이 연결을 차단할 수 있습니다

