import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

// 환경 변수 검증
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

const authConfig = {
  providers: [
    Google({
      clientId: googleClientId || '',
      clientSecret: googleClientSecret || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
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
  },
  secret: nextAuthSecret,
  debug: process.env.NODE_ENV === 'development',
};

// NextAuth 인스턴스 생성 및 export
export const { signIn, signOut, auth } = NextAuth(authConfig);
