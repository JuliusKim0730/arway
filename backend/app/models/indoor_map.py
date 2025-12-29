from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base


class IndoorMap(Base):
    __tablename__ = "indoor_maps"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    building_id = Column(UUID(as_uuid=True), ForeignKey("buildings.id"), nullable=False)
    floor = Column(Integer, nullable=False)
    name = Column(String, nullable=True)
    map_data = Column(JSONB, nullable=False)  # {zones: [...], landmarks: [...]}
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    building = relationship("Building", backref="indoor_maps")
    zones = relationship("IndoorZone", back_populates="indoor_map", cascade="all, delete-orphan")
    landmarks = relationship("Landmark", back_populates="indoor_map", cascade="all, delete-orphan")
    pois = relationship("POI", back_populates="indoor_map")
    
    __table_args__ = (
        UniqueConstraint('building_id', 'floor', name='unique_building_floor'),
    )


class IndoorZone(Base):
    __tablename__ = "indoor_zones"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    indoor_map_id = Column(UUID(as_uuid=True), ForeignKey("indoor_maps.id"), nullable=False)
    name = Column(String, nullable=False)
    zone_type = Column(String(50), nullable=True)  # 'lobby', 'corridor', 'room', etc.
    polygon = Column(JSONB, nullable=False)  # [{x, y}, ...]
    zone_metadata = Column(JSONB, nullable=True)  # metadata는 SQLAlchemy 예약어이므로 zone_metadata로 변경
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    indoor_map = relationship("IndoorMap", back_populates="zones")
    landmarks = relationship("Landmark", back_populates="zone")
    pois = relationship("POI", back_populates="zone")

