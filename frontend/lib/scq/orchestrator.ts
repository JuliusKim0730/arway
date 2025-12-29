/**
 * SCQ Orchestrator
 * 
 * SCQ Units를 병렬로 실행하고 결과를 통합하는 오케스트레이터
 */

import {
  SCQUnit,
  SCQResult,
  GPSLocation,
  Geofence,
  CameraFrame,
  IMUData,
  IndoorPose,
  ARActionGuidance,
  POIRecognitionResult,
} from './types';
import { SCQUnit1_IndoorOutdoor, IndoorOutdoorResult } from './unit1_indoor_outdoor';
import { SCQUnit2_IndoorPositioning } from './unit2_indoor_positioning';
import { SCQUnit3_ARGuidance } from './unit3_ar_guidance';
import { SCQUnit4_POIRecognition } from './unit4_poi_recognition';

export interface SCQOrchestratorInput {
  gps: GPSLocation;
  geofences: Geofence[];
  cameraFrame?: CameraFrame;
  imu?: IMUData;
  route?: {
    steps: Array<{
      distance: number;
      instruction: string;
      startLocation: { lat: number; lng: number };
      endLocation: { lat: number; lng: number };
      bearing: number;
    }>;
    polyline?: Array<{ lat: number; lng: number }>;
  };
  indoorMap?: {
    zones: Array<{
      id: string;
      name: string;
      floor: number;
      polygon: Array<{ x: number; y: number }>;
      landmarks?: Array<any>;
    }>;
  };
  poiDatabase?: Array<any>;
  userGoal?: {
    targetPoiId?: string;
    interestCategories?: string[];
  };
}

export interface SCQOrchestratorOutput {
  indoorOutdoor: SCQResult<IndoorOutdoorResult>;
  indoorPose?: SCQResult<IndoorPose>;
  arGuidance: SCQResult<ARActionGuidance>;
  poiRecognition?: SCQResult<POIRecognitionResult>;
  timestamp: number;
}

export class SCQOrchestrator {
  private unit1: SCQUnit1_IndoorOutdoor;
  private unit2: SCQUnit2_IndoorPositioning;
  private unit3: SCQUnit3_ARGuidance;
  private unit4: SCQUnit4_POIRecognition;
  
