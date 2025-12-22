/**
 * 향상된 API 클라이언트
 * - 네트워크 에러 처리
 * - 재시도 로직
 * - 타임아웃 처리
 * - 오프라인 모드 감지
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// API 요청 설정
const DEFAULT_TIMEOUT = 10000; // 10초
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1초

// 재시도 가능한 HTTP 상태 코드
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

// 재시도 가능한 네트워크 에러 타입
const RETRYABLE_ERROR_TYPES = ['NetworkError', 'TimeoutError', 'AbortError'];

/**
 * 커스텀 API 에러 클래스
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error,
    public isRetryable: boolean = false,
    public isOffline: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 네트워크 상태 확인
 */
function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * 지수 백오프 지연 계산
 */
function calculateBackoffDelay(attempt: number, baseDelay: number = DEFAULT_RETRY_DELAY): number {
  return baseDelay * Math.pow(2, attempt);
}

/**
 * 재시도 가능한 에러인지 확인
 */
function isRetryableError(error: unknown, statusCode?: number): boolean {
  // 오프라인 상태
  if (!isOnline()) return true;

  // HTTP 상태 코드 확인
  if (statusCode && RETRYABLE_STATUS_CODES.includes(statusCode)) {
    return true;
  }

  // 네트워크 에러 타입 확인
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // AbortError는 재시도하지 않음 (타임아웃은 재시도)
  if (error instanceof Error && error.name === 'AbortError') {
    return false;
  }

  return false;
}

/**
 * 에러 메시지 생성
 */
function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
}

/**
 * 향상된 fetch 래퍼
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig: {
    maxRetries?: number;
    timeout?: number;
    retryDelay?: number;
  } = {}
): Promise<Response> {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    timeout = DEFAULT_TIMEOUT,
    retryDelay = DEFAULT_RETRY_DELAY,
  } = retryConfig;

  // 오프라인 상태 확인
  if (!isOnline()) {
    throw new ApiError(
      '인터넷 연결이 없습니다. 네트워크 연결을 확인해주세요.',
      undefined,
      undefined,
      true,
      true
    );
  }

  let lastError: Error | ApiError | undefined;
  let lastStatusCode: number | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // AbortController로 타임아웃 처리
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 성공 응답
      if (response.ok) {
        return response;
      }

      // HTTP 에러 상태 코드
      lastStatusCode = response.status;

      // 재시도 가능한 에러인지 확인
      const isRetryable = isRetryableError(undefined, response.status);

      // 마지막 시도이거나 재시도 불가능한 경우 에러 throw
      if (attempt === maxRetries || !isRetryable) {
        let errorMessage = `API 요청 실패: ${response.status} ${response.statusText}`;
        
        // 에러 메시지 추출 시도
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }

        throw new ApiError(errorMessage, response.status, undefined, isRetryable);
      }

      // 재시도 가능한 에러이므로 지수 백오프 후 재시도
      const delay = calculateBackoffDelay(attempt, retryDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));

      lastError = new ApiError(
        `API 요청 실패: ${response.status}`,
        response.status,
        undefined,
        true
      );

      continue;
    } catch (error) {
      // 타임아웃 에러
      if (error instanceof Error && error.name === 'AbortError') {
        const isRetryable = attempt < maxRetries;
        lastError = new ApiError(
          '요청 시간이 초과되었습니다. 다시 시도해주세요.',
          undefined,
          error,
          isRetryable
        );

        if (!isRetryable) {
          throw lastError;
        }

        // 재시도
        const delay = calculateBackoffDelay(attempt, retryDelay);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // 네트워크 에러
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const isRetryable = isRetryableError(error) && attempt < maxRetries;
        lastError = new ApiError(
          '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.',
          undefined,
          error,
          isRetryable,
          !isOnline()
        );

        if (!isRetryable) {
          throw lastError;
        }

        // 재시도
        const delay = calculateBackoffDelay(attempt, retryDelay);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // 기타 에러 (ApiError 포함)
      if (error instanceof ApiError) {
        if (!error.isRetryable || attempt === maxRetries) {
          throw error;
        }

        // 재시도 가능한 ApiError
        const delay = calculateBackoffDelay(attempt, retryDelay);
        await new Promise((resolve) => setTimeout(resolve, delay));
        lastError = error;
        continue;
      }

      // 알 수 없는 에러
      throw new ApiError(
        getErrorMessage(error, '알 수 없는 오류가 발생했습니다.'),
        undefined,
        error instanceof Error ? error : undefined,
        false
      );
    }
  }

  // 모든 재시도 실패
  throw lastError || new ApiError('API 요청이 실패했습니다.');
}

/**
 * 공통 API 요청 함수
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retryConfig?: {
    maxRetries?: number;
    timeout?: number;
    retryDelay?: number;
  }
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetchWithRetry(url, options, retryConfig);

  try {
    return await response.json();
  } catch (error) {
    throw new ApiError(
      '응답 데이터를 파싱할 수 없습니다.',
      response.status,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * GET 요청
 */
export async function apiGet<T>(
  endpoint: string,
  retryConfig?: {
    maxRetries?: number;
    timeout?: number;
    retryDelay?: number;
  }
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    retryConfig
  );
}

/**
 * POST 요청
 */
export async function apiPost<T>(
  endpoint: string,
  data?: unknown,
  retryConfig?: {
    maxRetries?: number;
    timeout?: number;
    retryDelay?: number;
  }
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    },
    retryConfig
  );
}

/**
 * PATCH 요청
 */
export async function apiPatch<T>(
  endpoint: string,
  data?: unknown,
  retryConfig?: {
    maxRetries?: number;
    timeout?: number;
    retryDelay?: number;
  }
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    },
    retryConfig
  );
}

/**
 * PUT 요청
 */
export async function apiPut<T>(
  endpoint: string,
  data?: unknown,
  retryConfig?: {
    maxRetries?: number;
    timeout?: number;
    retryDelay?: number;
  }
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    },
    retryConfig
  );
}

/**
 * DELETE 요청
 */
export async function apiDelete<T>(
  endpoint: string,
  retryConfig?: {
    maxRetries?: number;
    timeout?: number;
    retryDelay?: number;
  }
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    retryConfig
  );
}

