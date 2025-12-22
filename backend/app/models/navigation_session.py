from sqlalchemy import Column, Numeric, DateTime, ForeignKey, Enum, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime
from app.database import Base

class SessionStatus(enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class NavigationSession(Base):
    __tablename__ = "navigation_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    destination_id = Column(UUID(as_uuid=True), ForeignKey("destinations.id"), nullable=False)
    start_latitude = Column(Numeric(10, 8))
    start_longitude = Column(Numeric(11, 8))
    end_latitude = Column(Numeric(10, 8))
    end_longitude = Column(Numeric(11, 8))
    status = Column(Enum(SessionStatus), default=SessionStatus.ACTIVE)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    total_distance = Column(Numeric(10, 2))
    
    # Relationships
    user = relationship("User", backref="sessions")
    destination = relationship("Destination", backref="sessions")
    navigation_points = relationship("NavigationPoint", back_populates="session", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_sessions_user_status', 'user_id', 'status'),
    )

