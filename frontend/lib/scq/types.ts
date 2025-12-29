/**
 * SCQ (Soft Convex Quantization) Intelligence Layer
 * 타입 정의 및 인터페이스
 */

/**
 * SCQ Unit 실행 결과
 */
export type SCQResult<T> = 
  | { ok: true; data: T; confidence: number; timestamp: number }
  | { ok: false; reason: string; confidence: number; timestamp: number };

/**
 * SCQ Unit 인터페이스
 */
export interface SCQUnit<I, O> {
  name: string;
  recommendedHz: number; // 권장 실행 주기 (1~5Hz)
  
  /**
   * Unit 실행
   * @param input 입력 데이터
   * @returns 실행 결과
   */
  tick(input: I): Promise<SCQResult<O>>;
  
  /**
   * Unit 초기화
   */
  initialize?(): Promise<void>;
  
  /**
   * Unit 정리
   */
  cleanup?(): Promise<void>;
}

/**
 * GPS 위치 정보
 */
export interface GPSLocation {
  lat: number;
  lng: number;
  accuracy: number; // 미터 단위
  heading?: number; // 0-360도
  speed?: number; // m/s
  timestamp: number;
}

/**
 * 지오펜스/건물 경계 정보
 */
export interface Geofence {
  id: string;
  name: string;
  type: 'building' | 'indoor_zone' | 'outdoor_area';
  polygon: Array<{ lat: number; lng: number }>;
  floor?: number;
  entryPoints?: Array<{
    id: string;
    lat: number;
    lng: number;
    name: string;
  }>;
}

/**
 * 카메라 프레임 정보 (경량)
 */
export interface CameraFrame {
  timestamp: number;
  features?: Float32Array; // 특징 벡터 (선택)
  thumbnail?: string; // base64 또는 URL (선택)
  width?: number;
  height?: number;
}

/**
 * IMU 센서 데이터
 */
export interface IMUData {
  timestamp: number;
  acceleration?: { x: number; y: number; z: number };
  gyroscope?: { x: number; y: number; z: number };
  magnetometer?: { x: number; y: number; z: number };
}

/**
 * 실내 위치 추정 결과
 */
export interface IndoorPose {
  x: number; // 미터 단위 (건물 내부 좌표)
  y: number;
  floor: number;
  heading: number; // 0-360도
  zoneId?: string;
  confidence: number;
  relocalizationNeeded: boolean;
}

/**
 * AR 행동 지시
 */
export type ARAction = 
  | 'GO_STRAIGHT'
  | 'TURN_LEFT'
  | 'TURN_RIGHT'
  | 'TAKE_ESCALATOR'
  | 'TAKE_ELEVATOR'
  | 'ENTER'
  | 'EXIT'
  | 'GO_UPSTAIRS'
  | 'GO_DOWNSTAIRS'
  | 'WAIT';

export interface ARActionGuidance {
  action: ARAction;
  distanceToAction: number; // 미터
  confidence: number;
  anchor?: {
    x: number;
    y: number;
    z: number;
  };
  description?: string; // "좌회전 후 10m 직진"
}

/**
 * POI 정보
 */
export interface POI {
  id: string;
  name: string;
  type: 'store' | 'restaurant' | 'exhibit' | 'restroom' | 'exit' | 'escalator' | 'elevator' | 'other';
  position: {
    x: number;
    y: number;
    floor: number;
  };
  priority: number; // 0-1, 높을수록 우선순위 높음
  metadata?: Record<string, any>;
}

/**
 * POI 인식 결과
 */
export interface POIRecognitionResult {
  topPois: Array<POI & { anchorHint?: { x: number; y: number; z: number } }>;
  cta?: Array<{
    type: 'enter' | 'view_info' | 'coupon' | 'audio_guide' | 'navigate';
    poiId: string;
    label: string;
  }>;
}

/**
 * 안전/장애물 정보
 */
export interface SafetyInfo {
  hazardLevel: 'low' | 'medium' | 'high';
  suggestedPathAdjustment?: {
    direction: 'left' | 'right' | 'stop';
    distance: number;
  };
  warningText?: string;
}

