/**
 * SCQ Unit #3: 경로→AR 행동 지시
 * 
 * 목표: 지도 경로를 "다음 3~5초의 행동"만 정확히 안내
 */

import { SCQUnit, SCQResult, ARActionGuidance, ARAction, IndoorPose } from './types';

interface RouteStep {
  distance: number; // 미터
  instruction: string;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  bearing: number; // 0-360도
}

interface Unit3Input {
  route: {
    steps: RouteStep[];
    polyline?: Array<{ lat: number; lng: number }>;
  };
  currentPose: {
    lat?: number;
    lng?: number;
    x?: number;
    y?: number;
    floor?: number;
    heading?: number;
  };
  isIndoor: boolean;
  nearbyPOIs?: Array<{
    type: 'escalator' | 'elevator' | 'stairs' | 'exit' | 'entrance';
    position: { x?: number; y?: number; lat?: number; lng?: number; floor?: number };
    distance: number;
  }>;
}

export class SCQUnit3_ARGuidance implements SCQUnit<Unit3Input, ARActionGuidance> {
  name = 'SCQ-Unit-3: AR Action Guidance';
  recommendedHz = 5; // 5Hz (0.2초마다, AR 렌더링용)
  
  private lastAction: ARActionGuidance | null = null;
  private actionHistory: Array<ARActionGuidance & { timestamp: number }> = [];
  private readonly SMOOTHING_WINDOW = 5;
  
  async tick(input: Unit3Input): Promise<SCQResult<ARActionGuidance>> {
    try {
      const { route, currentPose, isIndoor, nearbyPOIs } = input;
      
      if (!route.steps || route.steps.length === 0) {
        return {
          ok: false,
          reason: 'No route steps available',
          confidence: 0,
          timestamp: Date.now(),
        };
      }
      
      // 1. 현재 위치에서 가장 가까운 경로상의 점 찾기
      const nearestPoint = this.findNearestPointOnRoute(currentPose, route);
      
      // 2. 다음 행동 결정
      const nextAction = this.determineNextAction(
        nearestPoint,
        route.steps,
        currentPose,
        isIndoor,
        nearbyPOIs
      );
      
      // 3. 거리 계산
      const distanceToAction = this.calculateDistanceToAction(
        currentPose,
        nextAction.targetPoint,
        isIndoor
      );
      
      // 4. AR 앵커 위치 계산
      const anchor = this.calculateARAnchor(
        currentPose,
        nextAction.action,
        nextAction.targetPoint,
        distanceToAction
      );
      
      // 5. 스무딩 적용 (흔들림 방지)
      const smoothedAction = this.applySmoothing({
        action: nextAction.action,
        distanceToAction,
        confidence: nextAction.confidence,
        anchor,
        description: nextAction.description,
      });
      
      this.lastAction = smoothedAction;
      this.updateHistory(smoothedAction);
      
      return {
        ok: true,
        data: smoothedAction,
        confidence: smoothedAction.confidence,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        ok: false,
        reason: error instanceof Error ? error.message : 'AR guidance failed',
        confidence: 0,
        timestamp: Date.now(),
      };
    }
  }
  
