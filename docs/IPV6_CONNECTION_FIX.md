# IPv6 연결 문제 해결 가이드

## 문제 상황

`Test-NetConnection`에서 다음과 같은 경고가 발생합니다:

```
경고: Name resolution of db.zjesefcqdxuawinbvghh.supabase.co failed
```

`nslookup` 결과를 보면:
- IPv6 주소만 반환됨: `2406:da18:243:7411:c347:d8d8:4b16:3ad6`
- IPv4 주소가 없음

## 원인

Windows의 `Test-NetConnection`과 Python의 `socket.getaddrinfo`는 기본적으로 IPv4를 우선합니다. Supabase 호스트가 IPv6만 제공하는 경우 연결이 실패합니다.

## 해결 방법

### 방법 1: Supabase 연결 풀러 사용 (권장)

Supabase 연결 풀러는 IPv4를 제공할 가능성이 높습니다.

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 프로젝트 **ARWAY** 선택

2. **연결 풀러 정보 확인**
   - Settings > Database 메뉴 클릭
   - "Connection string" 섹션에서 "Connection pooling" 확인
   - 형식: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

3. **`.env` 파일 업데이트**
   ```env
   # 연결 풀러 사용 (IPv4 제공 가능)
   DATABASE_URL=postgresql://postgres.zjesefcqdxuawinbvghh:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
   ```

### 방법 2: IPv6 직접 사용

코드가 IPv6를 지원하도록 수정되었습니다. IPv6 주소를 대괄호로 감싸서 사용합니다.

```python
# IPv6 주소 형식: [2406:da18:243:7411:c347:d8d8:4b16:3ad6]
DATABASE_URL=postgresql://postgres:[PASSWORD]@[2406:da18:243:7411:c347:d8d8:4b16:3ad6]:6543/postgres?sslmode=require
```

### 방법 3: 호스트 이름 직접 사용

psycopg2가 IPv6를 지원하는 경우, 호스트 이름을 직접 사용할 수 있습니다.

```env
# 호스트 이름 직접 사용 (psycopg2가 IPv6 지원)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.zjesefcqdxuawinbvghh.supabase.co:6543/postgres?sslmode=require
```

## 코드 수정 사항

`backend/app/database/__init__.py`에서 IPv6 지원을 추가했습니다:

```python
def resolve_supabase_hostname(hostname):
    """Supabase 호스트 이름을 IP 주소로 해결 (Windows DNS 문제 우회)"""
    # IPv4 우선, 없으면 IPv6 사용
    # IPv6 주소는 대괄호로 감싸서 반환
```

## 확인 사항

### 1. Supabase 프로젝트 상태

- 프로젝트가 "Active" 상태인지 확인
- 프로젝트가 일시 중지되었는지 확인

### 2. 네트워크 연결

```powershell
# IPv6 연결 테스트
Test-NetConnection -ComputerName db.zjesefcqdxuawinbvghh.supabase.co -Port 6543

# 연결 풀러 호스트 확인 (Supabase Dashboard에서 확인)
Test-NetConnection -ComputerName aws-0-[REGION].pooler.supabase.com -Port 6543
```

### 3. 방화벽 설정

IPv6 연결을 허용하도록 방화벽 설정 확인:

```powershell
# IPv6 방화벽 규칙 확인
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*PostgreSQL*"}
```

## 권장 사항

**가장 좋은 방법**: Supabase Dashboard에서 연결 풀러 호스트를 확인하고 사용하는 것입니다. 연결 풀러는 일반적으로 IPv4를 제공하며, 더 안정적인 연결을 제공합니다.

## 참고

- IPv6 주소는 URL에서 대괄호로 감싸야 합니다: `[2406:da18:...]`
- 연결 풀러 사용 시 사용자 이름 형식: `postgres.[PROJECT-REF]`
- SSL 연결이 필요하므로 `sslmode=require` 옵션 필수

