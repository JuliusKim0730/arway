/**
 * 네비게이션 플로우 통합 테스트
 */
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';

// Mock Next.js
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock API calls
jest.mock('@/lib/api', () => ({
  fetchDestinations: jest.fn(() =>
    Promise.resolve([
      {
        id: '1',
        name: '테스트 목적지',
        description: '테스트용',
        address: '테스트 주소',
        latitude: 37.511,
        longitude: 127.029,
        is_active: true,
      },
    ])
  ),
  createSession: jest.fn(() =>
    Promise.resolve({
      id: 'session-1',
      user_id: 'user-1',
      destination_id: '1',
      status: 'active',
    })
  ),
  saveNavigationPoint: jest.fn(() => Promise.resolve({})),
  updateSession: jest.fn(() => Promise.resolve({})),
  submitFeedback: jest.fn(() => Promise.resolve({})),
  fetchUserFavorites: jest.fn(() => Promise.resolve([])),
  addFavorite: jest.fn(() => Promise.resolve({})),
  removeFavorite: jest.fn(() => Promise.resolve({})),
  checkFavorite: jest.fn(() => Promise.resolve(false)),
  ApiError: class ApiError extends Error {
    isOffline = false;
    isRetryable = false;
  },
}));

// Mock hooks
jest.mock('@/hooks/useGeolocationWatcher', () => ({
  useGeolocationWatcher: () => ({
    currentLocation: { lat: 37.510, lng: 127.028 },
    accuracy: 10,
    error: null,
  }),
}));

jest.mock('@/hooks/useHeading', () => ({
  useHeading: () => ({
    heading: 45,
  }),
}));

jest.mock('@/hooks/useNavComputation', () => ({
  useNavComputation: () => ({
    distance: 100,
    bearing: 90,
    relativeAngle: 45,
    statusText: '방향 조정 필요',
    useGoogleMaps: false,
    routeLoading: false,
    routeError: null,
    googleRoute: null,
  }),
}));

jest.mock('@/store/navigationStore', () => ({
  useNavigationStore: () => ({
    currentSessionId: 'session-1',
    targetLocation: { lat: 37.511, lng: 127.029 },
    setSessionId: jest.fn(),
    setTargetLocation: jest.fn(),
    clearNavigation: jest.fn(),
  }),
}));

jest.mock('@/lib/user', () => ({
  ensureUser: jest.fn(() =>
    Promise.resolve({
      id: 'user-1',
      email: 'test@arway.com',
      name: 'Test User',
    })
  ),
  getCurrentUser: jest.fn(() => ({
    id: 'user-1',
    email: 'test@arway.com',
    name: 'Test User',
  })),
}));

jest.mock('@/lib/analytics', () => ({
  trackEvent: jest.fn(),
  AnalyticsEvents: {},
}));

// Mock hooks used in select page
jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toasts: [],
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    removeToast: jest.fn(),
  }),
}));

jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: any) => value,
}));

// Mock components
jest.mock('@/components/Toast', () => ({
  ToastContainer: () => null,
}));

jest.mock('@/components/Skeleton', () => ({
  DestinationListSkeleton: () => <div data-testid="skeleton">Loading...</div>,
  Skeleton: () => <div data-testid="skeleton-item">Loading...</div>,
}));

jest.mock('@/lib/googleMaps', () => ({
  isGoogleMapsAvailable: () => false,
  getDirections: jest.fn(),
}));

// Mock components used in run page
jest.mock('@/components/ArrowIndicator', () => ({
  ArrowIndicator: () => <div data-testid="arrow-indicator">Arrow</div>,
}));

jest.mock('@/hooks/useHaptic', () => ({
  useHaptic: () => ({
    isSupported: false,
    vibrate: jest.fn(),
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    continuous: jest.fn(),
  }),
}));

describe('네비게이션 플로우 통합 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('목적지 선택 화면이 정상적으로 렌더링된다', async () => {
    // Dynamic import로 컴포넌트 로드
    const ArNavSelectPage = (await import('@/app/ar-nav/select/page')).default;
    render(<ArNavSelectPage />);
    
    await waitFor(() => {
      expect(screen.getByText('목적지 선택')).toBeInTheDocument();
    });
  });

  it('AR 네비 실행 화면이 정상적으로 렌더링된다', async () => {
    // Dynamic import로 컴포넌트 로드
    const ArNavRunPage = (await import('@/app/ar-nav/run/page')).default;
    render(<ArNavRunPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/남은 거리|m/i)).toBeInTheDocument();
    });
  });

  it('도착 화면이 정상적으로 렌더링된다', async () => {
    // Dynamic import로 컴포넌트 로드
    const ArNavArrivedPage = (await import('@/app/ar-nav/arrived/page')).default;
    render(<ArNavArrivedPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/도착했습니다|도착/i)).toBeInTheDocument();
    });
  });
});

