from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models
from app.schemas import session
from app.models.navigation_session import SessionStatus

router = APIRouter()

@router.get("/", response_model=List[session.SessionResponse])
def list_sessions(
    limit: Optional[int] = Query(10, ge=1, le=100),
    skip: Optional[int] = Query(0, ge=0),
    status: Optional[str] = None,
    user_id: Optional[str] = Query(None, description="사용자 ID로 필터링"),
    db: Session = Depends(get_db)
):
    """세션 목록 조회"""
    query = db.query(models.NavigationSession)
    
    # 사용자 ID로 필터링
    if user_id:
        query = query.filter(models.NavigationSession.user_id == user_id)
    
    if status:
        try:
            status_enum = SessionStatus[status.upper()]
            query = query.filter(models.NavigationSession.status == status_enum)
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    sessions = query.order_by(models.NavigationSession.started_at.desc()).offset(skip).limit(limit).all()
    
    # 각 세션에 목적지 정보 포함
    for sess in sessions:
        sess.destination = db.query(models.Destination).filter(
            models.Destination.id == sess.destination_id
        ).first()
    
    return sessions

@router.post("/", response_model=session.SessionResponse)
def create_session(
    session_data: session.SessionCreate,
    db: Session = Depends(get_db)
):
    """네비게이션 세션 생성"""
    try:
        # destination_id가 없고 place_id가 있으면 임시 destination 생성
        destination_id = session_data.destination_id
        if not destination_id and session_data.place_id:
            # place_id로 기존 destination 찾기
            existing_dest = db.query(models.Destination).filter(
                models.Destination.name == session_data.place_name,
                models.Destination.latitude == session_data.destination_latitude,
                models.Destination.longitude == session_data.destination_longitude
            ).first()
            
            if existing_dest:
                destination_id = existing_dest.id
            else:
                # 새 destination 생성
                new_dest = models.Destination(
                    name=session_data.place_name or f"Place {session_data.place_id[:8]}",
                    description=session_data.place_address or "",
                    latitude=session_data.destination_latitude,
                    longitude=session_data.destination_longitude,
                    address=session_data.place_address,
                    is_active=True
                )
                db.add(new_dest)
                db.flush()  # ID를 얻기 위해 flush
                destination_id = new_dest.id
        
        if not destination_id:
            raise HTTPException(
                status_code=400, 
                detail="destination_id or place_id with coordinates must be provided"
            )
        
        # 세션 생성
        session_dict = session_data.dict(exclude={'place_id', 'place_name', 'place_address', 'destination_latitude', 'destination_longitude'})
        session_dict['destination_id'] = destination_id
        db_session = models.NavigationSession(**session_dict)
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        return db_session
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error in create_session: {str(e)}")
        print(traceback.format_exc())
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{session_id}", response_model=session.SessionResponse)
def get_session(session_id: str, db: Session = Depends(get_db)):
    """세션 상세 조회"""
    db_session = db.query(models.NavigationSession).filter(
        models.NavigationSession.id == session_id
    ).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session

@router.patch("/{session_id}", response_model=session.SessionResponse)
def update_session(
    session_id: str,
    session_update: session.SessionUpdate,
    db: Session = Depends(get_db)
):
    """세션 업데이트"""
    db_session = db.query(models.NavigationSession).filter(
        models.NavigationSession.id == session_id
    ).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    update_data = session_update.dict(exclude_unset=True)
    
    # status 문자열을 Enum으로 변환
    if 'status' in update_data:
        update_data['status'] = SessionStatus[update_data['status'].upper()]
    
    for key, value in update_data.items():
        setattr(db_session, key, value)
    
    db.commit()
    db.refresh(db_session)
    return db_session

