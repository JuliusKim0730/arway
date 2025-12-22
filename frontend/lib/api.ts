/**
 * API 클라이언트 - 향상된 에러 처리 및 재시도 로직 포함
 */
import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from './apiClient';

export interface Destination {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  is_active: boolean;
}

export interface Session {
  id: string;
  user_id: string;
  destination_id: string;
  start_latitude: number;
  start_longitude: number;
  end_latitude?: number;
  end_longitude?: number;
  status: string;
  started_at: string;
  completed_at?: string;
  total_distance?: number;
  destination?: Destination;
}

export interface User {
  id: string;
  email: string;
  name: string;
  google_id?: string;
  avatar_url?: string;
}

export interface AnalyticsEvent {
  session_id: string;
  event_type: string;
  event_data?: Record<string, any>;
}

export interface Favorite {
  id: string;
  user_id: string;
  destination_id: string;
  created_at: string;
  destination?: Destination;
}

/**
 * 목적지 목록 조회
 * 재시도: 3회, 타임아웃: 10초
 * @param search 검색어 (선택사항)
 */
export async function fetchDestinations(search?: string): Promise<Destination[]> {
  try {
    const params = new URLSearchParams();
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    
    const url = `/api/v1/destinations/${params.toString() ? `?${params.toString()}` : ''}`;
    return await apiGet<Destination[]>(url, {
      maxRetries: 3,
      timeout: 10000,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('목적지 목록을 불러오는데 실패했습니다.', undefined, error instanceof Error ? error : undefined);
  }
}

/**
 * 네비게이션 세션 생성
 * 재시도: 2회, 타임아웃: 10초
 */
export async function createSession(data: {
  user_id: string;
  destination_id?: string;  // 기존 destination ID (선택사항)
  place_id?: string;  // Google Places API place_id (선택사항)
  place_name?: string;  // 장소 이름
  place_address?: string;  // 장소 주소
  destination_latitude?: number;  // 목적지 위도
  destination_longitude?: number;  // 목적지 경도
  start_latitude: number;
  start_longitude: number;
}): Promise<Session> {
  try {
    return await apiPost<Session>('/api/v1/sessions/', data, {
      maxRetries: 2,
      timeout: 10000,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('세션 생성에 실패했습니다.', undefined, error instanceof Error ? error : undefined);
  }
}

/**
 * 네비게이션 포인트 저장
 * 재시도: 1회 (백그라운드 작업이므로), 타임아웃: 5초
 */
export async function saveNavigationPoint(data: {
  session_id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  accuracy?: number;
  distance_to_target?: number;
  bearing?: number;
  relative_angle?: number;
}) {
  try {
    return await apiPost('/api/v1/navigation-points/', data, {
      maxRetries: 1, // 백그라운드 작업이므로 최소 재시도
      timeout: 5000,
    });
  } catch (error) {
    // 네비게이션 포인트 저장 실패는 조용히 처리 (사용자에게 알리지 않음)
    console.error('네비게이션 포인트 저장 실패:', error);
    throw error; // 호출자가 필요시 처리할 수 있도록 throw
  }
}

/**
 * 피드백 제출
 * 재시도: 2회, 타임아웃: 10초
 */
export async function submitFeedback(data: {
  session_id: string;
  user_id: string;
  rating: number;
  comment?: string;
}) {
  try {
    return await apiPost('/api/v1/feedback/', data, {
      maxRetries: 2,
      timeout: 10000,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('피드백 제출에 실패했습니다.', undefined, error instanceof Error ? error : undefined);
  }
}

/**
 * 세션 업데이트
 * 재시도: 2회, 타임아웃: 10초
 */
export async function updateSession(
  sessionId: string,
  data: {
    status?: string;
    end_latitude?: number;
    end_longitude?: number;
    total_distance?: number;
  }
) {
  try {
    return await apiPatch(`/api/v1/sessions/${sessionId}`, data, {
      maxRetries: 2,
      timeout: 10000,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('세션 업데이트에 실패했습니다.', undefined, error instanceof Error ? error : undefined);
  }
}

/**
 * 사용자 생성 또는 조회
 * 재시도: 2회, 타임아웃: 10초
 */
export async function createOrGetUser(email: string, name: string): Promise<User> {
  try {
    return await apiPost<User>('/api/v1/users/', { email, name }, {
      maxRetries: 2,
      timeout: 10000,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('사용자 생성 또는 조회에 실패했습니다.', undefined, error instanceof Error ? error : undefined);
  }
}

/**
 * Google 로그인 후 사용자 동기화
 * 재시도: 2회, 타임아웃: 10초
 */
export async function syncUserFromGoogle(data: {
  google_id: string;
  email: string;
  name: string;
  avatar_url?: string;
}): Promise<User> {
  try {
    return await apiPost<User>('/api/v1/auth/sync-user', data, {
      maxRetries: 2,
      timeout: 10000,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('사용자 동기화에 실패했습니다.', undefined, error instanceof Error ? error : undefined);
  }
}

/**
 * 사용자 세션 히스토리 조회
 * 재시도: 3회, 타임아웃: 10초
 */
export async function fetchUserSessions(
  userId: string,
  limit: number = 50,
  status?: 'active' | 'completed' | 'cancelled'
): Promise<Session[]> {
  try {
    const params = new URLSearchParams();
    params.append('user_id', userId);
    params.append('limit', limit.toString());
    if (status) {
      params.append('status', status);
    }
    
    return await apiGet<Session[]>(`/api/v1/sessions/?${params.toString()}`, {
      maxRetries: 3,
      timeout: 10000,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('세션 히스토리를 불러오는데 실패했습니다.', undefined, error instanceof Error ? error : undefined);
  }
}

/**
 * 분석 이벤트 추적
 * 재시도: 1회 (백그라운드 작업), 타임아웃: 5초
 * 실패해도 조용히 처리 (사용자에게 알리지 않음)
 */
export async function trackAnalyticsEvent(event: AnalyticsEvent) {
  try {
    return await apiPost('/api/v1/analytics/', event, {
      maxRetries: 1, // 백그라운드 작업이므로 최소 재시도
      timeout: 5000,
    });
  } catch (error) {
    // 분석 이벤트 추적 실패는 조용히 처리
    console.error('분석 이벤트 추적 실패:', error);
    // 에러를 throw하지 않음 (사용자 경험에 영향 없음)
  }
}

/**
 * 즐겨찾기 추가
 * 재시도: 2회, 타임아웃: 10초
 */
export async function addFavorite(userId: string, destinationId: string): Promise<Favorite> {
  try {
    return await apiPost<Favorite>('/api/v1/favorites/', {
      user_id: userId,
      destination_id: destinationId,
    }, {
      maxRetries: 2,
      timeout: 10000,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('즐겨찾기 추가에 실패했습니다.', undefined, error instanceof Error ? error : undefined);
  }
}

/**
 * 즐겨찾기 제거
 * 재시도: 2회, 타임아웃: 10초
 */
export async function removeFavorite(userId: string, destinationId: string): Promise<void> {
  try {
    await apiDelete(`/api/v1/favorites/user/${userId}/destination/${destinationId}`, {
      maxRetries: 2,
      timeout: 10000,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('즐겨찾기 제거에 실패했습니다.', undefined, error instanceof Error ? error : undefined);
  }
}

/**
 * 사용자의 즐겨찾기 목록 조회
 * 재시도: 3회, 타임아웃: 10초
 */
export async function fetchUserFavorites(userId: string): Promise<Favorite[]> {
  try {
    return await apiGet<Favorite[]>(`/api/v1/favorites/user/${userId}`, {
      maxRetries: 3,
      timeout: 10000,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('즐겨찾기 목록을 불러오는데 실패했습니다.', undefined, error instanceof Error ? error : undefined);
  }
}

/**
 * 특정 목적지가 즐겨찾기에 있는지 확인
 * 재시도: 2회, 타임아웃: 10초
 */
export async function checkFavorite(userId: string, destinationId: string): Promise<Favorite | null> {
  try {
    return await apiGet<Favorite>(`/api/v1/favorites/user/${userId}/destination/${destinationId}`, {
      maxRetries: 2,
      timeout: 10000,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      // 404 에러는 즐겨찾기가 없다는 의미이므로 null 반환
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
    throw new ApiError('즐겨찾기 확인에 실패했습니다.', undefined, error instanceof Error ? error : undefined);
  }
}

// ApiError를 export하여 호출자가 에러 타입을 확인할 수 있도록 함
export { ApiError };

