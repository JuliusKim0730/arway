/**
 * 분석 이벤트 추적 유틸리티
 */

import { trackAnalyticsEvent } from './api';
import { useNavigationStore } from '@/store/navigationStore';

/**
 * 분석 이벤트 추적 (비동기, 에러 무시)
 */
export async function trackEvent(
  eventType: string,
  eventData?: Record<string, any>
) {
  const { currentSessionId } = useNavigationStore.getState();
  
  if (!currentSessionId) {
    console.warn('No session ID available for analytics');
    return;
  }

  try {
    await trackAnalyticsEvent({
      session_id: currentSessionId,
      event_type: eventType,
      event_data: eventData,
    });
  } catch (error) {
    // 분석 이벤트 실패는 앱 동작에 영향을 주지 않음
    console.error('Analytics tracking failed:', error);
  }
}

/**
 * 주요 이벤트 타입
 */
export const AnalyticsEvents = {
  SESSION_STARTED: 'session_started',
  NAVIGATION_STARTED: 'navigation_started',
  NAVIGATION_POINT_SAVED: 'navigation_point_saved',
  ARRIVAL_DETECTED: 'arrival_detected',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
  CAMERA_ACCESS_GRANTED: 'camera_access_granted',
  CAMERA_ACCESS_DENIED: 'camera_access_denied',
  GPS_ERROR: 'gps_error',
  GPS_LOCATION_FOUND: 'gps_location_found',
  HEADING_ERROR: 'heading_error',
  SEARCH_PERFORMED: 'search_performed',
} as const;

