'use client';

import { useEffect, useState } from 'react';

interface ArrowIndicatorProps {
  angle: number | null;
  distance: number | null;
}

export function ArrowIndicator({ angle, distance }: ArrowIndicatorProps) {
  const [smoothedAngle, setSmoothedAngle] = useState(0);
  const [displayedDistance, setDisplayedDistance] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  // 각도 스무딩 (부드러운 애니메이션)
  useEffect(() => {
    if (angle === null) return;

    setIsAnimating(true);
    const targetAngle = angle;
    const currentAngle = smoothedAngle;
    
    // 각도 차이 계산 (-180 ~ 180 범위)
    let diff = targetAngle - currentAngle;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    // 스무딩 계수 (0.15 ~ 0.25 사이, 더 부드럽게)
    const smoothingFactor = Math.min(0.2, Math.max(0.15, Math.abs(diff) / 15));
    const newAngle = currentAngle + diff * smoothingFactor;

    const timer = setTimeout(() => {
      setSmoothedAngle(newAngle);
      if (Math.abs(diff) < 0.5) {
        setIsAnimating(false);
      }
    }, 16); // ~60fps

    return () => clearTimeout(timer);
  }, [angle, smoothedAngle]);

  // 거리 애니메이션 (부드러운 숫자 변화)
  useEffect(() => {
    if (distance === null) {
      setDisplayedDistance(null);
      return;
    }

    const targetDistance = Math.round(distance);
    const currentDistance = displayedDistance ?? targetDistance;
    
    if (Math.abs(targetDistance - currentDistance) < 1) {
      setDisplayedDistance(targetDistance);
      return;
    }

    const diff = targetDistance - currentDistance;
    const step = Math.sign(diff) * Math.max(1, Math.abs(diff) / 5); // 부드러운 변화
    const newDistance = currentDistance + step;

    const timer = setTimeout(() => {
      setDisplayedDistance(Math.round(newDistance));
    }, 50);

    return () => clearTimeout(timer);
  }, [distance, displayedDistance]);

  // 펄스 효과 (도착 근처일 때)
  useEffect(() => {
    if (distance !== null && distance < 20) {
      setIsPulsing(true);
    } else {
      setIsPulsing(false);
    }
  }, [distance]);

  // 거리에 따른 화살표 크기 조정 (더 세밀하게)
  const getArrowSize = () => {
    if (distance === null) return 'text-5xl sm:text-6xl';
    if (distance < 5) return 'text-2xl sm:text-3xl'; // 매우 가까울 때
    if (distance < 10) return 'text-3xl sm:text-4xl';
    if (distance < 30) return 'text-4xl sm:text-5xl';
    if (distance < 100) return 'text-5xl sm:text-6xl';
    return 'text-5xl sm:text-6xl';
  };

  // 거리에 따른 색상 조정
  const getArrowColor = () => {
    if (distance === null) return 'text-white';
    if (distance < 5) return 'text-green-300'; // 매우 가까울 때 밝은 초록
    if (distance < 10) return 'text-green-400';
    if (distance < 30) return 'text-blue-400';
    if (distance < 100) return 'text-blue-300';
    return 'text-white';
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* 외곽 링 (방향 표시) */}
      <div className="absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-white/30 flex items-center justify-center">
        <div
          className="absolute w-2 h-2 bg-white rounded-full transition-transform duration-300 ease-out"
          style={{
            transform: `rotate(${smoothedAngle}deg) translateY(${typeof window !== 'undefined' && window.innerWidth < 640 ? '-44px' : '-56px'})`,
          }}
        />
      </div>

      {/* 펄스 링 (도착 근처일 때) */}
      {isPulsing && (
        <div 
          className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-green-400/50 animate-pulse-ring"
        />
      )}

      {/* 중앙 화살표 */}
      <div
        className={`${getArrowSize()} ${getArrowColor()} drop-shadow-2xl transition-all duration-300 ease-out ${
          isAnimating ? 'scale-110' : 'scale-100'
        } ${isPulsing ? 'animate-pulse-slow' : ''}`}
        style={{
          transform: `rotate(${smoothedAngle}deg)`,
          filter: `drop-shadow(0 0 ${distance !== null && distance < 20 ? '15px' : '10px'} rgba(255,255,255,${distance !== null && distance < 20 ? '0.8' : '0.5'}))`,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease-out',
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="currentColor"
        >
          {/* 화살표 모양 (더 명확한 디자인) */}
          <path d="M50 10 L60 40 L75 40 L55 60 L45 60 L25 40 L40 40 Z" />
          {/* 화살표 몸체 */}
          <rect x="45" y="60" width="10" height="30" rx="2" />
        </svg>
      </div>

      {/* 거리 표시 (화살표 내부, 애니메이션 개선) */}
      {displayedDistance !== null && displayedDistance < 100 && (
        <div 
          className={`absolute bottom-0 text-white text-xs font-bold bg-black/60 backdrop-blur-sm px-2 py-1 rounded transition-all duration-300 ${
            isPulsing ? 'scale-110 bg-green-500/60' : 'scale-100'
          } ${displayedDistance < 20 ? 'animate-bounce-subtle' : ''}`}
        >
          {displayedDistance}m
        </div>
      )}
    </div>
  );
}

