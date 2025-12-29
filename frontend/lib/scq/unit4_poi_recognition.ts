/**
 * SCQ Unit #4: POI/콘텐츠 인식 & 우선순위
 * 
 * 목표: 질의 기반 Top-K만 노출하여 UX/성능 최적화
 */

import { SCQUnit, SCQResult, POIRecognitionResult, POI, CameraFrame } from './types';

interface Unit4Input {
  cameraFrame?: CameraFrame;
  poiDatabase: POI[];
  userGoal?: {
    targetPoiId?: string;
    interestCategories?: string[];
  };
  currentZone?: {
    id: string;
    floor: number;
  };
  currentPose?: {
    x: number;
    y: number;
    floor: number;
  };
  route?: {
    steps: Array<{ endLocation: { x?: number; y?: number; lat?: number; lng?: number } }>;
  };
  topK?: number; // 기본 3-5개
}

export class SCQUnit4_POIRecognition implements SCQUnit<Unit4Input, POIRecognitionResult> {
  name = 'SCQ-Unit-4: POI Recognition & Priority';
  recommendedHz = 2; // 2Hz (0.5초마다)
  
  private readonly DEFAULT_TOP_K = 5;
  private readonly MAX_DISTANCE = 50; // 50m 이내 POI만 고려
  private readonly MATCHING_THRESHOLD = 0.6;
  
  async tick(input: Unit4Input): Promise<SCQResult<POIRecognitionResult>> {
    try {
      const {
        cameraFrame,
        poiDatabase,
        userGoal,
        currentZone,
        currentPose,
        route,
        topK = this.DEFAULT_TOP_K,
      } = input;
      
      // 1. 거리 기반 필터링
      const nearbyPois = this.filterByDistance(poiDatabase, currentPose, currentZone);
      
      // 2. 카메라 기반 매칭 (선택)
      const matchedPois = await this.matchByCamera(nearbyPois, cameraFrame);
      
      // 3. 우선순위 계산
      const prioritizedPois = this.calculatePriority(
        matchedPois,
        userGoal,
        route,
        currentPose
      );
      
      // 4. Top-K 선택
      const topPois = prioritizedPois.slice(0, topK);
      
      // 5. AR 앵커 힌트 계산
      const poisWithAnchors = topPois.map(poi => ({
        ...poi,
        anchorHint: this.calculateAnchorHint(poi, currentPose),
      }));
      
      // 6. CTA 생성
      const cta = this.generateCTA(topPois, userGoal);
      
      return {
        ok: true,
        data: {
          topPois: poisWithAnchors,
          cta,
        },
        confidence: this.calculateConfidence(matchedPois, topPois),
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        ok: false,
        reason: error instanceof Error ? error.message : 'POI recognition failed',
        confidence: 0,
        timestamp: Date.now(),
      };
    }
  }
  
  /**
   * 거리 기반 필터링
   */
  private filterByDistance(
    pois: POI[],
    currentPose?: { x: number; y: number; floor: number },
    currentZone?: { id: string; floor: number }
  ): POI[] {
    if (!currentPose) {
      // 현재 위치 없으면 같은 층/구역의 POI만
      return pois.filter(poi => 
        currentZone ? poi.position.floor === currentZone.floor : true
      );
    }
    
    return pois.filter(poi => {
      // 같은 층인지 확인
      if (poi.position.floor !== currentPose.floor) return false;
      
      // 거리 계산
      const distance = Math.sqrt(
        (poi.position.x - currentPose.x) ** 2 +
        (poi.position.y - currentPose.y) ** 2
      );
      
      return distance <= this.MAX_DISTANCE;
    });
  }
  
  /**
   * 카메라 기반 매칭
   */
  private async matchByCamera(
    pois: POI[],
    cameraFrame?: CameraFrame
  ): Promise<Array<POI & { matchScore: number }>> {
    if (!cameraFrame?.features || pois.length === 0) {
      return pois.map(poi => ({ ...poi, matchScore: 0.5 }));
    }
    
    // 간단한 구현: POI의 특징 벡터와 비교
    // 실제로는 더 정교한 매칭 필요
    return pois.map(poi => {
      let matchScore = 0.5; // 기본 점수
      
      // POI 메타데이터에 특징 벡터가 있으면 비교
      if (poi.metadata?.features && cameraFrame.features) {
        matchScore = this.cosineSimilarity(
          cameraFrame.features,
          new Float32Array(poi.metadata.features)
        );
      }
      
      return { ...poi, matchScore };
    });
  }
  
