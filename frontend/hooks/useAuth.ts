'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user ? {
    id: session.user.id || session.user.email || '',
    email: session.user.email || '',
    name: session.user.name || '',
    image: session.user.image,
  } : null;

  const login = async () => {
    await signIn('google', {
      callbackUrl: '/ar-nav',
    });
  };

  const logout = async () => {
    await signOut({
      callbackUrl: '/',
    });
  };

  const requireAuth = () => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.pathname));
      return false;
    }
    return true;
  };

  return {
    user,
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    login,
    logout,
    requireAuth,
  };
}

