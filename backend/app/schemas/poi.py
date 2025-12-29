from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime


class POIBase(BaseModel):
    name: str
    poi_type: str = Field(..., description="'store', 'restaurant', 'exhibit', 'restroom', 'exit', 'escalator', 'elevator', 'other'")
    address: Optional[str] = None
    description: Optional[str] = None
    priority: float = Field(0.5, ge=0, le=1)
    poi_metadata: Optional[Dict[str, Any]] = None  # metadata는 SQLAlchemy 예약어이므로 poi_metadata로 변경


class POICreate(POIBase):
    # 실외 POI
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    # 실내 POI
    indoor_map_id: Optional[UUID] = None
    zone_id: Optional[UUID] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    floor: Optional[int] = None
    
    features: Optional[Dict[str, Any]] = None
    created_by: Optional[UUID] = None


class POI(POIBase):
    id: UUID
    
    # 실외 POI
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    # 실내 POI
    indoor_map_id: Optional[UUID] = None
    zone_id: Optional[UUID] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    floor: Optional[int] = None
    
    features: Optional[Dict[str, Any]] = None
    poi_metadata: Optional[Dict[str, Any]] = None  # metadata는 SQLAlchemy 예약어이므로 poi_metadata로 변경
    is_active: bool
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

