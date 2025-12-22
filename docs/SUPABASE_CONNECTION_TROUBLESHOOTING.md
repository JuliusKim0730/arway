# Supabase 연결 문제 해결 가이드

## 현재 문제

PowerShell의 `Test-NetConnection`에서 다음과 같은 오류가 발생합니다:

```
경고: Name resolution of db.zjesefcqdxuawinbvghh.supabase.co failed
ComputerName   : db.zjesefcqdxuawinbvghh.supabase.co
RemoteAddress  :
PingSucceeded  : False
```

## 원인 분석

1. **DNS 해결 실패**: Windows가 호스트 이름을 해결하지 못함
2. **IPv6만 제공**: `nslookup`으로는 IPv6 주소만 확인됨 (`2406:da18:243:7411:c347:d8d8:4b16:3ad6`)
3. **IPv4 주소 없음**: Windows의 기본 IPv4 우선 정책으로 인해 연결 실패

## 해결 방법

### 방법 1: Supabase Dashboard에서 연결 풀러 확인 (가장 권장)

연결 풀러는 일반적으로 IPv4를 제공하며 더 안정적입니다.

#### 1단계: Supabase Dashboard 접속

1. https://supabase.com/dashboard 접속
2. 프로젝트 **ARWAY** 선택
3. 프로젝트 상태 확인:
   - ✅ **Active**: 정상
   - ⚠️ **Paused**: 일시 중지됨 (재개 필요)
   - ❌ **Deleted**: 삭제됨

#### 2단계: 연결 정보 확인

1. 좌측 메뉴에서 **Settings** > **Database** 클릭
2. **Connection string** 섹션 확인
3. 다음 두 가지 옵션 중 하나 선택:

   **옵션 A: Connection Pooling (권장)**
   ```
   postgresql://postgres.zjesefcqdxuawinbvghh:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   - 호스트: `aws-0-[REGION].pooler.supabase.com` (예: `aws-0-ap-northeast-2.pooler.supabase.com`)
   - 포트: `6543`
   - 사용자: `postgres.zjesefcqdxuawinbvghh`

   **옵션 B: Direct Connection**
   ```
   postgresql://postgres:[PASSWORD]@db.zjesefcqdxuawinbvghh.supabase.co:5432/postgres
   ```
   - 호스트: `db.zjesefcqdxuawinbvghh.supabase.co`
   - 포트: `5432`
   - 사용자: `postgres`

#### 3단계: `.env` 파일 업데이트

`backend/.env` 파일을 열고 `DATABASE_URL`을 업데이트:

```powershell
cd "C:\Cursor Project\new_challange\backend"
notepad .env
```

**연결 풀러 사용 시 (권장)**:
```env
DATABASE_URL=postgresql://postgres.zjesefcqdxuawinbvghh:INxkh5owhddmewHT@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require
```

**직접 연결 사용 시**:
```env
DATABASE_URL=postgresql://postgres:INxkh5owhddmewHT@db.zjesefcqdxuawinbvghh.supabase.co:5432/postgres?sslmode=require
```

#### 4단계: 연결 테스트

```powershell
# 연결 풀러 호스트 테스트
Test-NetConnection -ComputerName aws-0-ap-northeast-2.pooler.supabase.com -Port 6543

# 또는 직접 연결 호스트 테스트
Test-NetConnection -ComputerName db.zjesefcqdxuawinbvghh.supabase.co -Port 5432
```

#### 5단계: 백엔드 서버 재시작

```powershell
cd "C:\Cursor Project\new_challange\backend"
.\restart_server.ps1
```

### 방법 2: IPv6 직접 사용

IPv6 주소를 직접 사용할 수 있습니다:

```env
DATABASE_URL=postgresql://postgres:INxkh5owhddmewHT@[2406:da18:243:7411:c347:d8d8:4b16:3ad6]:6543/postgres?sslmode=require
```

**주의**: IPv6 주소는 대괄호 `[]`로 감싸야 합니다.

### 방법 3: DNS 서버 변경

Windows DNS 서버를 변경하여 해결할 수 있습니다:

1. **네트워크 설정 열기**
   - Windows 설정 > 네트워크 및 인터넷 > 어댑터 옵션 변경
   - 사용 중인 네트워크 어댑터 우클릭 > 속성
   - "Internet Protocol Version 4 (TCP/IPv4)" 선택 > 속성

2. **DNS 서버 설정**
   - "다음 DNS 서버 주소 사용" 선택
   - 기본 설정 DNS 서버: `8.8.8.8` (Google DNS)
   - 대체 DNS 서버: `8.8.4.4` (Google DNS)
   - 또는 Cloudflare DNS: `1.1.1.1`, `1.0.0.1`

3. **DNS 캐시 플러시**
   ```powershell
   ipconfig /flushdns
   ```

## 추가 확인 사항

### 1. 방화벽 설정

Windows 방화벽이 포트를 차단하고 있을 수 있습니다:

```powershell
# 방화벽 규칙 확인
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*PostgreSQL*"}

# 포트 허용 (관리자 권한 필요)
New-NetFirewallRule -DisplayName "PostgreSQL 5432" -Direction Outbound -RemotePort 5432 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "PostgreSQL 6543" -Direction Outbound -RemotePort 6543 -Protocol TCP -Action Allow
```

### 2. VPN 확인

VPN을 사용 중이라면 비활성화하고 테스트해보세요.

### 3. 네트워크 환경 확인

회사/학교 네트워크에서 포트가 차단되었을 수 있습니다. 모바일 핫스팟으로 테스트해보세요.

## 코드 수정 사항

`backend/app/database/__init__.py`에서 다음 수정을 적용했습니다:

1. **IPv6 지원 추가**: IPv4가 없으면 IPv6 주소 사용
2. **DNS 해결 개선**: `nslookup`을 사용하여 IP 주소 찾기
3. **SSL 설정 자동 추가**: `sslmode=require` 자동 추가

## Health Check 확인

백엔드 서버 시작 후:

```powershell
# Health Check
curl http://localhost:8000/health

# 또는 브라우저에서 접속
# http://localhost:8000/health
```

**예상 결과**:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

## 문제가 계속되면

1. **Supabase Dashboard 확인**
   - 프로젝트 상태가 "Active"인지 확인
   - 연결 문자열이 올바른지 확인
   - 비밀번호가 올바른지 확인

2. **Supabase 지원팀 문의**
   - 프로젝트가 정상적으로 작동하는지 확인
   - 네트워크 연결 문제인지 확인

3. **대안: 로컬 PostgreSQL 사용**
   - Docker로 로컬 PostgreSQL 실행
   - 개발 환경에서만 사용

## 참고

- Supabase 연결 정보는 `backend/.env` 파일에 저장됩니다
- 비밀번호는 대소문자를 구분합니다
- SSL 연결이 필요하므로 `sslmode=require` 옵션이 필수입니다
- 연결 풀러 사용을 권장합니다 (더 안정적이고 IPv4 제공 가능)

