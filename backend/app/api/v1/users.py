from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas import user

router = APIRouter()

@router.post("/", response_model=user.UserResponse)
def create_or_get_user(
    user_data: user.UserCreate,
    db: Session = Depends(get_db)
):
    """사용자 생성 또는 조회 (이메일 기준)"""
    # 기존 사용자 조회
    existing_user = db.query(models.User).filter(
        models.User.email == user_data.email
    ).first()
    
    if existing_user:
        return existing_user
    
    # 새 사용자 생성
    db_user = models.User(**user_data.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/{user_id}", response_model=user.UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    """사용자 조회"""
    db_user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

