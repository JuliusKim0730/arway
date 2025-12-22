import { useState, useEffect, useRef } from 'react';

export function useHeading() {
  const [heading, setHeading] = useState<number | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  
  // 방향 값 스무딩을 위한 히스토리
  const headingHistoryRef = useRef<number[]>([]);
  const lastValidHeadingRef = useRef<number | null>(null);

  // 방향 값 필터링 및 스무딩
  const filterHeading = (newHeading: number): number => {
    const history = headingHistoryRef.current;
    
    // 첫 번째 값은 그대로 사용
    if (history.length === 0) {
      history.push(newHeading);
      lastValidHeadingRef.current = newHeading;
      return newHeading;
    }
    
    // 급격한 변화 감지 및 보정 (360도 경계 처리)
    const lastHeading = history[history.length - 1];
    let diff = newHeading - lastHeading;
    
    // 360도 경계에서의 점프 보정
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    // 급격한 변화(30도 이상)는 점진적으로 적용
    if (Math.abs(diff) > 30) {
      const smoothedDiff = diff * 0.3; // 30%만 적용
      newHeading = lastHeading + smoothedDiff;
      
      // 0-360 범위로 정규화
      if (newHeading < 0) newHeading += 360;
      if (newHeading >= 360) newHeading -= 360;
    }
    
    // 히스토리에 추가 (최대 5개 유지)
    history.push(newHeading);
    if (history.length > 5) {
      history.shift();
    }
    
    // 최근 3개 값의 가중 평균 (최신 값에 더 높은 가중치)
    const recentValues = history.slice(-3);
    let totalWeight = 0;
    let weightedSum = 0;
    
    recentValues.forEach((value, index) => {
      const weight = index + 1; // 최신일수록 높은 가중치
      weightedSum += value * weight;
      totalWeight += weight;
    });
    
    const smoothedHeading = weightedSum / totalWeight;
    lastValidHeadingRef.current = smoothedHeading;
    
    return smoothedHeading;
  };

  useEffect(() => {
    let isMounted = true;
    let permissionRequested = false;
    let calibrationTimeout: NodeJS.Timeout | null = null;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (!isMounted) return;
      
      if (event.alpha !== null) {
        // alpha는 0-360도 범위의 나침반 방향
        const rawHeading = event.alpha;
        const filteredHeading = filterHeading(rawHeading);
        setHeading(filteredHeading);
        
        // 5초 후 보정 완료로 간주
        if (!isCalibrated && !calibrationTimeout) {
          calibrationTimeout = setTimeout(() => {
            if (isMounted) {
              setIsCalibrated(true);
            }
          }, 5000);
        }
      }
    };

    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      // 권한 요청 (iOS 13+)
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        permissionRequested = true;
        (DeviceOrientationEvent as any)
          .requestPermission()
          .then((response: string) => {
            if (response === 'granted' && isMounted) {
              window.addEventListener('deviceorientation', handleOrientation, { passive: true });
            } else {
              console.warn('DeviceOrientation 권한이 거부되었습니다.');
            }
          })
          .catch((err: Error) => {
            if (isMounted) {
              console.error('DeviceOrientation 권한 요청 실패:', err);
            }
          });
      } else {
        // Android 등 권한이 필요 없는 경우
        window.addEventListener('deviceorientation', handleOrientation, { passive: true });
      }
    } else {
      console.warn('DeviceOrientation API를 지원하지 않습니다.');
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
      if (calibrationTimeout) {
        clearTimeout(calibrationTimeout);
      }
      // 상태 초기화
      headingHistoryRef.current = [];
      lastValidHeadingRef.current = null;
      setIsCalibrated(false);
    };
  }, [filterHeading, isCalibrated]);

  return { heading, isCalibrated };
}

