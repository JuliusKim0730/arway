from pydantic import BaseModel
from decimal import Decimal
from uuid import UUID
from datetime import datetime
from typing import Optional

class NavigationPointCreate(BaseModel):
    session_id: UUID
    latitude: Decimal
    longitude: Decimal
    heading: Optional[Decimal] = None
    accuracy: Optional[Decimal] = None
    distance_to_target: Optional[Decimal] = None
    bearing: Optional[Decimal] = None
    relative_angle: Optional[Decimal] = None

class NavigationPointResponse(BaseModel):
    id: UUID
    session_id: UUID
    latitude: Decimal
    longitude: Decimal
    heading: Optional[Decimal]
    accuracy: Optional[Decimal]
    distance_to_target: Optional[Decimal]
    bearing: Optional[Decimal]
    relative_angle: Optional[Decimal]
    recorded_at: datetime
    
    class Config:
        from_attributes = True

