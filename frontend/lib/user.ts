/**
 * 사용자 관리 유틸리티
 * 로컬 스토리지를 사용한 간단한 사용자 세션 관리
 */

const USER_STORAGE_KEY = 'arway_user';

export interface User {
  id: string;
  email: string;
  name: string;
}

/**
 * 현재 사용자 가져오기 (로컬 스토리지에서)
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * 사용자 저장 (로컬 스토리지에)
 */
export function saveUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

/**
 * 사용자 삭제 (로그아웃)
 */
export function clearUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_STORAGE_KEY);
}

/**
 * 사용자 생성 또는 조회
 */
export async function createOrGetUser(email: string, name: string): Promise<User> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  const response = await fetch(`${API_URL}/api/v1/users/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, name }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create or get user');
  }
  
  const user = await response.json();
  saveUser(user);
  return user;
}

/**
 * 기본 사용자 생성 (익명 사용자)
 */
export async function ensureUser(): Promise<User> {
  // 기존 사용자 확인
  const existing = getCurrentUser();
  if (existing) {
    return existing;
  }
  
  // 새 익명 사용자 생성
  const timestamp = Date.now();
  const email = `anonymous-${timestamp}@arway.local`;
  const name = `사용자 ${timestamp.toString().slice(-6)}`;
  
  return createOrGetUser(email, name);
}

