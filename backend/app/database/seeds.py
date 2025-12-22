"""
초기 시드 데이터 생성 스크립트
"""
import sys
from pathlib import Path

# 상위 디렉토리를 경로에 추가 (스크립트로 직접 실행 시)
backend_dir = Path(__file__).parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal
from app.models.user import User
from app.models.destination import Destination
from decimal import Decimal

def seed_initial_data():
    """초기 데이터 생성"""
    try:
        # 새로운 세션 생성
        db = SessionLocal()
        
        # 테스트 사용자 생성
        test_user = db.query(User).filter(User.email == "test@arway.com").first()
        if not test_user:
            test_user = User(
                email="test@arway.com",
                name="Test User"
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"✅ 테스트 사용자 생성 완료: {test_user.email}")
        else:
            print(f"ℹ️ 테스트 사용자 이미 존재: {test_user.email}")

        # 테스트 목적지 생성
        destinations_data = [
            {
                "name": "테스트 목적지 1",
                "description": "회사 앞 카페",
                "latitude": Decimal("37.511"),
                "longitude": Decimal("127.029"),
                "address": "서울시 강남구",
            },
            {
                "name": "테스트 목적지 2",
                "description": "역 출구",
                "latitude": Decimal("37.5561"),
                "longitude": Decimal("126.9723"),
                "address": "서울시 중구",
            },
        ]

        for dest_data in destinations_data:
            existing = db.query(Destination).filter(
                Destination.name == dest_data["name"]
            ).first()
            
            if not existing:
                destination = Destination(
                    **dest_data,
                    created_by=test_user.id,
                    is_active=True
                )
                db.add(destination)
                print(f"✅ 목적지 생성 완료: {destination.name}")
            else:
                print(f"ℹ️ 목적지 이미 존재: {dest_data['name']}")

        db.commit()
        print("\n✅ 시드 데이터 생성 완료!")
        
    except Exception as e:
        print(f"❌ 시드 데이터 생성 실패: {e}")
        if 'db' in locals():
            db.rollback()
        raise
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    seed_initial_data()

