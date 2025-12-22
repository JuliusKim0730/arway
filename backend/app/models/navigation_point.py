from sqlalchemy import Column, Numeric, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base

class NavigationPoint(Base):
    __tablename__ = "navigation_points"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("navigation_sessions.id"), nullable=False)
    latitude = Column(Numeric(10, 8), nullable=False)
    longitude = Column(Numeric(11, 8), nullable=False)
    heading = Column(Numeric(5, 2))
    accuracy = Column(Numeric(5, 2))
    distance_to_target = Column(Numeric(10, 2))
    bearing = Column(Numeric(5, 2))
    relative_angle = Column(Numeric(5, 2))
    recorded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("NavigationSession", back_populates="navigation_points")
    
    # Indexes
    __table_args__ = (
        Index('idx_nav_points_session_time', 'session_id', 'recorded_at'),
    )

