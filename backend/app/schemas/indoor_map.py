from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


class IndoorZoneBase(BaseModel):
    name: str
    zone_type: Optional[str] = None
    polygon: List[dict] = Field(..., description="폴리곤 좌표 배열 [{x, y}, ...]")
    zone_metadata: Optional[Dict[str, Any]] = None  # metadata는 SQLAlchemy 예약어이므로 zone_metadata로 변경


class IndoorZone(IndoorZoneBase):
    id: UUID
    indoor_map_id: UUID
    created_at: datetime
    zone_metadata: Optional[Dict[str, Any]] = None  # metadata는 SQLAlchemy 예약어이므로 zone_metadata로 변경
    
    class Config:
        from_attributes = True


class LandmarkBase(BaseModel):
    name: str
    landmark_type: str
    position_x: float
    position_y: float
    floor: int
    heading: Optional[float] = None
    features: Optional[Dict[str, Any]] = None
    landmark_metadata: Optional[Dict[str, Any]] = None  # metadata는 SQLAlchemy 예약어이므로 landmark_metadata로 변경


class Landmark(LandmarkBase):
    id: UUID
    indoor_map_id: Optional[UUID] = None
    zone_id: Optional[UUID] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    landmark_metadata: Optional[Dict[str, Any]] = None  # metadata는 SQLAlchemy 예약어이므로 landmark_metadata로 변경
    
    class Config:
        from_attributes = True


class IndoorMapBase(BaseModel):
    building_id: UUID
    floor: int
    name: Optional[str] = None
    map_data: Dict[str, Any] = Field(..., description="맵 데이터 (zones, landmarks 등)")


class IndoorMap(IndoorMapBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class IndoorMapDetail(IndoorMap):
    zones: List[IndoorZone] = []
    landmarks: List[Landmark] = []

