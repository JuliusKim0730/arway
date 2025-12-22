from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app import models
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Any

router = APIRouter()

class AnalyticsEventCreate(BaseModel):
    session_id: UUID
    event_type: str
    event_data: Optional[dict[str, Any]] = None

class AnalyticsEventResponse(BaseModel):
    id: UUID
    session_id: UUID
    event_type: str
    event_data: Optional[dict[str, Any]]
    recorded_at: datetime
    
    class Config:
        from_attributes = True

class StatsResponse(BaseModel):
    totalSessions: int
    activeSessions: int
    completedSessions: int
    averageRating: float

@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    """관리자 대시보드 통계 조회"""
    # 전체 세션 수
    total_sessions = db.query(func.count(models.NavigationSession.id)).scalar() or 0
    
    # 활성 세션 수
    active_sessions = db.query(func.count(models.NavigationSession.id)).filter(
        models.NavigationSession.status == models.SessionStatus.ACTIVE
    ).scalar() or 0
    
    # 완료된 세션 수
    completed_sessions = db.query(func.count(models.NavigationSession.id)).filter(
        models.NavigationSession.status == models.SessionStatus.COMPLETED
    ).scalar() or 0
    
    # 평균 평점 계산
    avg_rating_result = db.query(func.avg(models.Feedback.rating)).scalar()
    average_rating = float(avg_rating_result) if avg_rating_result else 0.0
    
    return StatsResponse(
        totalSessions=total_sessions,
        activeSessions=active_sessions,
        completedSessions=completed_sessions,
        averageRating=average_rating
    )

@router.post("/", response_model=AnalyticsEventResponse)
def create_analytics_event(
    event_data: AnalyticsEventCreate,
    db: Session = Depends(get_db)
):
    """분석 이벤트 생성"""
    db_event = models.AnalyticsEvent(**event_data.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.get("/session/{session_id}", response_model=List[AnalyticsEventResponse])
def get_session_events(session_id: str, db: Session = Depends(get_db)):
    """세션별 분석 이벤트 조회"""
    events = db.query(models.AnalyticsEvent).filter(
        models.AnalyticsEvent.session_id == session_id
    ).order_by(models.AnalyticsEvent.recorded_at).all()
    return events

