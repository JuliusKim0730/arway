from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, CheckConstraint, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base


class Geofence(Base):
    __tablename__ = "geofences"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    type = Column(String(50), nullable=False)  # 'building', 'indoor_zone', 'outdoor_area'
    building_id = Column(UUID(as_uuid=True), ForeignKey("buildings.id"), nullable=True)
    floor = Column(Integer, nullable=True)
    polygon = Column(JSONB, nullable=False)  # [{lat, lng}, ...]
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    building = relationship("Building", backref="geofences")
    entry_points = relationship("GeofenceEntryPoint", back_populates="geofence", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint("type IN ('building', 'indoor_zone', 'outdoor_area')", name="check_geofence_type"),
    )


class GeofenceEntryPoint(Base):
    __tablename__ = "geofence_entry_points"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    geofence_id = Column(UUID(as_uuid=True), ForeignKey("geofences.id"), nullable=False)
    name = Column(String, nullable=False)
    latitude = Column(String, nullable=False)  # Numeric 대신 String으로 저장 (JSONB 호환)
    longitude = Column(String, nullable=False)
    floor = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    geofence = relationship("Geofence", back_populates="entry_points")

