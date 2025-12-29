"""
Indoor Maps API 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
from app.database import get_db
from app import models
from app.schemas import indoor_map as indoor_map_schema

router = APIRouter()


@router.get("/", response_model=List[indoor_map_schema.IndoorMap])
def get_indoor_maps(
    building_id: Optional[UUID] = Query(None, description="건물 ID 필터"),
    floor: Optional[int] = Query(None, description="층 필터"),
    db: Session = Depends(get_db)
):
    """실내 맵 목록 조회"""
    query = db.query(models.IndoorMap).filter(models.IndoorMap.is_active == True)
    
    if building_id:
        query = query.filter(models.IndoorMap.building_id == building_id)
    
    if floor is not None:
        query = query.filter(models.IndoorMap.floor == floor)
    
    return query.all()


@router.get("/{indoor_map_id}", response_model=indoor_map_schema.IndoorMapDetail)
def get_indoor_map(indoor_map_id: UUID, db: Session = Depends(get_db)):
    """실내 맵 상세 조회 (zones, landmarks 포함)"""
    indoor_map = db.query(models.IndoorMap).filter(models.IndoorMap.id == indoor_map_id).first()
    if not indoor_map:
        raise HTTPException(status_code=404, detail="Indoor map not found")
    return indoor_map


@router.get("/building/{building_id}", response_model=List[indoor_map_schema.IndoorMap])
def get_indoor_maps_by_building(building_id: UUID, db: Session = Depends(get_db)):
    """건물별 실내 맵 목록 조회"""
    return db.query(models.IndoorMap).filter(
        models.IndoorMap.building_id == building_id,
        models.IndoorMap.is_active == True
    ).all()

