# 데이터베이스 연결 문제 해결 가이드

## 문제 상황

프로젝트 실행 시 다음과 같은 에러가 발생합니다:

```json
[{
  "status":"unhealthy",
  "database":"disconnected",
  "error":"데이터베이스 호스트를 찾을 수 없습니다. 네트워크 연결을 확인하거나 백엔드 서버를 재시작해주세요.",
  "hint":"백엔드 서버를 재시작하면 해결될 수 있습니다."
},503]
```

## 원인 분석

1. **DNS 해결 문제**: Windows에서 Python의 `socket.getaddrinfo`가 Supabase 호스트 이름을 해결하지 못함
2. **연결 타임아웃**: 방화벽 또는 네트워크 설정 문제로 인한 연결 실패

## 해결 방법

### 1. Supabase 프로젝트 상태 확인

먼저 Supabase 프로젝트가 활성 상태인지 확인하세요:

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 **ARWAY** 선택
3. 프로젝트 상태 확인:
   - ✅ **Active**: 정상
   - ⚠️ **Paused**: 일시 중지됨 (재개 필요)
   - ❌ **Deleted**: 삭제됨 (새 프로젝트 생성 필요)

### 2. 방화벽 설정 확인

Windows 방화벽이 포트 5432 또는 6543을 차단하고 있을 수 있습니다:

```powershell
# 방화벽 규칙 확인
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*PostgreSQL*"}

# 포트 5432 허용 (관리자 권한 필요)
New-NetFirewallRule -DisplayName "PostgreSQL 5432" -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "PostgreSQL 6543" -Direction Inbound -LocalPort 6543 -Protocol TCP -Action Allow
```

### 3. 네트워크 연결 테스트

```powershell
# Supabase 호스트 연결 테스트
Test-NetConnection -ComputerName db.zjesefcqdxuawinbvghh.supabase.co -Port 5432
Test-NetConnection -ComputerName db.zjesefcqdxuawinbvghh.supabase.co -Port 6543
```

### 4. 백엔드 서버 재시작

수정 사항 적용을 위해 백엔드 서버를 재시작하세요:

```powershell
cd "C:\Cursor Project\new_challange\backend"
.\restart_server.ps1
```

### 5. 연결 테스트

백엔드 서버 시작 후:

```powershell
# Health Check 확인
curl http://localhost:8000/health

# 또는 브라우저에서 접속
# http://localhost:8000/health
```

예상 결과:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

## 추가 문제 해결

### 문제: 여전히 연결 타임아웃 발생

**가능한 원인**:
1. 회사/학교 네트워크에서 포트 차단
2. VPN 사용 중
3. Supabase 프로젝트가 일시 중지됨

**해결 방법**:
1. 다른 네트워크에서 테스트 (모바일 핫스팟 등)
2. VPN 비활성화 후 재시도
3. Supabase Dashboard에서 프로젝트 재개

### 문제: DNS 해결 실패

**해결 방법**:
1. Windows DNS 캐시 플러시:
   ```powershell
   ipconfig /flushdns
   ```

2. DNS 서버 변경:
   - Google DNS: `8.8.8.8`, `8.8.4.4`
   - Cloudflare DNS: `1.1.1.1`, `1.0.0.1`

## 수정된 코드

`backend/app/database/__init__.py`에서 DNS 해결 함수를 사용하여 Windows DNS 문제를 우회합니다:

```python
def resolve_supabase_hostname(hostname):
    """Supabase 호스트 이름을 IPv4 주소로 해결 (Windows DNS 문제 우회)"""
    if "supabase.co" not in hostname:
        return None
    
    try:
        # nslookup을 사용하여 IPv4 주소 찾기
        result = subprocess.run(
            ["nslookup", hostname],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            ipv4_match = re.search(r'Address:\s+(\d+\.\d+\.\d+\.\d+)', result.stdout)
            if ipv4_match:
                ipv4 = ipv4_match.group(1)
                logger.info(f"DNS 해결: {hostname} -> {ipv4}")
                return ipv4
    except Exception as e:
        logger.warning(f"DNS 해결 실패: {e}")
    
    return None
```

## 참고

- Supabase 연결 정보는 `backend/.env` 파일에 저장되어 있습니다
- 연결 풀러(포트 6543) 사용을 권장합니다
- SSL 연결이 필요하므로 `sslmode=require` 옵션이 자동으로 추가됩니다

