/**
 * SCQ Unit #1: 실내/실외 전환 판단
 * 
 * 목표: GPS/지도만으로 애매한 경계에서 "지금 실내로 들어왔다/나왔다"를 안정적으로 판단
 */

import { SCQUnit, SCQResult, GPSLocation, Geofence } from './types';

export type IndoorOutdoorMode = 'OUTDOOR' | 'INDOOR' | 'TRANSITION';

export interface IndoorOutdoorResult {
  mode: IndoorOutdoorMode;
  confidence: number;
  entryPointId?: string;
}

interface Unit1Input {
  gps: GPSLocation;
  geofences: Geofence[];
  cameraFrame?: {
    timestamp: number;
    hasIndoorFeatures?: boolean; // 간단한 특징 기반 판단
  };
  imu?: {
    acceleration?: { x: number; y: number; z: number };
  };
}

export class SCQUnit1_IndoorOutdoor implements SCQUnit<Unit1Input, IndoorOutdoorResult> {
  name = 'SCQ-Unit-1: Indoor/Outdoor Transition';
  recommendedHz = 2; // 2Hz (0.5초마다)
  
  private currentMode: IndoorOutdoorMode = 'OUTDOOR';
  private transitionHistory: Array<{ mode: IndoorOutdoorMode; timestamp: number }> = [];
  private readonly TRANSITION_TIMEOUT = 60000; // 1분
  private readonly MIN_CONFIDENCE = 0.6;
  
  async tick(input: Unit1Input): Promise<SCQResult<IndoorOutdoorResult>> {
    try {
      const { gps, geofences, cameraFrame, imu } = input;
      
      // 1. 지오펜스 진입 확인
      const geofenceMatch = this.checkGeofenceEntry(gps, geofences);
      
      // 2. GPS 정확도 기반 판단
      const gpsAccuracyScore = this.evaluateGPSAccuracy(gps.accuracy);
      
      // 3. 이동 패턴 분석
      const movementPatternScore = this.analyzeMovementPattern(gps, imu);
      
      // 4. 카메라 특징 기반 판단 (선택)
      const cameraScore = cameraFrame?.hasIndoorFeatures ? 0.7 : 0.5;
      
      // 5. 종합 점수 계산
      const indoorScore = (
        geofenceMatch.score * 0.4 +
        gpsAccuracyScore * 0.3 +
        movementPatternScore * 0.2 +
        cameraScore * 0.1
      );
      
      // 6. 모드 결정 (히스테리시스 적용)
      const newMode = this.determineMode(indoorScore, geofenceMatch.inside);
      const confidence = Math.abs(indoorScore - 0.5) * 2; // 0-1 범위로 정규화
      
      // 7. 전환 튀김 방지
      const stableMode = this.applyHysteresis(newMode, confidence);
      
      // 8. 히스토리 업데이트
      this.updateHistory(stableMode);
      
      return {
        ok: true,
        data: {
          mode: stableMode,
          confidence: Math.max(confidence, this.MIN_CONFIDENCE),
          entryPointId: geofenceMatch.entryPointId,
        },
        confidence: Math.max(confidence, this.MIN_CONFIDENCE),
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        ok: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        timestamp: Date.now(),
      };
    }
  }
  
  /**
   * 지오펜스 진입 확인
   */
  private checkGeofenceEntry(
    gps: GPSLocation,
    geofences: Geofence[]
  ): { inside: boolean; score: number; entryPointId?: string } {
    for (const geofence of geofences) {
      if (this.isPointInPolygon(gps.lat, gps.lng, geofence.polygon)) {
        // 진입점 찾기
        let entryPointId: string | undefined;
        if (geofence.entryPoints && geofence.entryPoints.length > 0) {
          const nearestEntry = geofence.entryPoints.reduce((nearest, point) => {
            const dist = this.distance(gps.lat, gps.lng, point.lat, point.lng);
            const nearestDist = nearest 
              ? this.distance(gps.lat, gps.lng, nearest.lat, nearest.lng)
              : Infinity;
            return dist < nearestDist ? point : nearest;
          });
          entryPointId = nearestEntry.id;
        }
        
        return {
          inside: true,
          score: geofence.type === 'building' || geofence.type === 'indoor_zone' ? 0.9 : 0.5,
          entryPointId,
        };
      }
    }
    return { inside: false, score: 0.1 };
  }
  
