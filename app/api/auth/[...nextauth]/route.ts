import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';
import { JWT } from 'next-auth/jwt';
import crypto from 'crypto';
import { logAuth } from '@/app/utils/logger';
import type { Session } from 'next-auth';
import type { NextAuthOptions } from 'next-auth';

interface CustomUser {
  id: string;
  name: string;
  email: string;
  loginTime: number;
  sessionId: string;
}

interface CustomToken extends JWT {
  user?: CustomUser;
  loginTime?: number;
  sessionId?: string;
}

interface CustomSession extends Session {
  user: CustomUser;
  loginTime: number;
  sessionId: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req): Promise<CustomUser | null> {
        try {
          if (!credentials?.username || !credentials?.password) {
            throw new Error('Please enter username and password');
          }

          await connectDB();

          const requestInfo = {
            ip: req?.headers?.['x-forwarded-for'] as string || 'unknown',
            userAgent: req?.headers?.['user-agent'] as string || 'unknown',
            path: '/api/auth/signin',
            method: 'POST'
          };

          const admin = await Admin.findOne({ username: credentials.username });
          if (!admin) {
            await logAuth('Login failed - User not found', { username: credentials.username, ...requestInfo });
            throw new Error('Invalid credentials');
          }

          const isValid = await admin.comparePassword(credentials.password);
          
          if (!isValid) {
            await logAuth('Login failed - Invalid credentials', { email: credentials.username }, requestInfo);
            throw new Error('Invalid credentials');
          }

          const sessionId = crypto.randomUUID();

          await logAuth('Admin login successful', { email: admin.username }, requestInfo);
          return {
            id: admin._id.toString(),
            name: admin.username,
            email: admin.email,
            loginTime: Date.now(),
            sessionId,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          if (error instanceof Error) {
            throw error;
          }
          throw new Error('Authentication failed');
        }
      },
    })
  ],
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          const customUser = user as unknown as CustomUser;
          token.user = customUser;
          token.loginTime = customUser.loginTime;
          token.sessionId = customUser.sessionId;
        }
        return token as CustomToken;
      } catch (error) {
        console.error('JWT callback error:', error);
        throw error;
      }
    },
    async session({ session, token }): Promise<CustomSession> {
      try {
        if (!token.user && session.user) {
          try {
            await logAuth('Admin logged out', { email: session.user.email });
          } catch (error) {
            console.error('Error logging signout:', error);
          }
        }

        return {
          ...session,
          user: token.user as CustomUser,
          loginTime: token.loginTime as number,
          sessionId: token.sessionId as string,
        };
      } catch (error) {
        console.error('Session callback error:', error);
        throw error;
      }
    },
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 