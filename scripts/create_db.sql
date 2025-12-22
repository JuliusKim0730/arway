-- ARWay Lite 데이터베이스 및 사용자 생성 스크립트
-- 기존 PostgreSQL에 실행

-- 데이터베이스 생성 (이미 존재하면 무시)
SELECT 'CREATE DATABASE arway_lite'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'arway_lite')\gexec

-- 사용자 생성 (이미 존재하면 무시)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'arway_user') THEN
    CREATE USER arway_user WITH PASSWORD 'password';
  END IF;
END
$$;

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE arway_lite TO arway_user;

-- 데이터베이스에 연결하여 스키마 권한 부여
\c arway_lite
GRANT ALL ON SCHEMA public TO arway_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO arway_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO arway_user;

