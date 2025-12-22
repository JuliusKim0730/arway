from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class FeedbackCreate(BaseModel):
    session_id: UUID
    user_id: UUID
    rating: int  # 1-5
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: UUID
    session_id: UUID
    user_id: UUID
    rating: int
    comment: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

