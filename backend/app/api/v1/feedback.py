from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models
from app.schemas import feedback

router = APIRouter()

@router.post("/", response_model=feedback.FeedbackResponse)
def create_feedback(
    feedback_data: feedback.FeedbackCreate,
    db: Session = Depends(get_db)
):
    """피드백 생성"""
    db_feedback = models.Feedback(**feedback_data.dict())
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

@router.get("/session/{session_id}", response_model=List[feedback.FeedbackResponse])
def get_session_feedback(session_id: str, db: Session = Depends(get_db)):
    """세션별 피드백 조회"""
    feedbacks = db.query(models.Feedback).filter(
        models.Feedback.session_id == session_id
    ).all()
    return feedbacks

