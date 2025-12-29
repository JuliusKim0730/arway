"""
Geofences API 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
from app.database import get_db
from app import models
from app.schemas import geofence as geofence_schema

router = APIRouter()


@router.get("/", response_model=List[geofence_schema.Geofence])
def get_geofences(
    lat: Optional[float] = Query(None, description="위도 (근처 지오펜스 검색)"),
    lng: Optional[float] = Query(None, description="경도 (근처 지오펜스 검색)"),
    radius: Optional[float] = Query(1000, description="검색 반경 (미터)", ge=0, le=10000),
    geofence_type: Optional[str] = Query(None, description="지오펜스 타입 필터"),
    building_id: Optional[UUID] = Query(None, description="건물 ID 필터"),
    db: Session = Depends(get_db)
):
    """
    지오펜스 목록 조회
    
    - lat, lng가 제공되면 근처 지오펜스 검색
    - geofence_type으로 필터링 가능
    """
    query = db.query(models.Geofence).filter(models.Geofence.is_active == True)
    
    if geofence_type:
        query = query.filter(models.Geofence.type == geofence_type)
    
    if building_id:
        query = query.filter(models.Geofence.building_id == building_id)
    
    geofences = query.all()
    
    # 위치 기반 필터링 (간단한 구현)
    if lat is not None and lng is not None:
        filtered_geofences = []
        for geofence in geofences:
            polygon = geofence.polygon
            if polygon and isinstance(polygon, list):
                # 폴리곤의 중심점 계산
                center_lat = sum(p.get("lat", 0) for p in polygon) / len(polygon)
                center_lng = sum(p.get("lng", 0) for p in polygon) / len(polygon)
                
                # 거리 계산 (간단한 하버사인 공식)
                distance = _calculate_distance(lat, lng, center_lat, center_lng)
                if distance <= radius:
                    filtered_geofences.append(geofence)
        geofences = filtered_geofences
    
    return geofences


@router.get("/{geofence_id}", response_model=geofence_schema.Geofence)
def get_geofence(geofence_id: UUID, db: Session = Depends(get_db)):
    """지오펜스 상세 조회"""
    geofence = db.query(models.Geofence).filter(models.Geofence.id == geofence_id).first()
    if not geofence:
        raise HTTPException(status_code=404, detail="Geofence not found")
    return geofence


def _calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """두 지점 간 거리 계산 (미터)"""
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371e3  # 지구 반지름 (미터)
    φ1 = radians(lat1)
    φ2 = radians(lat2)
    Δφ = radians(lat2 - lat1)
    Δλ = radians(lng2 - lng1)
    
    a = sin(Δφ / 2) ** 2 + cos(φ1) * cos(φ2) * sin(Δλ / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    return R * c

