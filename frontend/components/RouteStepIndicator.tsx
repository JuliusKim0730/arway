'use client';

import { useEffect, useState } from 'react';
import type { RouteStep } from '@/lib/googleMaps';

interface RouteStepIndicatorProps {
  currentStep: RouteStep | null;
  nextStep: RouteStep | null;
  distance: number | null;
}

export function RouteStepIndicator({ currentStep, nextStep, distance }: RouteStepIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (currentStep) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [currentStep]);

  if (!isVisible || !currentStep) {
    return null;
  }

  return (
    <div className="absolute bottom-20 left-0 right-0 px-4 z-30 pointer-events-none">
      <div className="bg-black/80 backdrop-blur-md rounded-lg p-3 border border-white/20 shadow-2xl max-w-md mx-auto">
        {/* 현재 단계 */}
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
            {currentStep.distance < 1000 ? Math.round(currentStep.distance) : Math.round(currentStep.distance / 100) / 10}
            <span className="text-xs ml-0.5">{currentStep.distance < 1000 ? 'm' : 'km'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium leading-tight">
              {currentStep.instruction}
            </p>
            {currentStep.duration > 0 && (
              <p className="text-gray-400 text-xs mt-1">
                약 {Math.round(currentStep.duration / 60)}분 소요
              </p>
            )}
          </div>
        </div>

        {/* 다음 단계 미리보기 */}
        {nextStep && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-xs">
                →
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-xs leading-tight">
                  다음: {nextStep.instruction}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 전체 거리 표시 */}
        {distance !== null && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-gray-400 text-xs text-center">
              목적지까지 {distance < 1000 ? `${Math.round(distance)}m` : `${Math.round(distance / 100) / 10}km`} 남음
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