  /**
   * 우선순위 계산
   */
  private calculatePriority(
    pois: Array<POI & { matchScore: number }>,
    userGoal?: { targetPoiId?: string; interestCategories?: string[] },
    route?: { steps: Array<any> },
    currentPose?: { x: number; y: number; floor: number }
  ): Array<POI & { matchScore: number; priority: number }> {
    return pois.map(poi => {
      let priority = poi.priority || 0.5;
      
      // 목적지 POI 우선
      if (userGoal?.targetPoiId === poi.id) {
        priority = 1.0;
      }
      
      // 경로 관련 POI 우선
      if (route && this.isOnRoute(poi, route, currentPose)) {
        priority = Math.max(priority, 0.8);
      }
      
      // 관심 카테고리 우선
      if (userGoal?.interestCategories?.includes(poi.type)) {
        priority = Math.max(priority, 0.7);
      }
      
      // 카메라 매칭 점수 반영
      priority = priority * 0.7 + poi.matchScore * 0.3;
      
      // 거리 기반 보너스 (가까울수록 높음)
      if (currentPose) {
        const distance = Math.sqrt(
          (poi.position.x - currentPose.x) ** 2 +
          (poi.position.y - currentPose.y) ** 2
        );
        const distanceBonus = Math.max(0, 1 - distance / this.MAX_DISTANCE) * 0.2;
        priority = Math.min(1, priority + distanceBonus);
      }
      
      return { ...poi, priority };
    }).sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * 경로상에 있는지 확인
   */
  private isOnRoute(
    poi: POI,
    route: { steps: Array<{ endLocation: { x?: number; y?: number } }> },
    currentPose?: { x: number; y: number }
  ): boolean {
    if (!currentPose) return false;
    
    // 경로의 각 단계와의 거리 확인
    for (const step of route.steps.slice(0, 3)) { // 다음 3단계만 확인
      const stepX = (step.endLocation as any).x;
      const stepY = (step.endLocation as any).y;
      
      if (stepX !== undefined && stepY !== undefined) {
        const distance = Math.sqrt(
          (poi.position.x - stepX) ** 2 +
          (poi.position.y - stepY) ** 2
        );
        
        if (distance < 10) { // 10m 이내면 경로상
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * AR 앵커 힌트 계산
   */
  private calculateAnchorHint(
    poi: POI,
    currentPose?: { x: number; y: number; floor: number }
  ): { x: number; y: number; z: number } | undefined {
    if (!currentPose || poi.position.floor !== currentPose.floor) {
      return undefined;
    }
    
    const dx = poi.position.x - currentPose.x;
    const dy = poi.position.y - currentPose.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);
    
    // 카메라 시야 기준 상대 좌표
    return {
      x: dx / distance * Math.min(distance, 10), // 최대 10m
      y: 1.5, // 눈 높이
      z: dy / distance * Math.min(distance, 10),
    };
  }
  
  /**
   * CTA 생성
   */
  private generateCTA(
    topPois: Array<POI & { matchScore: number; priority: number }>,
    userGoal?: { targetPoiId?: string }
  ): Array<{ type: 'enter' | 'view_info' | 'coupon' | 'audio_guide' | 'navigate'; poiId: string; label: string }> {
    const cta: Array<{ type: 'enter' | 'view_info' | 'coupon' | 'audio_guide' | 'navigate'; poiId: string; label: string }> = [];
    
    for (const poi of topPois.slice(0, 3)) {
      // 목적지 POI
      if (userGoal?.targetPoiId === poi.id) {
        cta.push({
          type: 'navigate' as const,
          poiId: poi.id,
          label: `${poi.name}로 이동`,
        });
      }
      
      // 매장/레스토랑
      if (poi.type === 'store' || poi.type === 'restaurant') {
        cta.push({
          type: 'enter' as const,
          poiId: poi.id,
          label: `${poi.name} 입장`,
        });
      }
      
      // 전시물
      if (poi.type === 'exhibit') {
        cta.push({
          type: 'view_info' as const,
          poiId: poi.id,
          label: `${poi.name} 정보 보기`,
        });
      }
    }
    
    return cta;
  }
  
  /**
   * 신뢰도 계산
   */
  private calculateConfidence(
    matchedPois: Array<POI & { matchScore: number }>,
    topPois: Array<POI & { matchScore: number; priority: number }>
  ): number {
    if (topPois.length === 0) return 0;
    
    // 평균 매칭 점수
    const avgMatchScore = topPois.reduce((sum, poi) => sum + poi.matchScore, 0) / topPois.length;
    
    // 우선순위 점수
    const avgPriority = topPois.reduce((sum, poi) => sum + poi.priority, 0) / topPois.length;
    
    return (avgMatchScore * 0.6 + avgPriority * 0.4);
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
  
  async initialize(): Promise<void> {
    // 초기화 로직
  }
  
  async cleanup(): Promise<void> {
    // 정리 로직
  }
}

