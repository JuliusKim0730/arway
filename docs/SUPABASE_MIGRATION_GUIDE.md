# Supabase 마이그레이션 가이드

**작성일**: 2024년 12월 19일  
**목적**: PostgreSQL에서 Supabase로 데이터베이스 이관

---

## 📋 사전 준비

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com/) 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: ARWay Lite
   - **Database Password**: 강력한 비밀번호 설정 (저장 필수!)
   - **Region**: 가장 가까운 리전 선택
4. 프로젝트 생성 완료 대기 (약 2분)

### 2. Supabase 연결 정보 확인

프로젝트 생성 후:
1. 좌측 메뉴에서 "Settings" > "Database" 클릭
2. "Connection string" 섹션에서 다음 정보 확인:
   - **Connection string**: `postgresql://postgres:[INxkh5owhddmewHT]@db.[zjesefcqdxuawinbvghh].supabase.co:5432/postgres`
   - **Connection pooling**: `postgresql://postgres:[INxkh5owhddmewHT]@db.[zjesefcqdxuawinbvghh].supabase.co:6543/postgres`
   - **Direct connection**: `postgresql://postgres:[INxkh5owhddmewHT]@db.[zjesefcqdxuawinbvghh].supabase.co:5432/postgres`

host:
db.zjesefcqdxuawinbvghh.supabase.co

port:
5432

database:
postgres

user:
postgres



3. **Settings** > **API** 메뉴로 이동하여 다음 정보 확인:
   - **Project URL**: `https://[PROJECT-REF].supabase.co` (예: `https://zjesefcqdxuawinbvghh.supabase.co`)
   - **Project API keys** 섹션:
     - **anon public**: `sb_publishable_...` (프론트엔드용 공개 API 키)
     - **service_role**: `sb_secret_...` (백엔드용 서비스 API 키, **비밀 유지 필수!**)
   
   > 📌 **중요**: `service_role` 키는 모든 데이터베이스 권한을 가지므로 절대 공개하지 마세요!



---

## 🔧 환경 변수 설정

### 프론트엔드 (`frontend/.env.local`)

```env
# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
# NEXTAUTH_SECRET 생성 방법:
# Windows: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Linux/Mac: openssl rand -base64 32
# 또는: https://generate-secret.vercel.app/32

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Supabase (프론트엔드용)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 백엔드 (`backend/.env`)

```env
# Supabase Database (Connection Pooling 사용 권장)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres

# 또는 Direct Connection
# DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Supabase API Keys
# Settings > API 메뉴에서 가져오기
SUPABASE_URL=https://[PROJECT-REF].supabase.co
# 예: https://zjesefcqdxuawinbvghh.supabase.co
# Settings > API > Project URL에서 복사

SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
# 예: sb_secret_YTpRrguQHMcagy9YJcSa9Q_zW4BCmE0
# Settings > API > Project API keys > service_role에서 복사
# ⚠️ 이 키는 절대 공개하지 마세요! 백엔드에서만 사용합니다.

# 기타 설정
SECRET_KEY=your-secret-key-here
DEBUG=True
```

---

## 🗄️ 데이터베이스 스키마 마이그레이션

### 1. Supabase SQL Editor에서 스키마 생성

Supabase Dashboard > SQL Editor에서 다음 SQL 실행:

```sql
-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Destinations 테이블
CREATE TABLE IF NOT EXISTS destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    address VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_destinations_is_active ON destinations(is_active);
CREATE INDEX IF NOT EXISTS idx_destinations_created_by ON destinations(created_by);

