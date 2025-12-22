from pydantic import BaseModel, field_serializer
from decimal import Decimal
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.schemas.destination import DestinationResponse

class SessionCreate(BaseModel):
    user_id: UUID
    destination_id: Optional[UUID] = None  # 기존 destination ID (선택사항)
    place_id: Optional[str] = None  # Google Places API place_id (선택사항)
    place_name: Optional[str] = None  # 장소 이름
    place_address: Optional[str] = None  # 장소 주소
    destination_latitude: Optional[Decimal] = None  # 목적지 위도
    destination_longitude: Optional[Decimal] = None  # 목적지 경도
    start_latitude: Decimal
    start_longitude: Decimal

class SessionUpdate(BaseModel):
    end_latitude: Optional[Decimal] = None
    end_longitude: Optional[Decimal] = None
    status: Optional[str] = None
    total_distance: Optional[Decimal] = None

class SessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    destination_id: UUID
    start_latitude: Optional[Decimal]
    start_longitude: Optional[Decimal]
    end_latitude: Optional[Decimal]
    end_longitude: Optional[Decimal]
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    total_distance: Optional[Decimal]
    destination: Optional[DestinationResponse] = None
    
    @field_serializer('start_latitude', 'start_longitude', 'end_latitude', 'end_longitude', 'total_distance')
    def serialize_decimal(self, value: Optional[Decimal]) -> Optional[float]:
        """Decimal을 float로 직렬화"""
        return float(value) if value is not None else None
    
    class Config:
        from_attributes = True

