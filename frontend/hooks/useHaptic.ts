/**
 * 햅틱 피드백 훅
 * 모바일 기기에서 진동 피드백을 제공
 */

export function useHaptic() {
  // 진동 지원 여부 확인
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  /**
   * 진동 실행
   * @param pattern - 진동 패턴 (ms 단위 배열 또는 숫자)
   *   예: [100, 50, 100] - 100ms 진동, 50ms 대기, 100ms 진동
   *   예: 100 - 100ms 진동
   */
  const vibrate = (pattern: number | number[]): boolean => {
    if (!isSupported) {
      return false;
    }

    try {
      return navigator.vibrate(pattern);
    } catch (error) {
      console.warn('진동 실행 실패:', error);
      return false;
    }
  };

  /**
   * 짧은 진동 (버튼 클릭 등)
   */
  const light = () => vibrate(10);

  /**
   * 중간 진동 (방향 변경 등)
   */
  const medium = () => vibrate(50);

  /**
   * 강한 진동 (도착 감지 등)
   */
  const heavy = () => vibrate([100, 50, 100]);

  /**
   * 연속 진동 (경고 등)
   */
  const continuous = () => vibrate([100, 50, 100, 50, 100]);

  return {
    isSupported,
    vibrate,
    light,
    medium,
    heavy,
    continuous,
  };
}

