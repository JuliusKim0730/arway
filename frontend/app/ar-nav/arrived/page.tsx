'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { submitFeedback, updateSession, ApiError } from '@/lib/api';
import { useNavigationStore } from '@/store/navigationStore';
import { getCurrentUser } from '@/lib/user';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

export default function ArNavArrivedPage() {
  const router = useRouter();
  const { currentSessionId, clearNavigation } = useNavigationStore();
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // 세션 종료 처리
    if (currentSessionId) {
      completeSession();
    }
  }, [currentSessionId]);

  const completeSession = async () => {
    if (!currentSessionId) return;

    try {
      await updateSession(currentSessionId, {
        status: 'completed',
      });
    } catch (err) {
      // ApiError인 경우 상세 정보 로깅
      if (err instanceof ApiError) {
        // 오프라인 상태는 조용히 처리
        if (err.isOffline) {
          console.warn('세션 종료 실패 (오프라인):', err.message);
          return;
        }
      }
      console.error('세션 종료 실패:', err);
    }
  };

  const handleFeedback = async (selectedRating: number) => {
    setRating(selectedRating);
    
    if (!currentSessionId) return;

    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('User not found');
      }
      
      await submitFeedback({
        session_id: currentSessionId,
        user_id: user.id,
        rating: selectedRating,
        comment: comment || undefined,
      });
      
      trackEvent(AnalyticsEvents.FEEDBACK_SUBMITTED, {
        rating: selectedRating,
        has_comment: !!comment,
      });
      
      setSubmitted(true);
    } catch (err) {
      // ApiError인 경우 상세 정보 로깅
      if (err instanceof ApiError) {
        // 오프라인 상태는 사용자에게 알림
        if (err.isOffline) {
          console.warn('피드백 제출 실패 (오프라인):', err.message);
          // TODO: 사용자에게 오프라인 상태 알림 (선택사항)
          return;
        }
      }
      console.error('피드백 제출 실패:', err);
      // TODO: 사용자에게 에러 알림 (선택사항)
    }
  };

  const handleRestart = () => {
    clearNavigation();
    router.push('/ar-nav/select');
  };

  const handleGoHome = () => {
    clearNavigation();
    router.push('/ar-nav');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col">
      {/* 헤더 */}
      <header className="p-4 sm:p-6 text-center">
        <h1 className="text-xl sm:text-2xl font-semibold">안내 완료</h1>
      </header>

      {/* 성공 메시지 */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="text-center space-y-4 sm:space-y-6 max-w-md">
          <div className="text-6xl sm:text-8xl mb-4 animate-bounce" role="img" aria-label="축하 이모지">
            🎉
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            도착했습니다!
          </h2>
          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            AR 네비가 목적지까지 안내를 완료했어요.
          </p>
          {submitted && (
            <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4 text-sm text-green-200 mt-4">
              <p className="font-semibold">✓ 피드백이 제출되었습니다</p>
              <p className="text-xs mt-1">소중한 의견 감사합니다!</p>
            </div>
          )}
        </div>
      </main>

      {/* 피드백 섹션 */}
      {!submitted ? (
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          <div className="text-center">
            <p className="text-base sm:text-lg mb-3 sm:mb-4 font-semibold">이 안내는 도움이 되었나요?</p>
            <div className="flex justify-center gap-4 sm:gap-6">
              <button
                onClick={() => handleFeedback(5)}
                className={`text-3xl sm:text-4xl p-3 sm:p-4 rounded-full transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 touch-manipulation ${
                  rating === 5 ? 'scale-110' : 'hover:scale-105 active:scale-95'
                }`}
                aria-label="매우 만족 (5점)"
              >
                <span aria-hidden="true">😃</span>
              </button>
              <button
                onClick={() => handleFeedback(3)}
                className={`text-3xl sm:text-4xl p-3 sm:p-4 rounded-full transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 touch-manipulation ${
                  rating === 3 ? 'scale-110' : 'hover:scale-105 active:scale-95'
                }`}
                aria-label="보통 (3점)"
              >
                <span aria-hidden="true">😐</span>
              </button>
              <button
                onClick={() => handleFeedback(1)}
                className={`text-3xl sm:text-4xl p-3 sm:p-4 rounded-full transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 touch-manipulation ${
                  rating === 1 ? 'scale-110' : 'hover:scale-105 active:scale-95'
                }`}
                aria-label="불만족 (1점)"
              >
                <span aria-hidden="true">😞</span>
              </button>
            </div>
          </div>

          {rating && (
            <div className="space-y-2">
              <label className="block text-sm text-gray-400">
                추가 의견 (선택사항)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="의견을 입력해주세요..."
                aria-label="추가 의견 입력"
              />
            </div>
          )}
        </div>
      ) : null}

      {/* 하단 버튼 */}
      <div className="p-4 sm:p-6 space-y-2 sm:space-y-3 safe-area-inset-bottom">
        <button
          onClick={handleRestart}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base touch-manipulation"
          aria-label="다시 안내 받기"
        >
          다시 안내 받기
        </button>
        <Link
          href="/ar-nav"
          onClick={handleGoHome}
          className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 text-sm sm:text-base touch-manipulation"
          aria-label="처음으로 돌아가기"
        >
          처음으로
        </Link>
      </div>
    </div>
  );
}

