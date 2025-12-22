import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

// 환경 변수 검증
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (!googleClientId || !googleClientSecret) {
  console.error('⚠️ Google OAuth 환경 변수가 설정되지 않았습니다.');
}

if (!nextAuthSecret) {
  console.error('⚠️ NEXTAUTH_SECRET이 설정되지 않았습니다.');
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
      // Google 로그인 허용
      return true;
    },
    async session({ session, token }: any) {
      // 세션에 사용자 ID 추가
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account }: any) {
      // JWT 토큰에 사용자 정보 추가
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
  },
  secret: nextAuthSecret,
  debug: process.env.NODE_ENV === 'development',
};

// NextAuth 인스턴스 생성
const { handlers } = NextAuth(authConfig);

// Next.js App Router에서는 GET과 POST만 export 가능
export const GET = handlers.GET;
export const POST = handlers.POST;
