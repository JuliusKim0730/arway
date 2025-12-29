from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Numeric, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base


class POI(Base):
    __tablename__ = "pois"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    poi_type = Column(String(50), nullable=False)  # 'store', 'restaurant', 'exhibit', 'restroom', 'exit', etc.
    
    # 실외 POI
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)
    
    # 실내 POI
    indoor_map_id = Column(UUID(as_uuid=True), ForeignKey("indoor_maps.id"), nullable=True)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("indoor_zones.id"), nullable=True)
    position_x = Column(Numeric(10, 2), nullable=True)
    position_y = Column(Numeric(10, 2), nullable=True)
    floor = Column(Integer, nullable=True)
    
    # 공통 필드
    address = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    priority = Column(Numeric(3, 2), default=0.5)  # 0-1
    features = Column(JSONB, nullable=True)  # 특징 벡터
    poi_metadata = Column(JSONB, nullable=True)  # 영업시간, 전화번호 등 (metadata는 SQLAlchemy 예약어이므로 poi_metadata로 변경)
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    indoor_map = relationship("IndoorMap", back_populates="pois")
    zone = relationship("IndoorZone", back_populates="pois")
    creator = relationship("User", backref="pois")
    
    __table_args__ = (
        CheckConstraint(
            "(latitude IS NOT NULL AND longitude IS NOT NULL) OR "
            "(indoor_map_id IS NOT NULL AND position_x IS NOT NULL AND position_y IS NOT NULL)",
            name="check_poi_location"
        ),
        CheckConstraint("poi_type IN ('store', 'restaurant', 'exhibit', 'restroom', 'exit', 'escalator', 'elevator', 'other')", name="check_poi_type"),
        CheckConstraint("priority >= 0 AND priority <= 1", name="check_poi_priority"),
    )

