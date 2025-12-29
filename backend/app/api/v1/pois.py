"""
POIs API 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
from app.database import get_db
from app import models
from app.schemas import poi as poi_schema

router = APIRouter()


@router.get("/", response_model=List[poi_schema.POI])
def get_pois(
    lat: Optional[float] = Query(None, description="위도 (근처 POI 검색)"),
    lng: Optional[float] = Query(None, description="경도 (근처 POI 검색)"),
    radius: Optional[float] = Query(100, description="검색 반경 (미터)", ge=0, le=1000),
    poi_type: Optional[str] = Query(None, description="POI 타입 필터"),
    indoor_map_id: Optional[UUID] = Query(None, description="실내 맵 ID 필터"),
    zone_id: Optional[UUID] = Query(None, description="구역 ID 필터"),
    floor: Optional[int] = Query(None, description="층 필터"),
    min_priority: Optional[float] = Query(None, description="최소 우선순위", ge=0, le=1),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    POI 목록 조회
    
    - lat, lng가 제공되면 근처 POI 검색 (실외)
    - indoor_map_id, zone_id로 실내 POI 필터링
    """
    query = db.query(models.POI).filter(models.POI.is_active == True)
    
    if poi_type:
        query = query.filter(models.POI.poi_type == poi_type)
    
    if indoor_map_id:
        query = query.filter(models.POI.indoor_map_id == indoor_map_id)
    
    if zone_id:
        query = query.filter(models.POI.zone_id == zone_id)
    
    if floor is not None:
        query = query.filter(models.POI.floor == floor)
    
    if min_priority is not None:
        query = query.filter(models.POI.priority >= min_priority)
    
    # 위치 기반 필터링 (실외 POI)
    if lat is not None and lng is not None:
        query = query.filter(
            models.POI.latitude.isnot(None),
            models.POI.longitude.isnot(None)
        )
        pois = query.all()
        
        # 거리 기반 필터링
        filtered_pois = []
        for poi in pois:
            distance = _calculate_distance(lat, lng, float(poi.latitude), float(poi.longitude))
            if distance <= radius:
                filtered_pois.append(poi)
        
        # 우선순위 정렬
        filtered_pois.sort(key=lambda p: float(p.priority or 0), reverse=True)
        return filtered_pois[skip:skip + limit]
    
    # 실내 POI 또는 전체 조회
    query = query.order_by(models.POI.priority.desc())
    return query.offset(skip).limit(limit).all()


@router.get("/{poi_id}", response_model=poi_schema.POI)
def get_poi(poi_id: UUID, db: Session = Depends(get_db)):
    """POI 상세 조회"""
    poi = db.query(models.POI).filter(models.POI.id == poi_id).first()
    if not poi:
        raise HTTPException(status_code=404, detail="POI not found")
    return poi


@router.get("/indoor/{indoor_map_id}/nearby", response_model=List[poi_schema.POI])
def get_nearby_indoor_pois(
    indoor_map_id: UUID,
    x: float = Query(..., description="현재 X 좌표 (미터)"),
    y: float = Query(..., description="현재 Y 좌표 (미터)"),
    radius: float = Query(50, description="검색 반경 (미터)", ge=0, le=200),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """실내 POI 근처 검색"""
    pois = db.query(models.POI).filter(
        models.POI.indoor_map_id == indoor_map_id,
        models.POI.is_active == True,
        models.POI.position_x.isnot(None),
        models.POI.position_y.isnot(None)
    ).all()
    
    # 거리 기반 필터링 및 정렬
    nearby_pois = []
    for poi in pois:
        distance = ((float(poi.position_x) - x) ** 2 + (float(poi.position_y) - y) ** 2) ** 0.5
        if distance <= radius:
            nearby_pois.append((poi, distance))
    
    # 거리 순 정렬
    nearby_pois.sort(key=lambda p: p[1])
    
    return [poi for poi, _ in nearby_pois[:limit]]


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

