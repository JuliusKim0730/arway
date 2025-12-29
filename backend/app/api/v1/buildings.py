"""
Buildings API 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
from app.database import get_db
from app import models

router = APIRouter()


@router.get("/", response_model=List[dict])
def get_buildings(
    lat: Optional[float] = Query(None, description="위도 (근처 건물 검색)"),
    lng: Optional[float] = Query(None, description="경도 (근처 건물 검색)"),
    radius: Optional[float] = Query(1000, description="검색 반경 (미터)", ge=0, le=10000),
    db: Session = Depends(get_db)
):
    """건물 목록 조회"""
    query = db.query(models.Building).filter(models.Building.is_active == True)
    
    buildings = query.all()
    
    # 위치 기반 필터링
    if lat is not None and lng is not None:
        filtered_buildings = []
        for building in buildings:
            distance = _calculate_distance(lat, lng, float(building.latitude), float(building.longitude))
            if distance <= radius:
                filtered_buildings.append({
                    "id": str(building.id),
                    "name": building.name,
                    "address": building.address,
                    "latitude": float(building.latitude),
                    "longitude": float(building.longitude),
                    "floor_count": building.floor_count,
                })
        return filtered_buildings
    
    return [
        {
            "id": str(building.id),
            "name": building.name,
            "address": building.address,
            "latitude": float(building.latitude),
            "longitude": float(building.longitude),
            "floor_count": building.floor_count,
        }
        for building in buildings
    ]


@router.get("/{building_id}", response_model=dict)
def get_building(building_id: UUID, db: Session = Depends(get_db)):
    """건물 상세 조회"""
    building = db.query(models.Building).filter(models.Building.id == building_id).first()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    
    return {
        "id": str(building.id),
        "name": building.name,
        "address": building.address,
        "latitude": float(building.latitude),
        "longitude": float(building.longitude),
        "floor_count": building.floor_count,
    }


def _calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """두 지점 간 거리 계산 (미터)"""
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371e3
    φ1 = radians(lat1)
    φ2 = radians(lat2)
    Δφ = radians(lat2 - lat1)
    Δλ = radians(lng2 - lng1)
    
    a = sin(Δφ / 2) ** 2 + cos(φ1) * cos(φ2) * sin(Δλ / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    return R * c

