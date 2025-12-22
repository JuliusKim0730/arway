from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models
from app.schemas import navigation_point

router = APIRouter()

@router.post("/", response_model=navigation_point.NavigationPointResponse)
def create_navigation_point(
    point_data: navigation_point.NavigationPointCreate,
    db: Session = Depends(get_db)
):
    """네비게이션 포인트 생성"""
    db_point = models.NavigationPoint(**point_data.dict())
    db.add(db_point)
    db.commit()
    db.refresh(db_point)
    return db_point

@router.get("/session/{session_id}", response_model=List[navigation_point.NavigationPointResponse])
def get_session_points(session_id: str, db: Session = Depends(get_db)):
    """세션별 네비게이션 포인트 조회"""
    points = db.query(models.NavigationPoint).filter(
        models.NavigationPoint.session_id == session_id
    ).order_by(models.NavigationPoint.recorded_at).all()
    return points

