from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.schemas.destination import DestinationResponse


class FavoriteBase(BaseModel):
    user_id: UUID
    destination_id: UUID


class FavoriteCreate(FavoriteBase):
    pass


class FavoriteResponse(FavoriteBase):
    id: UUID
    created_at: datetime
    destination: Optional[DestinationResponse] = None
    
    class Config:
        from_attributes = True