  /**
   * GPS 정확도 평가
   * 정확도가 낮을수록 실내일 가능성 높음
   */
  private evaluateGPSAccuracy(accuracy: number): number {
    if (accuracy > 20) return 0.8; // 정확도 낮음 → 실내 가능성 높음
    if (accuracy > 10) return 0.6;
    if (accuracy > 5) return 0.4;
    return 0.2; // 정확도 높음 → 실외 가능성 높음
  }
  
  /**
   * 이동 패턴 분석
   * 실내에서는 속도가 느리고, 방향 변화가 많음
   */
  private analyzeMovementPattern(
    gps: GPSLocation,
    imu?: { acceleration?: { x: number; y: number; z: number } }
  ): number {
    let score = 0.5;
    
    // 속도 기반 판단
    if (gps.speed !== undefined) {
      if (gps.speed < 0.5) score += 0.2; // 매우 느림 → 실내
      else if (gps.speed > 2.0) score -= 0.2; // 빠름 → 실외
    }
    
    // 가속도 변화 기반 판단
    if (imu?.acceleration) {
      const accelMagnitude = Math.sqrt(
        imu.acceleration.x ** 2 +
        imu.acceleration.y ** 2 +
        imu.acceleration.z ** 2
      );
      // 가속도 변화가 크면 방향 전환 많음 → 실내 가능성
      if (accelMagnitude > 2.0) score += 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * 모드 결정
   */
  private determineMode(indoorScore: number, insideGeofence: boolean): IndoorOutdoorMode {
    if (indoorScore > 0.7) return 'INDOOR';
    if (indoorScore < 0.3) return 'OUTDOOR';
    return 'TRANSITION';
  }
  
  /**
   * 히스테리시스 적용 (전환 튀김 방지)
   */
  private applyHysteresis(newMode: IndoorOutdoorMode, confidence: number): IndoorOutdoorMode {
    // 신뢰도가 낮으면 현재 모드 유지
    if (confidence < this.MIN_CONFIDENCE) {
      return this.currentMode;
    }
    
    // TRANSITION 상태에서 빠른 전환 방지
    if (this.currentMode === 'TRANSITION') {
      const recentTransitions = this.transitionHistory.filter(
        (h) => Date.now() - h.timestamp < this.TRANSITION_TIMEOUT
      );
      if (recentTransitions.length >= 2) {
        return this.currentMode; // 너무 자주 전환되면 유지
      }
    }
    
    this.currentMode = newMode;
    return newMode;
  }
  
  /**
   * 히스토리 업데이트
   */
  private updateHistory(mode: IndoorOutdoorMode): void {
    this.transitionHistory.push({ mode, timestamp: Date.now() });
    // 오래된 히스토리 제거
    this.transitionHistory = this.transitionHistory.filter(
      (h) => Date.now() - h.timestamp < this.TRANSITION_TIMEOUT * 2
    );
  }
  
  /**
   * 점이 폴리곤 내부에 있는지 확인 (Ray casting 알고리즘)
   */
  private isPointInPolygon(lat: number, lng: number, polygon: Array<{ lat: number; lng: number }>): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng;
      const yi = polygon[i].lat;
      const xj = polygon[j].lng;
      const yj = polygon[j].lat;
      
      const intersect = 
        ((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    return inside;
  }
  
  /**
   * 두 지점 간 거리 계산 (미터)
   */
  private distance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // 지구 반지름 (미터)
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
  
  async initialize(): Promise<void> {
    this.currentMode = 'OUTDOOR';
    this.transitionHistory = [];
  }
  
  async cleanup(): Promise<void> {
    this.transitionHistory = [];
  }
}

