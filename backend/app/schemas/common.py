from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from decimal import Decimal

class TimestampMixin(BaseModel):
    created_at: datetime
    updated_at: datetime

class LocationBase(BaseModel):
    latitude: Decimal
    longitude: Decimal

