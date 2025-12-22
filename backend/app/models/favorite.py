from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base


class Favorite(Base):
    __tablename__ = "favorites"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    destination_id = Column(UUID(as_uuid=True), ForeignKey("destinations.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="favorites")
    destination = relationship("Destination", backref="favorited_by")
    
    # Unique constraint: 한 사용자는 같은 목적지를 한 번만 즐겨찾기 할 수 있음
    __table_args__ = (
        UniqueConstraint('user_id', 'destination_id', name='unique_user_destination'),
    )

