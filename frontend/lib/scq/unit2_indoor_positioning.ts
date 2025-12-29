/**
 * SCQ Unit #2: 실내 위치 추정
 * 
 * 목표: 카메라+지도 기반으로 "구역 단위 위치" 추정
 */

import { SCQUnit, SCQResult, IndoorPose, CameraFrame, IMUData } from './types';

interface Unit2Input {
  cameraFrame?: CameraFrame;
  imu?: IMUData;
  indoorMap?: {
    zones: Array<{
      id: string;
      name: string;
      floor: number;
      polygon: Array<{ x: number; y: number }>;
      landmarks?: Array<{
        id: string;
        name: string;
        position: { x: number; y: number };
        features?: Float32Array;
      }>;
    }>;
  };
  landmarks?: Array<{
    id: string;
    name: string;
    position: { x: number; y: number; floor: number };
    features?: Float32Array;
  }>;
  vpsResult?: {
    pose: { x: number; y: number; floor: number; heading: number };
    confidence: number;
  };
  lastKnownPose?: IndoorPose;
}

export class SCQUnit2_IndoorPositioning implements SCQUnit<Unit2Input, IndoorPose> {
  name = 'SCQ-Unit-2: Indoor Positioning';
  recommendedHz = 3; // 3Hz (약 0.33초마다)
  
  private poseHistory: Array<IndoorPose & { timestamp: number }> = [];
  private readonly MAX_HISTORY = 10;
  private readonly RELOCALIZATION_THRESHOLD = 0.5;
  
  async tick(input: Unit2Input): Promise<SCQResult<IndoorPose>> {
    try {
      const { cameraFrame, imu, indoorMap, landmarks, vpsResult, lastKnownPose } = input;
      
      // 1. VPS 결과가 있으면 우선 사용
      if (vpsResult && vpsResult.confidence > 0.7) {
        const pose: IndoorPose = {
          x: vpsResult.pose.x,
          y: vpsResult.pose.y,
          floor: vpsResult.pose.floor,
          heading: vpsResult.pose.heading,
          confidence: vpsResult.confidence,
          relocalizationNeeded: false,
        };
        this.updateHistory(pose);
        return {
          ok: true,
          data: pose,
          confidence: vpsResult.confidence,
          timestamp: Date.now(),
        };
      }
      
      // 2. 랜드마크 매칭 (질의 기반)
      const landmarkMatch = await this.matchLandmarks(cameraFrame, landmarks);
      
      // 3. IMU 기반 추정 (dead reckoning)
      const imuPose = this.estimateFromIMU(lastKnownPose, imu);
      
      // 4. 다중 가설 추적 (Multi-hypothesis tracking)
      const hypotheses = this.generateHypotheses(
        landmarkMatch,
        imuPose,
        lastKnownPose,
        indoorMap
      );
      
      // 5. 최적 가설 선택
      const bestHypothesis = this.selectBestHypothesis(hypotheses);
      
      // 6. 신뢰도 평가
      const confidence = this.evaluateConfidence(bestHypothesis, landmarkMatch, vpsResult);
      const relocalizationNeeded = confidence < this.RELOCALIZATION_THRESHOLD;
      
      const pose: IndoorPose = {
        ...bestHypothesis,
        confidence,
        relocalizationNeeded,
      };
      
      this.updateHistory(pose);
      
      return {
        ok: true,
        data: pose,
        confidence,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        ok: false,
        reason: error instanceof Error ? error.message : 'Indoor positioning failed',
        confidence: 0,
        timestamp: Date.now(),
      };
    }
  }
  
  /**
   * 랜드마크 매칭 (질의 기반)
   */
  private async matchLandmarks(
    cameraFrame?: CameraFrame,
    landmarks?: Array<{ id: string; features?: Float32Array; position: { x: number; y: number; floor: number } }>
  ): Promise<{ matchedLandmark?: any; confidence: number }> {
    if (!cameraFrame?.features || !landmarks || landmarks.length === 0) {
      return { confidence: 0 };
    }
    
    // 간단한 특징 벡터 유사도 계산 (코사인 유사도)
    let bestMatch: any = null;
    let bestScore = 0;
    
    for (const landmark of landmarks) {
      if (!landmark.features) continue;
      
      const similarity = this.cosineSimilarity(cameraFrame.features, landmark.features);
      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatch = { ...landmark, similarity };
      }
    }
    
