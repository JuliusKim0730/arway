"""
pytest 설정 및 공통 픽스처
"""
import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, JSON, String, TypeDecorator
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.database import Base, get_db
from app.main import app

# SQLite용 UUID 타입 어댑터
class GUID(TypeDecorator):
    """SQLite에서 UUID를 문자열로 저장하는 타입 어댑터"""
    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'sqlite':
            return dialect.type_descriptor(String(36))
        else:
            return dialect.type_descriptor(UUID(as_uuid=True))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'sqlite':
            return str(value) if isinstance(value, uuid.UUID) else value
        else:
            return value

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'sqlite':
            return uuid.UUID(value) if isinstance(value, str) else value
        else:
            return value

# 테스트용 인메모리 SQLite 데이터베이스
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# SQLite는 JSONB와 UUID를 지원하지 않으므로 변환 필요
# 모든 테이블의 JSONB 컬럼을 JSON으로, UUID 컬럼을 GUID로 변경
for table in Base.metadata.tables.values():
    for column in table.columns:
        if isinstance(column.type, JSONB):
            column.type = JSON()
        elif isinstance(column.type, UUID):
            column.type = GUID()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """각 테스트마다 새로운 데이터베이스 세션 생성"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """테스트용 FastAPI 클라이언트"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user_id():
    """테스트용 사용자 ID"""
    return "00000000-0000-0000-0000-000000000000"

