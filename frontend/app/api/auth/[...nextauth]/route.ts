import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

// 환경 변수 검증 및 기본값 설정
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;
const nextAuthUrl = process.env.NEXTAUTH_URL;

// 프로덕션에서 필수 환경 변수 체크
if (process.env.NODE_ENV === 'production') {
  if (!nextAuthSecret) {
    console.error('❌ NEXTAUTH_SECRET이 설정되지 않았습니다.');
  }
  if (!nextAuthUrl) {
    console.error('❌ NEXTAUTH_URL이 설정되지 않았습니다.');
  }
}

// 개발 환경에서만 경고 출력
if (process.env.NODE_ENV === 'development') {
  if (!googleClientId || !googleClientSecret) {
    console.warn('⚠️ Google OAuth 환경 변수가 설정되지 않았습니다.');
  }
  if (!nextAuthSecret) {
    console.warn('⚠️ NEXTAUTH_SECRET이 설정되지 않았습니다.');
  }
}

const authConfig = {
  providers: [
    Google({
      clientId: googleClientId || '',
      clientSecret: googleClientSecret || '',
    }),
  ],
  callbacks: {
    async signIn() {
      return true;
    },
    async session({ session, token }: any) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: nextAuthSecret,
  debug: process.env.NODE_ENV === 'development',
  // Vercel 배포를 위한 trustHost 설정
  trustHost: true,
  // 추가 안전 설정
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

const { handlers } = NextAuth(authConfig);

export const GET = handlers.GET;
export const POST = handlers.POST;
