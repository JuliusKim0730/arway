"""
SCQ Intelligence Layer 테스트 데이터 생성 스크립트
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import Building, Geofence, GeofenceEntryPoint, IndoorMap, IndoorZone, Landmark, POI, User
import uuid

def seed_scq_data():
    """SCQ 테스트 데이터 생성"""
    db: Session = SessionLocal()
    
    try:
        print("🌱 SCQ 테스트 데이터 생성 시작...")
        
        # 1. 테스트 사용자 생성 또는 조회
        test_user = db.query(User).filter(User.email == "test@arway.com").first()
        if not test_user:
            test_user = User(
                id=uuid.uuid4(),
                email="test@arway.com",
                name="Test User",
            )
            db.add(test_user)
            db.commit()
            print("✅ 테스트 사용자 생성 완료")
        else:
            print("ℹ️ 테스트 사용자 이미 존재")
        
        # 2. 건물 생성 (예: 강남역 근처 백화점)
        building = db.query(Building).filter(Building.name == "테스트 백화점").first()
        if not building:
            building = Building(
                id=uuid.uuid4(),
                name="테스트 백화점",
                address="서울특별시 강남구 테헤란로",
                latitude=37.4979,
                longitude=127.0276,
                floor_count=5,
                is_active=True,
            )
            db.add(building)
            db.commit()
            print(f"✅ 건물 생성 완료: {building.name} (ID: {building.id})")
        else:
            print(f"ℹ️ 건물 이미 존재: {building.name}")
        
        # 3. 지오펜스 생성 (건물 경계)
        geofence = db.query(Geofence).filter(Geofence.name == "테스트 백화점 지오펜스").first()
        if not geofence:
            geofence = Geofence(
                id=uuid.uuid4(),
                name="테스트 백화점 지오펜스",
                type="building",
                building_id=building.id,
                floor=None,
                polygon=[
                    {"lat": 37.4975, "lng": 127.0270},
                    {"lat": 37.4985, "lng": 127.0270},
                    {"lat": 37.4985, "lng": 127.0285},
                    {"lat": 37.4975, "lng": 127.0285},
                ],
                is_active=True,
            )
            db.add(geofence)
            db.commit()
            print(f"✅ 지오펜스 생성 완료: {geofence.name}")
            
            # 진입점 생성
            entry_point = GeofenceEntryPoint(
                id=uuid.uuid4(),
                geofence_id=geofence.id,
                name="정문",
                latitude=str(37.4979),
                longitude=str(127.0276),
                floor=None,
            )
            db.add(entry_point)
            db.commit()
            print(f"✅ 진입점 생성 완료: {entry_point.name}")
        else:
            print(f"ℹ️ 지오펜스 이미 존재: {geofence.name}")
        
        # 4. 실내 맵 생성 (1층)
        indoor_map = db.query(IndoorMap).filter(
            IndoorMap.building_id == building.id,
            IndoorMap.floor == 1
        ).first()
        
        if not indoor_map:
            indoor_map = IndoorMap(
                id=uuid.uuid4(),
                building_id=building.id,
                floor=1,
                name="1층",
                map_data={
                    "zones": [],
                    "landmarks": [],
                },
                is_active=True,
            )
            db.add(indoor_map)
            db.commit()
            print(f"✅ 실내 맵 생성 완료: {indoor_map.name} (건물: {building.name})")
            
            # 실내 구역 생성 (로비)
            zone = IndoorZone(
                id=uuid.uuid4(),
                indoor_map_id=indoor_map.id,
                name="1층 로비",
                zone_type="lobby",
                polygon=[
                    {"x": 0, "y": 0},
                    {"x": 50, "y": 0},
                    {"x": 50, "y": 30},
                    {"x": 0, "y": 30},
                ],
                zone_metadata={"description": "메인 로비"},
            )
            db.add(zone)
            db.commit()
            print(f"✅ 실내 구역 생성 완료: {zone.name}")
            
            # 랜드마크 생성 (에스컬레이터)
            landmark = Landmark(
                id=uuid.uuid4(),
                indoor_map_id=indoor_map.id,
                zone_id=zone.id,
                name="에스컬레이터",
                landmark_type="escalator",
                position_x=25.0,
                position_y=15.0,
                floor=1,
                heading=90.0,
                is_active=True,
            )
            db.add(landmark)
            db.commit()
            print(f"✅ 랜드마크 생성 완료: {landmark.name}")
        else:
            print(f"ℹ️ 실내 맵 이미 존재: {indoor_map.name}")
            zone = db.query(IndoorZone).filter(IndoorZone.indoor_map_id == indoor_map.id).first()
        
        # 5. POI 생성 (실내)
        if zone:
            existing_pois = db.query(POI).filter(POI.indoor_map_id == indoor_map.id).count()
            if existing_pois == 0:
                pois_data = [
                    {
                        "name": "스타벅스",
                        "poi_type": "restaurant",
                        "position_x": 10.0,
                        "position_y": 10.0,
                        "floor": 1,
                        "priority": 0.8,
                        "poi_metadata": {"hours": "09:00-22:00"},
                    },
                    {
                        "name": "화장실",
                        "poi_type": "restroom",
                        "position_x": 40.0,
                        "position_y": 5.0,
                        "floor": 1,
                        "priority": 0.6,
                    },
                    {
                        "name": "엘리베이터",
                        "poi_type": "elevator",
                        "position_x": 30.0,
                        "position_y": 20.0,
                        "floor": 1,
                        "priority": 0.7,
                    },
                ]
                
                for poi_data in pois_data:
                    poi = POI(
                        id=uuid.uuid4(),
                        name=poi_data["name"],
                        poi_type=poi_data["poi_type"],
                        indoor_map_id=indoor_map.id,
                        zone_id=zone.id,
                        position_x=poi_data["position_x"],
                        position_y=poi_data["position_y"],
                        floor=poi_data["floor"],
                        priority=poi_data["priority"],
                        poi_metadata=poi_data.get("poi_metadata"),
                        is_active=True,
                        created_by=test_user.id,
                    )
                    db.add(poi)
                
                db.commit()
                print(f"✅ POI {len(pois_data)}개 생성 완료")
            else:
                print(f"ℹ️ POI 이미 존재 ({existing_pois}개)")
        
        # 6. 실외 POI 생성 (건물 근처)
        outdoor_pois_count = db.query(POI).filter(
            POI.latitude.isnot(None),
            POI.longitude.isnot(None)
        ).count()
        
        if outdoor_pois_count == 0:
            outdoor_pois_data = [
                {
                    "name": "강남역",
                    "poi_type": "other",
                    "latitude": 37.4980,
                    "longitude": 127.0278,
                    "priority": 0.9,
                    "address": "서울특별시 강남구 테헤란로",
                },
                {
                    "name": "편의점",
                    "poi_type": "store",
                    "latitude": 37.4975,
                    "longitude": 127.0275,
                    "priority": 0.5,
                },
            ]
            
            for poi_data in outdoor_pois_data:
                poi = POI(
                    id=uuid.uuid4(),
                    name=poi_data["name"],
                    poi_type=poi_data["poi_type"],
                    latitude=poi_data["latitude"],
                    longitude=poi_data["longitude"],
                    address=poi_data.get("address"),
                    priority=poi_data["priority"],
                    is_active=True,
                    created_by=test_user.id,
                )
                db.add(poi)
            
            db.commit()
            print(f"✅ 실외 POI {len(outdoor_pois_data)}개 생성 완료")
        else:
            print(f"ℹ️ 실외 POI 이미 존재 ({outdoor_pois_count}개)")
        
        print("\n✅ SCQ 테스트 데이터 생성 완료!")
        print(f"\n📊 생성된 데이터:")
        print(f"  - 건물: 1개")
        print(f"  - 지오펜스: 1개")
        print(f"  - 실내 맵: 1개")
        print(f"  - 실내 구역: 1개")
        print(f"  - 랜드마크: 1개")
        print(f"  - 실내 POI: {db.query(POI).filter(POI.indoor_map_id.isnot(None)).count()}개")
        print(f"  - 실외 POI: {db.query(POI).filter(POI.latitude.isnot(None)).count()}개")
        
    except Exception as e:
        db.rollback()
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed_scq_data()

