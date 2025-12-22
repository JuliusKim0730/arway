from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database import get_db
from app import models
from app.schemas import destination

router = APIRouter()

@router.get("/", response_model=List[destination.DestinationResponse])
def get_destinations(
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = Query(None, description="검색어 (이름, 주소, 설명에서 검색)"),
    db: Session = Depends(get_db)
):
    """목적지 목록 조회 (검색 기능 포함)"""
    try:
        query = db.query(models.Destination).filter(
            models.Destination.is_active == True
        )
        
        # 검색어가 있으면 필터링
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    models.Destination.name.ilike(search_term),
                    models.Destination.address.ilike(search_term),
                    models.Destination.description.ilike(search_term)
                )
            )
        
        destinations = query.offset(skip).limit(limit).all()
        return destinations
    except Exception as e:
        import traceback
        print(f"Error in get_destinations: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{destination_id}", response_model=destination.DestinationResponse)
def get_destination(destination_id: str, db: Session = Depends(get_db)):
    """목적지 상세 조회"""
    destination = db.query(models.Destination).filter(
        models.Destination.id == destination_id
    ).first()
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found")
    return destination

@router.post("/", response_model=destination.DestinationResponse)
def create_destination(
    destination_data: destination.DestinationCreate,
    db: Session = Depends(get_db)
):
    """목적지 생성"""
    db_destination = models.Destination(**destination_data.dict())
    db.add(db_destination)
    db.commit()
    db.refresh(db_destination)
    return db_destination

@router.put("/{destination_id}", response_model=destination.DestinationResponse)
def update_destination(
    destination_id: str,
    destination_data: destination.DestinationUpdate,
    db: Session = Depends(get_db)
):
    """목적지 수정"""
    db_destination = db.query(models.Destination).filter(
        models.Destination.id == destination_id
    ).first()
    if not db_destination:
        raise HTTPException(status_code=404, detail="Destination not found")
    
    # 업데이트할 필드만 적용
    update_data = destination_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_destination, key, value)
    
    db.commit()
    db.refresh(db_destination)
    return db_destination