  private lastIndoorPose: IndoorPose | null = null;
  private isRunning = false;
  private tickInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.unit1 = new SCQUnit1_IndoorOutdoor();
    this.unit2 = new SCQUnit2_IndoorPositioning();
    this.unit3 = new SCQUnit3_ARGuidance();
    this.unit4 = new SCQUnit4_POIRecognition();
  }
  
  /**
   * 초기화
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.unit1.initialize?.() || Promise.resolve(),
      this.unit2.initialize?.() || Promise.resolve(),
      this.unit3.initialize?.() || Promise.resolve(),
      this.unit4.initialize?.() || Promise.resolve(),
    ]);
  }
  
  /**
   * 단일 틱 실행 (모든 Units 병렬 실행)
   */
  async tick(input: SCQOrchestratorInput): Promise<SCQOrchestratorOutput> {
    const timestamp = Date.now();
    
    // Unit #1: 실내/실외 전환 판단
    const unit1Result = await this.unit1.tick({
      gps: input.gps,
      geofences: input.geofences,
      cameraFrame: input.cameraFrame,
      imu: input.imu,
    });
    
    const isIndoor = unit1Result.ok && unit1Result.data.mode === 'INDOOR';
    
    // Unit #2: 실내 위치 추정 (실내일 때만)
    let unit2Result: SCQResult<IndoorPose> | undefined;
    if (isIndoor) {
      unit2Result = await this.unit2.tick({
        cameraFrame: input.cameraFrame,
        imu: input.imu,
        indoorMap: input.indoorMap,
        lastKnownPose: this.lastIndoorPose || undefined,
      });
      
      if (unit2Result.ok) {
        this.lastIndoorPose = unit2Result.data;
      }
    }
    
    // Unit #3: AR 행동 지시 (항상 실행)
    const currentPose = isIndoor && unit2Result?.ok
      ? {
          x: unit2Result.data.x,
          y: unit2Result.data.y,
          floor: unit2Result.data.floor,
          heading: unit2Result.data.heading,
        }
      : {
          lat: input.gps.lat,
          lng: input.gps.lng,
          heading: input.gps.heading,
        };
    
    const unit3Result = await this.unit3.tick({
      route: input.route || { steps: [] },
      currentPose,
      isIndoor,
      nearbyPOIs: input.poiDatabase?.filter(poi => {
        if (!isIndoor || !unit2Result?.ok) return false;
        const distance = Math.sqrt(
          (poi.position.x - unit2Result.data.x) ** 2 +
          (poi.position.y - unit2Result.data.y) ** 2
        );
        return distance < 10;
      }).map(poi => ({
        type: poi.type as any,
        position: poi.position,
        distance: Math.sqrt(
          (poi.position.x - (unit2Result?.ok ? unit2Result.data.x : 0)) ** 2 +
          (poi.position.y - (unit2Result?.ok ? unit2Result.data.y : 0)) ** 2
        ),
      })),
    });
    
    // Unit #4: POI 인식 (실내일 때만)
    let unit4Result: SCQResult<POIRecognitionResult> | undefined;
    if (isIndoor && input.poiDatabase) {
      unit4Result = await this.unit4.tick({
        cameraFrame: input.cameraFrame,
        poiDatabase: input.poiDatabase,
        userGoal: input.userGoal,
        currentZone: unit2Result?.ok
          ? { id: unit2Result.data.zoneId || 'unknown', floor: unit2Result.data.floor }
          : undefined,
        currentPose: unit2Result?.ok
          ? {
              x: unit2Result.data.x,
              y: unit2Result.data.y,
              floor: unit2Result.data.floor,
            }
          : undefined,
        route: input.route,
      });
    }
    
    return {
      indoorOutdoor: unit1Result,
      indoorPose: unit2Result,
      arGuidance: unit3Result,
      poiRecognition: unit4Result,
      timestamp,
    };
  }
  
  /**
   * 자동 실행 시작 (권장 주기로 실행)
   */
  startAutoTick(
    inputProvider: () => SCQOrchestratorInput,
    onResult: (output: SCQOrchestratorOutput) => void,
    maxHz: number = 5
  ): void {
    if (this.isRunning) {
      this.stopAutoTick();
    }
    
    this.isRunning = true;
    const intervalMs = 1000 / maxHz;
    
    const runTick = async () => {
      if (!this.isRunning) return;
      
      try {
        const input = inputProvider();
        const output = await this.tick(input);
        onResult(output);
      } catch (error) {
        console.error('SCQ Orchestrator tick error:', error);
      }
      
      if (this.isRunning) {
        this.tickInterval = setTimeout(runTick, intervalMs);
      }
    };
    
    runTick();
  }
  
  /**
   * 자동 실행 중지
   */
  stopAutoTick(): void {
    this.isRunning = false;
    if (this.tickInterval) {
      clearTimeout(this.tickInterval);
      this.tickInterval = null;
    }
  }
  
  /**
   * 정리
   */
  async cleanup(): Promise<void> {
    this.stopAutoTick();
    
    await Promise.all([
      this.unit1.cleanup?.() || Promise.resolve(),
      this.unit2.cleanup?.() || Promise.resolve(),
      this.unit3.cleanup?.() || Promise.resolve(),
      this.unit4.cleanup?.() || Promise.resolve(),
    ]);
  }
  
  /**
   * Unit 접근 (디버깅/모니터링용)
   */
  getUnits(): {
    unit1: SCQUnit1_IndoorOutdoor;
    unit2: SCQUnit2_IndoorPositioning;
    unit3: SCQUnit3_ARGuidance;
    unit4: SCQUnit4_POIRecognition;
  } {
    return {
      unit1: this.unit1,
      unit2: this.unit2,
      unit3: this.unit3,
      unit4: this.unit4,
    };
  }
}

// 싱글톤 인스턴스 (선택적)
let orchestratorInstance: SCQOrchestrator | null = null;

export function getSCQOrchestrator(): SCQOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new SCQOrchestrator();
  }
  return orchestratorInstance;
}

