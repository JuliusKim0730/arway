'use client';

/**
 * 스켈레톤 UI 컴포넌트
 * 로딩 중 콘텐츠의 플레이스홀더로 사용
 */

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * 목적지 카드 스켈레톤
 */
export function DestinationCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Skeleton variant="text" height={24} width="60%" className="mb-2" />
          <Skeleton variant="text" height={16} width="80%" />
        </div>
        <Skeleton variant="circular" width={24} height={24} />
      </div>
      <Skeleton variant="text" height={14} width="40%" className="mt-2" />
    </div>
  );
}

/**
 * 목적지 목록 스켈레톤
 */
export function DestinationListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <DestinationCardSkeleton key={index} />
      ))}
    </div>
  );
}

