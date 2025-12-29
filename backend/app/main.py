from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import traceback
from app.api.v1 import destinations, sessions, navigation_points, feedback, analytics, users, favorites, auth, scq, geofences, indoor_maps, pois, buildings
from app.config import settings

# 로깅 설정
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
    ]
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="ARWay Lite API",
    version="0.1.0",
    description="SCQ 기반 AR 도보 네비게이션 MVP API"
)

# CORS 설정 (환경 변수 기반)
if settings.is_production:
    # 프로덕션 모드: 환경 변수에 명시된 origin만 허용
    logger.info(f"[INFO] 프로덕션 모드: CORS Origins - {settings.cors_origins_list}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
else:
    # 개발 모드: localhost의 모든 포트 허용 (정규식 사용)
    logger.info("[DEBUG] 개발 모드: localhost의 모든 포트에서 CORS 허용")
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

# API 라우터 등록
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(destinations.router, prefix="/api/v1/destinations", tags=["destinations"])
app.include_router(sessions.router, prefix="/api/v1/sessions", tags=["sessions"])
app.include_router(navigation_points.router, prefix="/api/v1/navigation-points", tags=["navigation-points"])
app.include_router(feedback.router, prefix="/api/v1/feedback", tags=["feedback"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(favorites.router, prefix="/api/v1/favorites", tags=["favorites"])
app.include_router(scq.router, prefix="/api/v1/scq", tags=["scq"])
app.include_router(buildings.router, prefix="/api/v1/buildings", tags=["buildings"])
app.include_router(geofences.router, prefix="/api/v1/geofences", tags=["geofences"])
app.include_router(indoor_maps.router, prefix="/api/v1/indoor-maps", tags=["indoor-maps"])
app.include_router(pois.router, prefix="/api/v1/pois", tags=["pois"])

@app.get("/")
async def root():
    return {"message": "ARWay Lite API", "version": "0.1.0"}

# 전역 예외 핸들러
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """HTTP 예외 처리"""
    logger.warning(f"HTTP {exc.status_code}: {exc.detail} - Path: {request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP Error",
            "status_code": exc.status_code,
            "message": exc.detail,
            "path": str(request.url.path)
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """요청 검증 예외 처리"""
    logger.warning(f"Validation Error: {exc.errors()} - Path: {request.url.path}")
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "status_code": 422,
            "message": "요청 데이터 검증에 실패했습니다.",
            "details": exc.errors(),
            "path": str(request.url.path)
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """전역 예외 처리"""
    error_detail = str(exc)
    logger.error(
        f"Unhandled Exception: {error_detail} - Path: {request.url.path}",
        exc_info=True
    )
    
    # 데이터베이스 연결 오류 감지
    if "could not translate host name" in error_detail or "Name or service not known" in error_detail:
        error_detail = "데이터베이스 호스트를 찾을 수 없습니다. 네트워크 연결을 확인하거나 백엔드 서버를 재시작해주세요."
    elif "password authentication failed" in error_detail:
        error_detail = "데이터베이스 인증에 실패했습니다. 환경 변수를 확인해주세요."
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "status_code": 500,
            "message": error_detail if settings.debug else "서버 내부 오류가 발생했습니다.",
            "path": str(request.url.path),
            "hint": "백엔드 서버를 재시작하면 해결될 수 있습니다." if "데이터베이스" in error_detail else None
        }
    )

# 시작 이벤트 핸들러
@app.on_event("startup")
async def startup_event():
    """서버 시작 시 실행"""
    logger.info("=" * 60)
    logger.info("ARWay Lite API 서버 시작")
    logger.info(f"버전: 0.1.0")
    logger.info(f"디버그 모드: {settings.debug}")
    logger.info(f"로깅 레벨: {settings.log_level}")
    
    masked_url = settings.database_url[:50] + "..." if len(settings.database_url) > 50 else settings.database_url
    logger.info(f"데이터베이스: {masked_url}")
    logger.info(f"CORS Origins: {', '.join(settings.cors_origins_list)}")
    logger.info("=" * 60)

# 종료 이벤트 핸들러
@app.on_event("shutdown")
async def shutdown_event():
    """서버 종료 시 실행"""
    logger.info("ARWay Lite API 서버 종료")

@app.get("/health")
async def health_check():
    """헬스 체크 - 데이터베이스 연결 확인 포함"""
    try:
        import psycopg2
        from app.config import settings
        
        # psycopg2로 직접 연결 (SQLAlchemy 우회)
        conn = psycopg2.connect(settings.database_url)
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return {
            "status": "healthy", 
            "database": "connected",
            "version": "0.1.0",
            "result": result[0] if result else None
        }
    except Exception as e:
        error_detail = str(e)
        logger.error(f"Health check failed: {error_detail}")
        
        # DNS 오류인 경우 더 명확한 메시지 제공
        if "could not translate host name" in error_detail or "Name or service not known" in error_detail:
            error_detail = "데이터베이스 호스트를 찾을 수 없습니다. 네트워크 연결을 확인하거나 백엔드 서버를 재시작해주세요."
        
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy", 
                "database": "disconnected", 
                "error": error_detail,
                "hint": "백엔드 서버를 재시작하면 해결될 수 있습니다.",
                "version": "0.1.0"
            }
        )

