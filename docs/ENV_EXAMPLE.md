# 환경 변수 설정 예시

이 파일은 `.env.example` 파일의 내용입니다.  
`backend/.env` 파일을 생성할 때 참고하세요.

```env
# ARWay Lite Backend 환경 변수 설정 예시
# 이 파일을 복사하여 .env 파일을 생성하고 실제 값으로 수정하세요.

# ============================================
# 데이터베이스 설정
# ============================================

# Supabase Database Connection (Connection Pooling 권장)
# 포트 6543: Connection Pooling (권장)
# 포트 5432: Direct Connection
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?sslmode=require

# 또는 로컬 PostgreSQL 사용 시
# DATABASE_URL=postgresql://arway_user:password@localhost:5433/arway_lite

# ============================================
# Supabase 설정
# ============================================

# Supabase 프로젝트 URL
# 예: https://zjesefcqdxuawinbvghh.supabase.co
SUPABASE_URL=https://[PROJECT-REF].supabase.co

# Supabase 서비스 역할 키 (백엔드 전용, 절대 공개하지 마세요!)
# Settings > API > Project API keys > service_role에서 복사
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ============================================
# 애플리케이션 설정
# ============================================

# 애플리케이션 시크릿 키 (프로덕션에서는 반드시 변경!)
# 생성 방법: 
# Windows: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Linux/Mac: openssl rand -base64 32
SECRET_KEY=your-secret-key-here

# 디버그 모드 (True/False)
DEBUG=True

# ============================================
# CORS 설정
# ============================================

# CORS 허용 오리진 목록 (쉼표로 구분)
# 프론트엔드: localhost:3000
# Admin: localhost:3001
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000

# ============================================
# 로깅 설정
# ============================================

# 로깅 레벨 (DEBUG, INFO, WARNING, ERROR, CRITICAL)
LOG_LEVEL=INFO
```

## 사용 방법

1. `backend` 폴더로 이동:
   ```powershell
   cd backend
   ```

2. `.env` 파일 생성:
   ```powershell
   # Windows PowerShell
   Copy-Item ENV_EXAMPLE.md .env
   # 또는 직접 생성
   New-Item -Path .env -ItemType File
   ```

3. `.env` 파일을 열어 실제 값으로 수정:
   - `DATABASE_URL`: Supabase 연결 문자열
   - `SUPABASE_URL`: Supabase 프로젝트 URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 역할 키
   - `SECRET_KEY`: 애플리케이션 시크릿 키 (프로덕션에서는 반드시 변경!)

## 중요 사항

- ⚠️ `.env` 파일은 절대 Git에 커밋하지 마세요!
- 🔒 `SUPABASE_SERVICE_ROLE_KEY`와 `SECRET_KEY`는 절대 공개하지 마세요!
- 📝 프로덕션 환경에서는 반드시 `DEBUG=False`로 설정하세요!