    return {
      matchedLandmark: bestMatch,
      confidence: bestScore,
    };
  }
  
  /**
   * IMU 기반 위치 추정 (dead reckoning)
   */
  private estimateFromIMU(
    lastPose?: IndoorPose,
    imu?: IMUData
  ): Partial<IndoorPose> | null {
    if (!lastPose || !imu) return null;
    
    // 간단한 속도 추정 (가속도 적분)
    // 실제로는 더 정교한 필터링 필요 (칼만 필터 등)
    const dt = 0.33; // 약 3Hz
    let dx = 0;
    let dy = 0;
    let dHeading = 0;
    
    if (imu.acceleration) {
      // 가속도를 속도로 변환 (간단한 근사)
      const speed = Math.sqrt(
        imu.acceleration.x ** 2 +
        imu.acceleration.y ** 2
      ) * dt;
      
      dx = speed * Math.cos((lastPose.heading * Math.PI) / 180);
      dy = speed * Math.sin((lastPose.heading * Math.PI) / 180);
    }
    
    if (imu.gyroscope) {
      // 각속도 적분
      dHeading = imu.gyroscope.z * dt * (180 / Math.PI);
    }
    
    return {
      x: lastPose.x + dx,
      y: lastPose.y + dy,
      heading: (lastPose.heading + dHeading) % 360,
      floor: lastPose.floor,
    };
  }
  
  /**
   * 다중 가설 생성
   */
  private generateHypotheses(
    landmarkMatch: { matchedLandmark?: any; confidence: number },
    imuPose: Partial<IndoorPose> | null,
    lastPose?: IndoorPose,
    indoorMap?: { zones: Array<any> }
  ): Array<IndoorPose & { score: number }> {
    const hypotheses: Array<IndoorPose & { score: number }> = [];
    
    // 가설 1: 랜드마크 매칭 결과
    if (landmarkMatch.matchedLandmark && landmarkMatch.confidence > 0.6) {
      hypotheses.push({
        x: landmarkMatch.matchedLandmark.position.x,
        y: landmarkMatch.matchedLandmark.position.y,
        floor: landmarkMatch.matchedLandmark.position.floor,
        heading: lastPose?.heading || 0,
        confidence: landmarkMatch.confidence,
        relocalizationNeeded: false,
        score: landmarkMatch.confidence * 0.8,
      });
    }
    
    // 가설 2: IMU 기반 추정
    if (imuPose && lastPose) {
      hypotheses.push({
        ...imuPose as IndoorPose,
        confidence: 0.6,
        relocalizationNeeded: false,
        score: 0.5,
      });
    }
    
    // 가설 3: 마지막 알려진 위치 (관성)
    if (lastPose) {
      hypotheses.push({
        ...lastPose,
        score: 0.3,
      });
    }
    
    // 가설 4: 맵 기반 후보 위치 (간단한 구현)
    if (indoorMap && lastPose) {
      for (const zone of indoorMap.zones.slice(0, 2)) {
        // 마지막 위치와 가까운 구역
        const centerX = zone.polygon.reduce((sum: number, p: { x: number; y: number }) => sum + p.x, 0) / zone.polygon.length;
        const centerY = zone.polygon.reduce((sum: number, p: { x: number; y: number }) => sum + p.y, 0) / zone.polygon.length;
        const distance = Math.sqrt(
          (centerX - lastPose.x) ** 2 + (centerY - lastPose.y) ** 2
        );
        
        if (distance < 20) { // 20m 이내
          hypotheses.push({
            x: centerX,
            y: centerY,
            floor: zone.floor || lastPose.floor,
            heading: lastPose.heading,
            confidence: 0.4,
            relocalizationNeeded: true,
            score: 0.2,
          });
        }
      }
    }
    
    return hypotheses;
  }
  
  /**
   * 최적 가설 선택
   */
  private selectBestHypothesis(
    hypotheses: Array<IndoorPose & { score: number }>
  ): IndoorPose {
    if (hypotheses.length === 0) {
      // 기본값 반환
      return {
        x: 0,
        y: 0,
        floor: 1,
        heading: 0,
        confidence: 0,
        relocalizationNeeded: true,
      };
    }
    
    // 점수 기반 선택
    const best = hypotheses.reduce((best, h) => 
      h.score > best.score ? h : best
    );
    
    return {
      x: best.x,
      y: best.y,
      floor: best.floor,
      heading: best.heading,
      confidence: best.confidence,
      relocalizationNeeded: best.relocalizationNeeded,
    };
  }
  
  /**
   * 신뢰도 평가
   */
  private evaluateConfidence(
    pose: IndoorPose,
    landmarkMatch: { confidence: number },
    vpsResult?: { confidence: number }
  ): number {
    let confidence = pose.confidence || 0.5;
    
    // 랜드마크 매칭 보너스
    if (landmarkMatch.confidence > 0.7) {
      confidence = Math.max(confidence, landmarkMatch.confidence * 0.9);
    }
    
    // VPS 결과 보너스
    if (vpsResult && vpsResult.confidence > 0.7) {
      confidence = Math.max(confidence, vpsResult.confidence);
    }
    
    // 히스토리 일관성 체크
    if (this.poseHistory.length > 0) {
      const lastPose = this.poseHistory[this.poseHistory.length - 1];
      const distance = Math.sqrt(
        (pose.x - lastPose.x) ** 2 + (pose.y - lastPose.y) ** 2
      );
      
      // 비현실적인 이동 감지
      if (distance > 10) { // 10m 이상 급격한 이동
        confidence *= 0.7;
      }
    }
    
    return Math.max(0, Math.min(1, confidence));
  }
  
  /**
   * 코사인 유사도 계산
   */
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  /**
   * 히스토리 업데이트
   */
  private updateHistory(pose: IndoorPose): void {
    this.poseHistory.push({ ...pose, timestamp: Date.now() });
    if (this.poseHistory.length > this.MAX_HISTORY) {
      this.poseHistory.shift();
    }
  }
  
  async initialize(): Promise<void> {
    this.poseHistory = [];
  }
  
  async cleanup(): Promise<void> {
    this.poseHistory = [];
  }
}

