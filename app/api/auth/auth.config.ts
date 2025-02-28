import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';
import { JWT } from 'next-auth/jwt';
import crypto from 'crypto';
import { logAuth, logError } from '@/app/utils/logger';
import type { Session } from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import { DatabaseError } from '@/lib/errors/CustomErrors';
import { InvalidCredentialsError, MissingCredentialsError, SessionError, TokenError, AuthConfigError } from '@/lib/errors/AuthErrors';

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

interface RequestWithHeaders {
  headers?: {
    'x-forwarded-for'?: string;
    'user-agent'?: string;
  };
}

function getRequestInfo(req?: RequestWithHeaders) {
  return {
    ip: req?.headers?.['x-forwarded-for'] || 'unknown',
    userAgent: req?.headers?.['user-agent'] || 'unknown',
    path: '/api/auth/signin',
    method: 'POST'
  };
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
            throw new MissingCredentialsError({
              username: !credentials?.username ? 'Username is required' : undefined,
              password: !credentials?.password ? 'Password is required' : undefined
            });
          }

          try {
            await connectDB();
          } catch (error) {
            throw new DatabaseError('Failed to connect to database', { error });
          }

          const requestInfo = getRequestInfo(req);

          const admin = await Admin.findOne({ username: credentials.username });
          if (!admin) {
            await logAuth('Login failed - User not found', { username: credentials.username }, requestInfo);
            throw new InvalidCredentialsError('Invalid username or password');
          }

          const isValid = await admin.comparePassword(credentials.password);
          
          if (!isValid) {
            await logAuth('Login failed - Invalid credentials', { email: credentials.username }, requestInfo);
            throw new InvalidCredentialsError('Invalid username or password');
          }

          const sessionId = crypto.randomUUID();

          await logAuth('Admin login successful', { email: admin.username }, requestInfo);
          
          return {
            id: admin._id.toString(),
            name: admin.username,
            email: admin.username,
            loginTime: Date.now(),
            sessionId,
          };
        } catch (error) {
          await logError('auth', 'Authorization error', error as Error);
          if (error instanceof Error) {
            throw error;
          }
          throw new AuthConfigError('Authentication failed', { error });
        }
      }
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
  secret: process.env.NEXTAUTH_SECRET,
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
        await logError('auth', 'JWT callback error', error as Error);
        throw new TokenError('Failed to process JWT token', { error });
      }
    },
    async session({ session, token }): Promise<CustomSession> {
      try {
        if (!token.user) {
          throw new SessionError('Invalid session state');
        }

        return {
          ...session,
          user: token.user as CustomUser,
          loginTime: token.loginTime as number,
          sessionId: token.sessionId as string,
        };
      } catch (error) {
        await logError('auth', 'Session callback error', error as Error);
        throw new SessionError('Failed to process session', { error });
      }
    },
  },
  cookies: {
    sessionToken: {
      name: process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://') 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://'),
      }
    }
  },
  debug: process.env.NODE_ENV === 'development',
}; 