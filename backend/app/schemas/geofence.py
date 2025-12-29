from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class GeofenceEntryPointBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    floor: Optional[int] = None


class GeofenceEntryPoint(GeofenceEntryPointBase):
    id: UUID
    geofence_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class GeofenceBase(BaseModel):
    name: str
    type: str = Field(..., description="'building', 'indoor_zone', 'outdoor_area'")
    building_id: Optional[UUID] = None
    floor: Optional[int] = None
    polygon: List[dict] = Field(..., description="폴리곤 좌표 배열 [{lat, lng}, ...]")


class GeofenceCreate(GeofenceBase):
    entry_points: Optional[List[GeofenceEntryPointBase]] = None


class Geofence(GeofenceBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    entry_points: List[GeofenceEntryPoint] = []
    
    class Config:
        from_attributes = True