-- Navigation Sessions 테이블
CREATE TYPE session_status AS ENUM ('active', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS navigation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    destination_id UUID NOT NULL REFERENCES destinations(id),
    start_latitude NUMERIC(10, 8),
    start_longitude NUMERIC(11, 8),
    end_latitude NUMERIC(10, 8),
    end_longitude NUMERIC(11, 8),
    status session_status DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_distance NUMERIC(10, 2)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_status ON navigation_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_destination ON navigation_sessions(destination_id);

-- Navigation Points 테이블
CREATE TABLE IF NOT EXISTS navigation_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES navigation_sessions(id) ON DELETE CASCADE,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    accuracy NUMERIC(10, 2),
    heading NUMERIC(5, 2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_session ON navigation_points(session_id);
CREATE INDEX IF NOT EXISTS idx_points_recorded_at ON navigation_points(recorded_at);

-- Favorites 테이블
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, destination_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_destination ON favorites(destination_id);

-- Analytics Events 테이블
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES navigation_sessions(id),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);

-- Updated_at 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated_at 트리거 생성
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_destinations_updated_at BEFORE UPDATE ON destinations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Row Level Security (RLS) 설정 (선택사항)

보안을 위해 RLS를 활성화할 수 있습니다:

```sql
-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- 정책 예시 (사용자는 자신의 데이터만 볼 수 있음)
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Destinations는 모든 사용자가 볼 수 있음
CREATE POLICY "Destinations are viewable by everyone" ON destinations
    FOR SELECT USING (true);

-- Sessions는 자신의 것만 볼 수 있음
CREATE POLICY "Users can view own sessions" ON navigation_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);
```

**참고**: 현재는 백엔드 API를 통해 접근하므로 RLS는 선택사항입니다.

---

## 🔄 데이터 마이그레이션 (기존 데이터가 있는 경우)

### 1. 데이터 덤프 (로컬 PostgreSQL)

```powershell
cd "C:\Cursor Project\new_challange"
docker exec arway-postgres pg_dump -U arway_user arway_lite > backup.sql
```

### 2. 데이터 가져오기 (Supabase)

Supabase Dashboard > SQL Editor에서:

```sql
-- 백업 파일의 내용을 복사하여 실행
-- 또는 psql을 사용하여 직접 가져오기
```

또는 Supabase CLI 사용:

```bash
supabase db push
```

---

## ✅ 마이그레이션 확인

### 1. 연결 테스트

백엔드에서 연결 테스트:

```powershell
cd backend
.\venv\Scripts\python.exe -c "from app.database import SessionLocal; db = SessionLocal(); print('Connected!'); db.close()"
```

### 2. 테이블 확인

Supabase Dashboard > Table Editor에서 모든 테이블이 생성되었는지 확인

### 3. 마이그레이션 실행

```powershell
cd backend
.\venv\Scripts\python.exe -m alembic upgrade head
```

---

## 🚨 주의사항

### 연결 풀링 vs 직접 연결

- **Connection Pooling** (포트 6543): 
  - 많은 동시 연결에 적합
  - 프로덕션 환경 권장
  - 연결 수 제한: 200개

- **Direct Connection** (포트 5432):
  - 개발 환경에 적합
  - 연결 수 제한: 60개

### 비밀번호 보안

- Supabase 데이터베이스 비밀번호를 안전하게 보관
- 환경 변수에 직접 비밀번호를 포함하지 말고, `.env` 파일 사용
- `.env` 파일을 Git에 커밋하지 마세요

### 백업

- Supabase는 자동 백업을 제공하지만, 중요한 데이터는 별도로 백업 권장
- Supabase Dashboard > Database > Backups에서 백업 확인

---

## 📞 문제 해결

### 연결 오류

1. **"password authentication failed"**
   - 비밀번호 확인
   - 연결 문자열 확인

2. **"connection timeout"**
   - 방화벽 설정 확인
   - Supabase 프로젝트 상태 확인

3. **"too many connections"**
   - Connection Pooling 사용
   - 연결 풀 크기 조정

### 스키마 오류

1. **"relation does not exist"**
   - SQL 스크립트가 제대로 실행되었는지 확인
   - 테이블 이름 확인

2. **"permission denied"**
   - RLS 정책 확인
   - 사용자 권한 확인

---

**마지막 업데이트**: 2024년 12월 19일

