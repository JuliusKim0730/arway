from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from uuid import UUID
from app.database import get_db
from app import models
from app.schemas import favorite

router = APIRouter()


@router.post("/", response_model=favorite.FavoriteResponse)
def create_favorite(
    favorite_data: favorite.FavoriteCreate,
    db: Session = Depends(get_db)
):
    """즐겨찾기 추가"""
    # 중복 확인
    existing = db.query(models.Favorite).filter(
        and_(
            models.Favorite.user_id == favorite_data.user_id,
            models.Favorite.destination_id == favorite_data.destination_id
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="이미 즐겨찾기에 추가된 목적지입니다."
        )
    
    # 사용자 존재 확인
    user = db.query(models.User).filter(
        models.User.id == favorite_data.user_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 목적지 존재 확인
    destination = db.query(models.Destination).filter(
        models.Destination.id == favorite_data.destination_id
    ).first()
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found")
    
    # 즐겨찾기 생성
    db_favorite = models.Favorite(**favorite_data.dict())
    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)
    
    # 목적지 정보 포함하여 반환
    db_favorite.destination = destination
    return db_favorite


@router.delete("/{favorite_id}")
def delete_favorite(
    favorite_id: UUID,
    db: Session = Depends(get_db)
):
    """즐겨찾기 제거 (ID로)"""
    db_favorite = db.query(models.Favorite).filter(
        models.Favorite.id == favorite_id
    ).first()
    
    if not db_favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    db.delete(db_favorite)
    db.commit()
    return {"message": "즐겨찾기가 제거되었습니다."}


@router.delete("/user/{user_id}/destination/{destination_id}")
def delete_favorite_by_user_destination(
    user_id: UUID,
    destination_id: UUID,
    db: Session = Depends(get_db)
):
    """즐겨찾기 제거 (사용자 ID와 목적지 ID로)"""
    db_favorite = db.query(models.Favorite).filter(
        and_(
            models.Favorite.user_id == user_id,
            models.Favorite.destination_id == destination_id
        )
    ).first()
    
    if not db_favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    db.delete(db_favorite)
    db.commit()
    return {"message": "즐겨찾기가 제거되었습니다."}


@router.get("/user/{user_id}", response_model=List[favorite.FavoriteResponse])
def get_user_favorites(
    user_id: UUID,
    db: Session = Depends(get_db)
):
    """사용자의 즐겨찾기 목록 조회"""
    favorites = db.query(models.Favorite).filter(
        models.Favorite.user_id == user_id
    ).all()
    
    # 각 즐겨찾기에 목적지 정보 포함
    for fav in favorites:
        fav.destination = db.query(models.Destination).filter(
            models.Destination.id == fav.destination_id
        ).first()
    
    return favorites


@router.get("/user/{user_id}/destination/{destination_id}", response_model=favorite.FavoriteResponse)
def check_favorite(
    user_id: UUID,
    destination_id: UUID,
    db: Session = Depends(get_db)
):
    """특정 목적지가 즐겨찾기에 있는지 확인"""
    db_favorite = db.query(models.Favorite).filter(
        and_(
            models.Favorite.user_id == user_id,
            models.Favorite.destination_id == destination_id
        )
    ).first()
    
    if not db_favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    # 목적지 정보 포함
    db_favorite.destination = db.query(models.Destination).filter(
        models.Destination.id == destination_id
    ).first()
    
    return db_favorite

