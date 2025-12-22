from pydantic import BaseModel, field_serializer
from decimal import Decimal
from uuid import UUID
from typing import Optional
from datetime import datetime

class DestinationBase(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: Decimal
    longitude: Decimal
    address: Optional[str] = None
    is_active: bool = True
    
    @field_serializer('latitude', 'longitude')
    def serialize_decimal(self, value: Decimal) -> float:
        """Decimal을 float로 직렬화"""
        return float(value)

class DestinationCreate(DestinationBase):
    created_by: UUID

class DestinationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None

class DestinationResponse(DestinationBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

