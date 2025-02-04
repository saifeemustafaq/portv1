import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';
import Log from '@/models/Log';
import { JWT } from 'next-auth/jwt';
import crypto from 'crypto';
import { headers } from 'next/headers';
import { logAuth, logError } from '@/app/utils/logger';

interface CustomUser {
  id: string;
  name: string;
  email: string;
  loginTime: number;
  sessionId: string;
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req): Promise<CustomUser | null> {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Please enter username and password');
        }

        await connectDB();
        
        const headersList = headers();
        const ip = headersList.get('x-forwarded-for') || 'unknown';
        const userAgent = headersList.get('user-agent') || 'unknown';

        try {
          const admin = await Admin.findOne({ username: credentials.username });
          
          if (!admin) {
            // Log failed login attempt - user not found
            await Log.create({
              timestamp: new Date(),
              level: 'warn',
              category: 'auth',
              message: 'Failed login attempt - user not found',
              details: {
                attemptedUsername: credentials.username,
                attemptedPassword: '***' // Never log actual passwords
              },
              ip,
              userAgent,
              path: '/api/auth/signin',
              method: 'POST'
            });
            await logAuth('Login failed - Invalid credentials', { email: credentials.username });
            throw new Error('Invalid credentials');
          }

          const isValid = await admin.comparePassword(credentials.password);
          
          if (!isValid) {
            // Log failed login attempt - wrong password
            await Log.create({
              timestamp: new Date(),
              level: 'warn',
              category: 'auth',
              message: 'Failed login attempt - invalid password',
              details: {
                username: credentials.username,
                attemptedPassword: '***' // Never log actual passwords
              },
              ip,
              userAgent,
              path: '/api/auth/signin',
              method: 'POST'
            });
            await logAuth('Login failed - Invalid credentials', { email: credentials.username });
            throw new Error('Invalid credentials');
          }

          // Generate a unique session ID for this login
          const sessionId = crypto.randomBytes(32).toString('hex');

          // Log successful login
          await Log.create({
            timestamp: new Date(),
            level: 'info',
            category: 'auth',
            message: 'Successful login',
            details: {
              username: credentials.username
            },
            userId: admin._id.toString(),
            username: admin.username,
            ip,
            userAgent,
            path: '/api/auth/signin',
            method: 'POST'
          });

          await logAuth('Admin login successful', { email: admin.username });
          return {
            id: admin._id.toString(),
            name: admin.username,
            email: admin.username,
            loginTime: Date.now(),
            sessionId,
          };
        } catch (error) {
          // Log unexpected errors
          if (error instanceof Error && error.message !== 'Invalid credentials') {
            await Log.create({
              timestamp: new Date(),
              level: 'error',
              category: 'auth',
              message: 'Authentication error',
              details: {
                error: error.message,
                username: credentials.username
              },
              ip,
              userAgent,
              path: '/api/auth/signin',
              method: 'POST'
            });
          }
          await logError('auth', 'Login error occurred', error);
          throw error;
        }
      }
    })
  ],
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (trigger === 'signIn' && user) {
        // On sign in, update the token with new user data
        return {
          ...token,
          user,
          loginTime: Date.now(),
          sessionId: (user as CustomUser).sessionId,
        };
      }
      
      // For subsequent requests, just return the token
      return token;
    },
    async session({ session, token }) {
      // Update session with user data from token
      session.user = token.user as CustomUser;
      session.loginTime = token.loginTime;
      session.sessionId = token.sessionId;
      return session;
    },
    async signOut({ token }) {
      try {
        await logAuth('Admin logged out', { email: token.email });
      } catch (error) {
        console.error('Error logging signout:', error);
      }
      return true;
    }
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
  }
});

export { handler as GET, handler as POST }; 