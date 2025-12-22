from pydantic import BaseModel
from typing import Optional

class SyncUserRequest(BaseModel):
    google_id: str
    email: str
    name: str
    avatar_url: Optional[str] = None