  /**
   * 경로상 가장 가까운 점 찾기
   */
  private findNearestPointOnRoute(
    currentPose: Unit3Input['currentPose'],
    route: Unit3Input['route']
  ): { stepIndex: number; point: { lat: number; lng: number } } {
    let minDistance = Infinity;
    let nearestStepIndex = 0;
    let nearestPoint = route.steps[0]?.startLocation || { lat: 0, lng: 0 };
    
    for (let i = 0; i < route.steps.length; i++) {
      const step = route.steps[i];
      
      // 실외: GPS 좌표 사용
      if (currentPose.lat !== undefined && currentPose.lng !== undefined) {
        const distToStart = this.distance(
          currentPose.lat,
          currentPose.lng,
          step.startLocation.lat,
          step.startLocation.lng
        );
        const distToEnd = this.distance(
          currentPose.lat,
          currentPose.lng,
          step.endLocation.lat,
          step.endLocation.lng
        );
        
        if (distToStart < minDistance) {
          minDistance = distToStart;
          nearestStepIndex = i;
          nearestPoint = step.startLocation;
        }
        if (distToEnd < minDistance) {
          minDistance = distToEnd;
          nearestStepIndex = i;
          nearestPoint = step.endLocation;
        }
      }
      // 실내: x, y 좌표 사용
      else if (currentPose.x !== undefined && currentPose.y !== undefined) {
        // 간단한 구현: step의 시작점과의 거리 계산
        const dist = Math.sqrt(
          (currentPose.x - (step.startLocation as any).x || 0) ** 2 +
          (currentPose.y - (step.startLocation as any).y || 0) ** 2
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestStepIndex = i;
          nearestPoint = step.startLocation;
        }
      }
    }
    
    return { stepIndex: nearestStepIndex, point: nearestPoint };
  }
  
  /**
   * 다음 행동 결정
   */
  private determineNextAction(
    nearestPoint: { stepIndex: number; point: { lat: number; lng: number } },
    steps: RouteStep[],
    currentPose: Unit3Input['currentPose'],
    isIndoor: boolean,
    nearbyPOIs?: Array<any>
  ): {
    action: ARAction;
    targetPoint: { lat: number; lng: number };
    confidence: number;
    description?: string;
  } {
    const currentStepIndex = nearestPoint.stepIndex;
    const currentStep = steps[currentStepIndex];
    const nextStep = steps[currentStepIndex + 1];
    
    // 실내: 층 이동 우선
    if (isIndoor && nearbyPOIs) {
      const escalator = nearbyPOIs.find(p => p.type === 'escalator' && p.distance < 5);
      const elevator = nearbyPOIs.find(p => p.type === 'elevator' && p.distance < 5);
      const stairs = nearbyPOIs.find(p => p.type === 'stairs' && p.distance < 5);
      
      if (escalator) {
        return {
          action: 'TAKE_ESCALATOR',
          targetPoint: escalator.position,
          confidence: 0.9,
          description: '에스컬레이터 이용',
        };
      }
      if (elevator) {
        return {
          action: 'TAKE_ELEVATOR',
          targetPoint: elevator.position,
          confidence: 0.9,
          description: '엘리베이터 이용',
        };
      }
      if (stairs) {
        const floorDiff = stairs.position.floor - (currentPose.floor || 1);
        return {
          action: floorDiff > 0 ? 'GO_UPSTAIRS' : 'GO_DOWNSTAIRS',
          targetPoint: stairs.position,
          confidence: 0.8,
          description: floorDiff > 0 ? '계단으로 올라가기' : '계단으로 내려가기',
        };
      }
    }
    
    // 방향 기반 행동 결정
    if (!currentStep) {
      return {
        action: 'GO_STRAIGHT',
        targetPoint: nearestPoint.point,
        confidence: 0.5,
      };
    }
    
    const currentHeading = currentPose.heading || 0;
    const stepBearing = currentStep.bearing;
    const angleDiff = this.normalizeAngle(stepBearing - currentHeading);
    
    // 각도 차이에 따른 행동 결정
    if (Math.abs(angleDiff) < 30) {
      return {
        action: 'GO_STRAIGHT',
        targetPoint: currentStep.endLocation,
        confidence: 0.8,
        description: `${Math.round(currentStep.distance)}m 직진`,
      };
    } else if (angleDiff > 30 && angleDiff < 150) {
      return {
        action: 'TURN_RIGHT',
        targetPoint: currentStep.endLocation,
        confidence: 0.8,
        description: '우회전',
      };
    } else if (angleDiff < -30 && angleDiff > -150) {
      return {
        action: 'TURN_LEFT',
        targetPoint: currentStep.endLocation,
        confidence: 0.8,
        description: '좌회전',
      };
    } else {
      // 180도 회전
      return {
        action: Math.abs(angleDiff) > 150 ? 'TURN_RIGHT' : 'TURN_LEFT',
        targetPoint: currentStep.endLocation,
        confidence: 0.7,
        description: '방향 전환',
      };
    }
  }
  
