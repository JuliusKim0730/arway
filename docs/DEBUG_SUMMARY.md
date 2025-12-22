# 디버깅 요약 및 해결 방법

## 문제 상황

1. **DNS 해결 문제**: Python의 `socket.getaddrinfo`가 Supabase 호스트 이름을 해결하지 못함
2. **연결 타임아웃**: 포트 6543(연결 풀러)에 연결 실패
3. **데이터베이스 연결 실패**: 백엔드 서버가 Supabase에 연결할 수 없음

## 해결 방법

### 1. DNS 해결 개선

`backend/app/database/__init__.py`에서 nslookup을 사용하여 IPv4 주소를 직접 찾도록 수정:

```python
def resolve_supabase_hostname(hostname):
    """Supabase 호스트 이름을 IPv4 주소로 해결"""
    if "supabase.co" not in hostname:
        return None
    
    try:
        result = subprocess.run(
            ["nslookup", hostname],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            ipv4_match = re.search(r'Address:\s+(\d+\.\d+\.\d+\.\d+)', result.stdout)
            if ipv4_match:
                return ipv4_match.group(1)
    except Exception as e:
        logger.warning(f"DNS 해결 실패: {e}")
    
    return None
```

### 2. 포트 변경

- **포트 6543 (연결 풀러)**: 타임아웃 발생 → 사용 불가
- **포트 5432 (직접 연결)**: 사용 권장

`.env` 파일에서:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 3. 백엔드 서버 재시작

변경 사항 적용을 위해 백엔드 서버 재시작 필요:

```powershell
cd backend
.\restart_server.ps1
```

## Supabase 마이그레이션 상태 확인

### 필요한 테이블

다음 테이블들이 Supabase에 생성되어 있어야 합니다:

1. ✅ `users` - 사용자 정보
2. ✅ `destinations` - 목적지 정보
3. ✅ `navigation_sessions` - 네비게이션 세션
4. ✅ `navigation_points` - 네비게이션 포인트
5. ✅ `favorites` - 즐겨찾기
6. ✅ `analytics_events` - 분석 이벤트
7. ✅ `feedback` - 피드백

### 마이그레이션 확인 방법

1. **Supabase Dashboard 확인**:
   - Supabase Dashboard > Table Editor에서 테이블 목록 확인

2. **SQL Editor에서 확인**:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

3. **백엔드 스크립트로 확인**:
   ```powershell
   cd backend
   $env:PYTHONIOENCODING="utf-8"
   .\venv\Scripts\python.exe debug_connection.py
   ```

## 다음 단계

1. ✅ DNS 해결 개선 완료
2. ⏳ 포트 5432로 연결 테스트
3. ⏳ 백엔드 서버 재시작
4. ⏳ Supabase 테이블 확인
5. ⏳ Health check 정상화 확인

## 참고

- Windows 환경에서 Python의 DNS 해결이 제한적일 수 있음
- nslookup을 사용하여 IPv4 주소를 직접 찾는 방식으로 우회
- 포트 5432(직접 연결)가 포트 6543(연결 풀러)보다 안정적일 수 있음

