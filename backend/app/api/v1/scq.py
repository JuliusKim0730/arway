"""
SCQ Intelligence Layer API 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.database import get_db
from app import models

router = APIRouter()


# SCQ Unit #1 입력/출력 모델
class IndoorOutdoorInput(BaseModel):
    gps: Dict[str, Any]
    geofences: List[Dict[str, Any]]
    camera_frame: Optional[Dict[str, Any]] = None
    imu: Optional[Dict[str, Any]] = None


class IndoorOutdoorOutput(BaseModel):
    mode: str  # OUTDOOR | INDOOR | TRANSITION
    confidence: float
    entry_point_id: Optional[str] = None


# SCQ Unit #2 입력/출력 모델
class IndoorPositioningInput(BaseModel):
    camera_frame: Optional[Dict[str, Any]] = None
    imu: Optional[Dict[str, Any]] = None
    indoor_map: Optional[Dict[str, Any]] = None
    landmarks: Optional[List[Dict[str, Any]]] = None
    vps_result: Optional[Dict[str, Any]] = None
    last_known_pose: Optional[Dict[str, Any]] = None


class IndoorPoseOutput(BaseModel):
    x: float
    y: float
    floor: int
    heading: float
    confidence: float
    relocalization_needed: bool
    zone_id: Optional[str] = None


# SCQ Unit #3 입력/출력 모델
class ARGuidanceInput(BaseModel):
    route: Dict[str, Any]
    current_pose: Dict[str, Any]
    is_indoor: bool
    nearby_pois: Optional[List[Dict[str, Any]]] = None


class ARActionOutput(BaseModel):
    action: str
    distance_to_action: float
    confidence: float
    anchor: Optional[Dict[str, float]] = None
    description: Optional[str] = None


# SCQ Unit #4 입력/출력 모델
class POIRecognitionInput(BaseModel):
    camera_frame: Optional[Dict[str, Any]] = None
    poi_database: List[Dict[str, Any]]
    user_goal: Optional[Dict[str, Any]] = None
    current_zone: Optional[Dict[str, Any]] = None
    current_pose: Optional[Dict[str, Any]] = None
    route: Optional[Dict[str, Any]] = None
    top_k: int = 5


class POIOutput(BaseModel):
    id: str
    name: str
    type: str
    position: Dict[str, Any]
    priority: float
    anchor_hint: Optional[Dict[str, float]] = None


class POIRecognitionOutput(BaseModel):
    top_pois: List[POIOutput]
    cta: Optional[List[Dict[str, str]]] = None


@router.post("/unit1/indoor-outdoor", response_model=IndoorOutdoorOutput)
async def scq_unit1_indoor_outdoor(
    input_data: IndoorOutdoorInput,
    db: Session = Depends(get_db)
):
    """
    SCQ Unit #1: 실내/실외 전환 판단
    
    클라이언트에서 직접 계산하거나, 서버에서 계산할 수 있음
    현재는 클라이언트 측 계산을 권장하지만, 서버 측 로직도 가능
    """
    # 간단한 서버 측 구현 (실제로는 클라이언트에서 계산 권장)
    try:
        gps = input_data.gps
        geofences = input_data.geofences
        
        # 지오펜스 진입 확인
        mode = "OUTDOOR"
        confidence = 0.5
        entry_point_id = None
        
        for geofence in geofences:
            if _is_point_in_polygon(
                gps.get("lat", 0),
                gps.get("lng", 0),
                geofence.get("polygon", [])
            ):
                if geofence.get("type") in ["building", "indoor_zone"]:
                    mode = "INDOOR"
                    confidence = 0.8
                else:
                    mode = "TRANSITION"
                    confidence = 0.6
                
                # 진입점 찾기
                entry_points = geofence.get("entry_points", [])
                if entry_points:
                    entry_point_id = entry_points[0].get("id")
                break
        
        # GPS 정확도 기반 조정
        accuracy = gps.get("accuracy", 10)
        if accuracy > 20:
            confidence = min(confidence + 0.1, 1.0)
        
        return IndoorOutdoorOutput(
            mode=mode,
            confidence=confidence,
            entry_point_id=entry_point_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SCQ Unit #1 error: {str(e)}")


@router.post("/unit2/indoor-positioning", response_model=IndoorPoseOutput)
async def scq_unit2_indoor_positioning(
    input_data: IndoorPositioningInput,
    db: Session = Depends(get_db)
):
    """
    SCQ Unit #2: 실내 위치 추정
    
    VPS 결과가 있으면 우선 사용, 없으면 랜드마크 매칭
    """
    try:
        # VPS 결과 우선 사용
        if input_data.vps_result:
            vps = input_data.vps_result
            return IndoorPoseOutput(
                x=vps.get("pose", {}).get("x", 0),
                y=vps.get("pose", {}).get("y", 0),
                floor=vps.get("pose", {}).get("floor", 1),
                heading=vps.get("pose", {}).get("heading", 0),
                confidence=vps.get("confidence", 0.7),
                relocalization_needed=False,
            )
        
        # 랜드마크 매칭 또는 기본값
        last_pose = input_data.last_known_pose or {}
        
        return IndoorPoseOutput(
            x=last_pose.get("x", 0),
            y=last_pose.get("y", 0),
            floor=last_pose.get("floor", 1),
            heading=last_pose.get("heading", 0),
            confidence=0.5,
            relocalization_needed=True,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SCQ Unit #2 error: {str(e)}")


@router.post("/unit3/ar-guidance", response_model=ARActionOutput)
async def scq_unit3_ar_guidance(
    input_data: ARGuidanceInput,
    db: Session = Depends(get_db)
):
    """
    SCQ Unit #3: 경로→AR 행동 지시
    """
    try:
        route = input_data.route
        current_pose = input_data.current_pose
        steps = route.get("steps", [])
        
        if not steps:
            raise HTTPException(status_code=400, detail="No route steps available")
        
        # 첫 번째 단계 사용
        first_step = steps[0]
        
        # 간단한 행동 결정
        action = "GO_STRAIGHT"
        distance = first_step.get("distance", 0)
        description = first_step.get("instruction", "직진하세요")
        
        # 방향 기반 행동 결정
        bearing = first_step.get("bearing", 0)
        current_heading = current_pose.get("heading", 0)
        angle_diff = ((bearing - current_heading + 180) % 360) - 180
        
        if abs(angle_diff) > 30:
            if angle_diff > 0:
                action = "TURN_RIGHT"
            else:
                action = "TURN_LEFT"
        
        return ARActionOutput(
            action=action,
            distance_to_action=distance,
            confidence=0.8,
            anchor={"x": 0, "y": 1.5, "z": 5},
            description=description,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SCQ Unit #3 error: {str(e)}")


@router.post("/unit4/poi-recognition", response_model=POIRecognitionOutput)
async def scq_unit4_poi_recognition(
    input_data: POIRecognitionInput,
    db: Session = Depends(get_db)
):
    """
    SCQ Unit #4: POI/콘텐츠 인식 & 우선순위
    """
    try:
        poi_database = input_data.poi_database
        user_goal = input_data.user_goal or {}
        current_pose = input_data.current_pose
        top_k = input_data.top_k
        
        # 거리 기반 필터링 및 우선순위 계산
        scored_pois = []
        
        for poi in poi_database:
            score = poi.get("priority", 0.5)
            
            # 목적지 POI 우선
            if user_goal.get("target_poi_id") == poi.get("id"):
                score = 1.0
            
            # 거리 기반 보너스
            if current_pose:
                poi_pos = poi.get("position", {})
                distance = _calculate_distance(
                    current_pose.get("x", 0),
                    current_pose.get("y", 0),
                    poi_pos.get("x", 0),
                    poi_pos.get("y", 0),
                )
                if distance < 50:
                    score += (1 - distance / 50) * 0.3
            
            scored_pois.append({
                **poi,
                "priority": min(1.0, score),
            })
        
        # 우선순위 정렬 및 Top-K 선택
        scored_pois.sort(key=lambda p: p["priority"], reverse=True)
        top_pois = scored_pois[:top_k]
        
        # POI 출력 형식 변환
        poi_outputs = [
            POIOutput(
                id=poi.get("id", ""),
                name=poi.get("name", ""),
                type=poi.get("type", "other"),
                position=poi.get("position", {}),
                priority=poi.get("priority", 0.5),
                anchor_hint=_calculate_anchor_hint(poi, current_pose) if current_pose else None,
            )
            for poi in top_pois
        ]
        
        # CTA 생성
        cta = []
        for poi in top_pois[:3]:
            if user_goal.get("target_poi_id") == poi.get("id"):
                cta.append({
                    "type": "navigate",
                    "poi_id": poi.get("id", ""),
                    "label": f"{poi.get('name', '')}로 이동",
                })
            elif poi.get("type") in ["store", "restaurant"]:
                cta.append({
                    "type": "enter",
                    "poi_id": poi.get("id", ""),
                    "label": f"{poi.get('name', '')} 입장",
                })
        
        return POIRecognitionOutput(
            top_pois=poi_outputs,
            cta=cta if cta else None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SCQ Unit #4 error: {str(e)}")


# 헬퍼 함수
def _is_point_in_polygon(lat: float, lng: float, polygon: List[Dict[str, float]]) -> bool:
    """점이 폴리곤 내부에 있는지 확인"""
    if not polygon:
        return False
    
    inside = False
    for i in range(len(polygon)):
        j = (i + 1) % len(polygon)
        xi, yi = polygon[i].get("lng", 0), polygon[i].get("lat", 0)
        xj, yj = polygon[j].get("lng", 0), polygon[j].get("lat", 0)
        
        intersect = ((yi > lat) != (yj > lat)) and (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)
        if intersect:
            inside = not inside
    
    return inside


def _calculate_distance(x1: float, y1: float, x2: float, y2: float) -> float:
    """두 지점 간 거리 계산 (미터)"""
    return ((x1 - x2) ** 2 + (y1 - y2) ** 2) ** 0.5


def _calculate_anchor_hint(poi: Dict[str, Any], current_pose: Dict[str, Any]) -> Optional[Dict[str, float]]:
    """AR 앵커 힌트 계산"""
    poi_pos = poi.get("position", {})
    dx = poi_pos.get("x", 0) - current_pose.get("x", 0)
    dy = poi_pos.get("y", 0) - current_pose.get("y", 0)
    distance = _calculate_distance(
        current_pose.get("x", 0),
        current_pose.get("y", 0),
        poi_pos.get("x", 0),
        poi_pos.get("y", 0),
    )
    
    if distance > 0:
        return {
            "x": (dx / distance) * min(distance, 10),
            "y": 1.5,
            "z": (dy / distance) * min(distance, 10),
        }
    return None

