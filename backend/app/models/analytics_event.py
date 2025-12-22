from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base

class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("navigation_sessions.id"), nullable=False)
    event_type = Column(String, nullable=False)  # 'arrive', 'heading_update', 'distance_update'
    event_data = Column(JSONB)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("NavigationSession", backref="analytics_events")
    
    # Indexes
    __table_args__ = (
        Index('idx_analytics_session_type_time', 'session_id', 'event_type', 'recorded_at'),
    )