  /**
   * 행동까지의 거리 계산
   */
  private calculateDistanceToAction(
    currentPose: Unit3Input['currentPose'],
    targetPoint: { lat?: number; lng?: number; x?: number; y?: number },
    isIndoor: boolean
  ): number {
    if (isIndoor && currentPose.x !== undefined && currentPose.y !== undefined) {
      const x = (targetPoint as any).x || 0;
      const y = (targetPoint as any).y || 0;
      return Math.sqrt(
        (currentPose.x - x) ** 2 + (currentPose.y - y) ** 2
      );
    } else if (currentPose.lat !== undefined && currentPose.lng !== undefined && targetPoint.lat && targetPoint.lng) {
      return this.distance(
        currentPose.lat,
        currentPose.lng,
        targetPoint.lat,
        targetPoint.lng
      );
    }
    return 0;
  }
  
  /**
   * AR 앵커 위치 계산
   */
  private calculateARAnchor(
    currentPose: Unit3Input['currentPose'],
    action: ARAction,
    targetPoint: { lat?: number; lng?: number; x?: number; y?: number },
    distance: number
  ): { x: number; y: number; z: number } {
    // 간단한 구현: 사용자 앞 3-5m 위치에 앵커 배치
    const heading = (currentPose.heading || 0) * (Math.PI / 180);
    const anchorDistance = Math.min(Math.max(distance, 3), 10); // 3-10m
    
    return {
      x: Math.cos(heading) * anchorDistance,
      y: 1.5, // 눈 높이 기준 약 1.5m
      z: Math.sin(heading) * anchorDistance,
    };
  }
  
  /**
   * 스무딩 적용 (흔들림 방지)
   */
  private applySmoothing(action: ARActionGuidance): ARActionGuidance {
    if (!this.lastAction) return action;
    
    // 최근 히스토리에서 동일한 액션 비율 확인
    const recentActions = this.actionHistory
      .slice(-this.SMOOTHING_WINDOW)
      .filter(a => a.action === action.action);
    
    // 너무 자주 변경되면 이전 액션 유지
    if (recentActions.length < this.SMOOTHING_WINDOW / 2 && this.actionHistory.length > 2) {
      const lastActionType = this.actionHistory[this.actionHistory.length - 1].action;
      if (lastActionType !== action.action) {
        // 액션 변경이 너무 빈번하면 이전 액션 유지
        return {
          ...this.lastAction,
          confidence: Math.max(this.lastAction.confidence * 0.9, 0.5),
        };
      }
    }
    
    // 앵커 위치 스무딩
    if (this.lastAction.anchor && action.anchor) {
      const smoothingFactor = 0.7;
      action.anchor = {
        x: this.lastAction.anchor.x * smoothingFactor + action.anchor.x * (1 - smoothingFactor),
        y: this.lastAction.anchor.y * smoothingFactor + action.anchor.y * (1 - smoothingFactor),
        z: this.lastAction.anchor.z * smoothingFactor + action.anchor.z * (1 - smoothingFactor),
      };
    }
    
    return action;
  }
  
  /**
   * 각도 정규화 (-180 ~ 180)
   */
  private normalizeAngle(angle: number): number {
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    return angle;
  }
  
  /**
   * 두 지점 간 거리 계산 (미터)
   */
  private distance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;
    
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }
  
  /**
   * 히스토리 업데이트
   */
  private updateHistory(action: ARActionGuidance): void {
    this.actionHistory.push({ ...action, timestamp: Date.now() });
    if (this.actionHistory.length > this.SMOOTHING_WINDOW * 2) {
      this.actionHistory.shift();
    }
  }
  
  async initialize(): Promise<void> {
    this.lastAction = null;
    this.actionHistory = [];
  }
  
  async cleanup(): Promise<void> {
    this.actionHistory = [];
  }
}

