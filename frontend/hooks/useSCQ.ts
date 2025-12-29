/**
 * SCQ Intelligence Layer React Hook
 * 
 * SCQ Orchestrator를 React 컴포넌트에서 쉽게 사용할 수 있게 하는 훅
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  SCQOrchestrator,
  SCQOrchestratorInput,
  SCQOrchestratorOutput,
  GPSLocation,
  Geofence,
  CameraFrame,
  IMUData,
} from '@/lib/scq';

interface UseSCQOptions {
  enabled?: boolean;
  maxHz?: number;
  onResult?: (output: SCQOrchestratorOutput) => void;
}

export function useSCQ(options: UseSCQOptions = {}) {
  const { enabled = true, maxHz = 5, onResult } = options;
  
  const orchestratorRef = useRef<SCQOrchestrator | null>(null);
  const [output, setOutput] = useState<SCQOrchestratorOutput | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 초기화
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        const { getSCQOrchestrator } = await import('@/lib/scq');
        const orchestrator = getSCQOrchestrator();
        await orchestrator.initialize();
        
        if (mounted) {
          orchestratorRef.current = orchestrator;
          setIsInitialized(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'SCQ initialization failed');
        }
      }
    };
    
    init();
    
    return () => {
      mounted = false;
      if (orchestratorRef.current) {
        orchestratorRef.current.cleanup();
      }
    };
  }, []);
  
  // 자동 실행
  useEffect(() => {
    if (!enabled || !isInitialized || !orchestratorRef.current) return;
    
    const orchestrator = orchestratorRef.current;
    
    orchestrator.startAutoTick(
      () => {
        // 기본 입력 제공 (실제로는 외부에서 주입 필요)
        return {
          gps: {
            lat: 0,
            lng: 0,
            accuracy: 10,
            timestamp: Date.now(),
          },
          geofences: [],
        };
      },
      (result) => {
        setOutput(result);
        onResult?.(result);
      },
      maxHz
    );
    
    return () => {
      orchestrator.stopAutoTick();
    };
  }, [enabled, isInitialized, maxHz, onResult]);
  
  // 수동 틱 실행
  const tick = useCallback(async (input: SCQOrchestratorInput) => {
    if (!orchestratorRef.current) {
      throw new Error('SCQ Orchestrator not initialized');
    }
    
    try {
      const result = await orchestratorRef.current.tick(input);
      setOutput(result);
      onResult?.(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'SCQ tick failed';
      setError(errorMessage);
      throw err;
    }
  }, [onResult]);
  
  // 정리
  const cleanup = useCallback(async () => {
    if (orchestratorRef.current) {
      await orchestratorRef.current.cleanup();
      orchestratorRef.current = null;
      setIsInitialized(false);
    }
  }, []);
  
  return {
    output,
    isInitialized,
    error,
    tick,
    cleanup,
  };
}

