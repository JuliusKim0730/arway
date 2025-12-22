from pydantic_settings import BaseSettings
from pydantic import validator, Field
from typing import Optional, List
import os
import logging

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    # 환경 변수에서 직접 읽기 (DATABASE_URL 우선)
    database_url: str = Field(
        default=os.getenv("DATABASE_URL", "postgresql://arway_user:password@localhost:5433/arway_lite"),
        description="데이터베이스 연결 URL"
    )
    secret_key: str = Field(
        default=os.getenv("SECRET_KEY", "your-secret-key-here"),
        description="애플리케이션 시크릿 키"
    )
    debug: bool = Field(
        default=os.getenv("DEBUG", "True").lower() == "true",
        description="디버그 모드 활성화 여부"
    )
    supabase_url: Optional[str] = Field(
        default=os.getenv("SUPABASE_URL"),
        description="Supabase 프로젝트 URL"
    )
    supabase_service_role_key: Optional[str] = Field(
        default=os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
        description="Supabase 서비스 역할 키"
    )
    cors_origins: str = Field(
        default=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000"),
        description="CORS 허용 오리진 목록 (쉼표로 구분)"
    )
    log_level: str = Field(
        default=os.getenv("LOG_LEVEL", "INFO"),
        description="로깅 레벨 (DEBUG, INFO, WARNING, ERROR, CRITICAL)"
    )
    
    # 프로덕션 환경 감지
    environment: str = Field(
        default=os.getenv("ENVIRONMENT", "development"),
        description="실행 환경 (development, production)"
    )
    
    # 포트 설정 (Railway, Render 등에서 사용)
    port: int = Field(
        default=int(os.getenv("PORT", "8000")),
        description="서버 포트"
    )
    
    @validator('database_url')
    def validate_database_url(cls, v):
        """데이터베이스 URL 검증"""
        default_url = "postgresql://arway_user:password@localhost:5433/arway_lite"
        if not v or v == default_url:
            logger.warning(
                "DATABASE_URL이 기본값으로 설정되어 있습니다. "
                ".env 파일에서 DATABASE_URL을 확인하세요."
            )
        elif "supabase.co" in v and "postgresql://" not in v:
            raise ValueError("DATABASE_URL 형식이 올바르지 않습니다. postgresql://로 시작해야 합니다.")
        return v
    
    @validator('supabase_url', pre=True)
    def validate_supabase_url(cls, v):
        """Supabase URL 검증"""
        if v and "supabase.co" not in v:
            raise ValueError("SUPABASE_URL 형식이 올바르지 않습니다. supabase.co 도메인이어야 합니다.")
        return v
    
    @validator('secret_key')
    def validate_secret_key(cls, v):
        """시크릿 키 검증"""
        default_key = "your-secret-key-here"
        if v == default_key:
            logger.warning(
                "SECRET_KEY가 기본값으로 설정되어 있습니다. "
                "프로덕션 환경에서는 반드시 변경하세요."
            )
        return v
    
    @property
    def cors_origins_list(self) -> List[str]:
        """CORS 오리진 목록을 리스트로 반환"""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
    
    @property
    def is_production(self) -> bool:
        """프로덕션 환경 여부 확인"""
        return self.environment.lower() == "production" or not self.debug
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "allow"  # 추가 환경 변수 허용

settings = Settings()

# 디버그: 환경 변수 확인
if settings.debug:
    masked_url = settings.database_url[:50] + "..." if len(settings.database_url) > 50 else settings.database_url
    logger.info(f"[DEBUG] DATABASE_URL 설정됨: {masked_url}")
    logger.info(f"[DEBUG] SUPABASE_URL: {settings.supabase_url}")
    logger.info(f"[DEBUG] CORS Origins: {settings.cors_origins_list}")
    logger.info(f"[DEBUG] Log Level: {settings.log_level}")
    logger.info(f"[DEBUG] Environment: {settings.environment}")
    logger.info(f"[DEBUG] Port: {settings.port}")

