-- SCQ Intelligence Layer를 위한 추가 테이블 생성 SQL
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- Geofences 테이블 (지오펜스/건물 경계)
CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('building', 'indoor_zone', 'outdoor_area')),
    building_id UUID, -- 건물 ID (선택적)
    floor INTEGER, -- 층 정보 (선택적)
    polygon JSONB NOT NULL, -- 폴리곤 좌표 배열 [{lat, lng}, ...]
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geofences_type ON geofences(type);
CREATE INDEX IF NOT EXISTS idx_geofences_building ON geofences(building_id);
CREATE INDEX IF NOT EXISTS idx_geofences_active ON geofences(is_active);

-- Geofence Entry Points 테이블 (진입점)
CREATE TABLE IF NOT EXISTS geofence_entry_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    geofence_id UUID NOT NULL REFERENCES geofences(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    floor INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entry_points_geofence ON geofence_entry_points(geofence_id);

-- Buildings 테이블 (건물 정보)
CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    floor_count INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buildings_location ON buildings(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_buildings_active ON buildings(is_active);

-- Indoor Maps 테이블 (실내 맵)
CREATE TABLE IF NOT EXISTS indoor_maps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floor INTEGER NOT NULL,
    name VARCHAR(255),
    map_data JSONB NOT NULL, -- 맵 데이터 (zones, landmarks 등)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(building_id, floor)
);

CREATE INDEX IF NOT EXISTS idx_indoor_maps_building_floor ON indoor_maps(building_id, floor);
CREATE INDEX IF NOT EXISTS idx_indoor_maps_active ON indoor_maps(is_active);

-- Indoor Zones 테이블 (실내 구역)
CREATE TABLE IF NOT EXISTS indoor_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indoor_map_id UUID NOT NULL REFERENCES indoor_maps(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    zone_type VARCHAR(50), -- 'lobby', 'corridor', 'room', 'escalator', 'elevator' 등
    polygon JSONB NOT NULL, -- 폴리곤 좌표 배열 [{x, y}, ...]
    zone_metadata JSONB, -- 추가 메타데이터 (metadata는 SQLAlchemy 예약어이므로 zone_metadata로 변경)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zones_indoor_map ON indoor_zones(indoor_map_id);

-- Landmarks 테이블 (랜드마크)
CREATE TABLE IF NOT EXISTS landmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indoor_map_id UUID REFERENCES indoor_maps(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES indoor_zones(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    landmark_type VARCHAR(50) NOT NULL, -- 'entrance', 'escalator', 'elevator', 'sign', 'column' 등
    position_x NUMERIC(10, 2) NOT NULL, -- 실내 좌표 (미터)
    position_y NUMERIC(10, 2) NOT NULL,
    floor INTEGER NOT NULL,
    heading NUMERIC(5, 2), -- 방향 (0-360도)
    features JSONB, -- 특징 벡터 (선택적)
    landmark_metadata JSONB, -- 추가 메타데이터 (metadata는 SQLAlchemy 예약어이므로 landmark_metadata로 변경)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_landmarks_indoor_map ON landmarks(indoor_map_id);
CREATE INDEX IF NOT EXISTS idx_landmarks_zone ON landmarks(zone_id);
CREATE INDEX IF NOT EXISTS idx_landmarks_type ON landmarks(landmark_type);
CREATE INDEX IF NOT EXISTS idx_landmarks_position ON landmarks(position_x, position_y, floor);

-- POIs 테이블 (Points of Interest) - destinations 확장 또는 별도 테이블
CREATE TABLE IF NOT EXISTS pois (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    poi_type VARCHAR(50) NOT NULL CHECK (poi_type IN ('store', 'restaurant', 'exhibit', 'restroom', 'exit', 'escalator', 'elevator', 'other')),
    -- 실외 POI
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    -- 실내 POI
    indoor_map_id UUID REFERENCES indoor_maps(id) ON DELETE SET NULL,
    zone_id UUID REFERENCES indoor_zones(id) ON DELETE SET NULL,
    position_x NUMERIC(10, 2),
    position_y NUMERIC(10, 2),
    floor INTEGER,
    -- 공통 필드
    address VARCHAR(500),
    description TEXT,
    priority NUMERIC(3, 2) DEFAULT 0.5 CHECK (priority >= 0 AND priority <= 1),
    features JSONB, -- 특징 벡터 (선택적)
    poi_metadata JSONB, -- 추가 메타데이터 (영업시간, 전화번호 등) (metadata는 SQLAlchemy 예약어이므로 poi_metadata로 변경)
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- 실외 또는 실내 중 하나는 필수
    CHECK (
        (latitude IS NOT NULL AND longitude IS NOT NULL) OR
        (indoor_map_id IS NOT NULL AND position_x IS NOT NULL AND position_y IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_pois_type ON pois(poi_type);
CREATE INDEX IF NOT EXISTS idx_pois_indoor_map ON pois(indoor_map_id);
CREATE INDEX IF NOT EXISTS idx_pois_zone ON pois(zone_id);
CREATE INDEX IF NOT EXISTS idx_pois_location ON pois(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_pois_indoor_position ON pois(position_x, position_y, floor);
CREATE INDEX IF NOT EXISTS idx_pois_active ON pois(is_active);
CREATE INDEX IF NOT EXISTS idx_pois_priority ON pois(priority DESC);

-- Updated_at 트리거 추가
DROP TRIGGER IF EXISTS update_geofences_updated_at ON geofences;
CREATE TRIGGER update_geofences_updated_at BEFORE UPDATE ON geofences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_buildings_updated_at ON buildings;
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_indoor_maps_updated_at ON indoor_maps;
CREATE TRIGGER update_indoor_maps_updated_at BEFORE UPDATE ON indoor_maps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_landmarks_updated_at ON landmarks;
CREATE TRIGGER update_landmarks_updated_at BEFORE UPDATE ON landmarks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pois_updated_at ON pois;
CREATE TRIGGER update_pois_updated_at BEFORE UPDATE ON pois
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE 'SCQ Intelligence Layer 테이블이 성공적으로 생성되었습니다!';
END $$;

