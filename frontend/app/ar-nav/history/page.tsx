'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchUserSessions, createSession, ApiError, type Session } from '@/lib/api';
import { useNavigationStore } from '@/store/navigationStore';
import { ensureUser, getCurrentUser } from '@/lib/user';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function ArNavHistoryPage() {
  const router = useRouter();
  const { setSessionId, setTargetLocation } = useNavigationStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed'>('all');
  const toast = useToast();

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      
      // 사용자 정보 확인 및 생성
      const user = await ensureUser();
      
      const status = filter === 'completed' ? 'completed' : undefined;
      const data = await fetchUserSessions(user.id, 50, status);
      setSessions(data);
      setError(null);
    } catch (err) {
      let errorMessage = '히스토리를 불러오는데 실패했습니다.';
      
      if (err instanceof ApiError) {
        errorMessage = err.message;
        
        if (err.isOffline) {
          errorMessage = '오프라인 모드입니다. 네트워크 연결을 확인해주세요.';
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      console.warn('히스토리 로딩 실패:', err);
      setError(errorMessage);
      
      // 오프라인이거나 서버 연결 실패 시 빈 배열로 설정
      if (err instanceof ApiError && err.isOffline) {
        setSessions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async (session: Session) => {
    if (!session.destination) {
      toast.error('목적지 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      const user = await ensureUser();
      
      // 현재 위치 가져오기
      const position = await getCurrentPosition();
      
      // 새 세션 생성
      const newSession = await createSession({
        user_id: user.id,
        destination_id: session.destination_id,
        start_latitude: position.coords.latitude,
        start_longitude: position.coords.longitude,
      });

      // 세션 ID와 목적지 정보 저장
      setSessionId(newSession.id);
      setTargetLocation({
        lat: Number(session.destination.latitude),
        lng: Number(session.destination.longitude),
      });

      // 세션 시작 이벤트 추적
      trackEvent(AnalyticsEvents.SESSION_STARTED, {
        destination_id: session.destination_id,
        destination_name: session.destination.name,
        from_history: true,
      });

      // AR 네비 실행 화면으로 이동
      router.push('/ar-nav/run');
    } catch (err) {
      let errorMessage = '위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요.';
      
      if (err instanceof ApiError) {
        errorMessage = err.message;
        
        if (err.isOffline) {
          errorMessage = '인터넷 연결이 없습니다. 네트워크 연결을 확인해주세요.';
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
      trackEvent(AnalyticsEvents.GPS_ERROR, { error: errorMessage });
    }
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  // 소요 시간 계산
  const getDuration = (session: Session): string => {
    if (!session.started_at || !session.completed_at) return '-';
    
    const start = new Date(session.started_at);
    const end = new Date(session.completed_at);
    const diff = Math.round((end.getTime() - start.getTime()) / 1000); // 초 단위
    
    if (diff < 60) {
      return `${diff}초`;
    } else if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      return seconds > 0 ? `${minutes}분 ${seconds}초` : `${minutes}분`;
    } else {
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return '오늘';
    } else if (days === 1) {
      return '어제';
    } else if (days < 7) {
      return `${days}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  // 통계 계산
  const stats = {
    total: sessions.length,
    completed: sessions.filter(s => s.status === 'completed').length,
    totalDistance: sessions.reduce((sum, s) => sum + (s.total_distance || 0), 0),
    averageDuration: (() => {
      const completedSessions = sessions.filter(s => s.status === 'completed' && s.completed_at);
      if (completedSessions.length === 0) return 0;
      
      const totalSeconds = completedSessions.reduce((sum, s) => {
        if (!s.started_at || !s.completed_at) return sum;
        const start = new Date(s.started_at);
        const end = new Date(s.completed_at);
        return sum + Math.round((end.getTime() - start.getTime()) / 1000);
      }, 0);
      
      return Math.round(totalSeconds / completedSessions.length);
    })(),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <LoadingSpinner message="히스토리를 불러오는 중..." size="lg" />
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadHistory}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 헤더 */}
      <header className="p-4 sm:p-6 flex items-center">
        <Link 
          href="/ar-nav" 
          className="mr-3 sm:mr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded p-1 -ml-1"
          aria-label="뒤로 가기"
        >
          <span className="text-xl sm:text-2xl" aria-hidden="true">←</span>
        </Link>
        <h1 className="text-lg sm:text-xl font-semibold">경로 히스토리</h1>
      </header>

      {/* 통계 카드 */}
      {sessions.length > 0 && (
        <div className="px-4 sm:px-6 mb-4">
          <div className="bg-gray-800 rounded-lg p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">총 네비게이션</p>
              <p className="text-xl font-bold">{stats.total}회</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">완료된 세션</p>
              <p className="text-xl font-bold">{stats.completed}회</p>
            </div>
            {stats.averageDuration > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">평균 소요 시간</p>
                <p className="text-xl font-bold">
                  {Math.floor(stats.averageDuration / 60)}분 {stats.averageDuration % 60}초
                </p>
              </div>
            )}
            {stats.totalDistance > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">총 이동 거리</p>
                <p className="text-xl font-bold">{Math.round(stats.totalDistance)}m</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 필터 탭 */}
      <div className="px-4 sm:px-6 mb-4">
        <div className="flex space-x-2 border-b border-gray-700">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg ${
              filter === 'all'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            aria-label="전체 히스토리"
          >
            전체
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg ${
              filter === 'completed'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            aria-label="완료된 세션"
          >
            완료됨
          </button>
        </div>
      </div>

      {/* 히스토리 리스트 */}
      <main className="px-4 sm:px-6 pb-4 sm:pb-6">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm sm:text-base mb-4">
              {filter === 'completed' 
                ? '완료된 네비게이션이 없습니다.'
                : '네비게이션 히스토리가 없습니다.'}
            </p>
            <Link
              href="/ar-nav/select"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              첫 네비게이션 시작하기
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-semibold mb-1">
                      {session.destination?.name || '알 수 없는 목적지'}
                    </h2>
                    {session.destination?.address && (
                      <p className="text-xs sm:text-sm text-gray-400 mb-2">
                        {session.destination.address}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-gray-500">
                      <span>{formatDate(session.started_at)}</span>
                      {session.status === 'completed' && session.completed_at && (
                        <>
                          <span>•</span>
                          <span>{getDuration(session)}</span>
                        </>
                      )}
                      {session.total_distance && session.total_distance > 0 && (
                        <>
                          <span>•</span>
                          <span>{Math.round(session.total_distance)}m</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    session.status === 'completed' 
                      ? 'bg-green-500/20 text-green-400'
                      : session.status === 'active'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {session.status === 'completed' ? '완료' : session.status === 'active' ? '진행중' : '취소됨'}
                  </div>
                </div>
                
                {session.destination && (
                  <button
                    onClick={() => handleRestart(session)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 text-sm sm:text-base touch-manipulation"
                    aria-label={`${session.destination.name}로 다시 안내받기`}
                  >
                    다시 안내받기
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Toast 알림 */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}

