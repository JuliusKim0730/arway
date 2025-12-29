from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base


class Landmark(Base):
    __tablename__ = "landmarks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    indoor_map_id = Column(UUID(as_uuid=True), ForeignKey("indoor_maps.id"), nullable=True)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("indoor_zones.id"), nullable=True)
    name = Column(String, nullable=False)
    landmark_type = Column(String(50), nullable=False)  # 'entrance', 'escalator', 'elevator', 'sign', 'column'
    position_x = Column(Numeric(10, 2), nullable=False)
    position_y = Column(Numeric(10, 2), nullable=False)
    floor = Column(Integer, nullable=False)
    heading = Column(Numeric(5, 2), nullable=True)  # 0-360도
    features = Column(JSONB, nullable=True)  # 특징 벡터
    landmark_metadata = Column(JSONB, nullable=True)  # metadata는 SQLAlchemy 예약어이므로 landmark_metadata로 변경
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    indoor_map = relationship("IndoorMap", back_populates="landmarks")
    zone = relationship("IndoorZone", back_populates="landmarks")

