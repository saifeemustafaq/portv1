import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';
import { JWT } from 'next-auth/jwt';
import crypto from 'crypto';

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
      async authorize(credentials): Promise<CustomUser | null> {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Please enter username and password');
        }

        await connectDB();
        
        const admin = await Admin.findOne({ username: credentials.username });
        
        if (!admin) {
          throw new Error('Invalid credentials');
        }

        const isValid = await admin.comparePassword(credentials.password);
        
        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        // Generate a unique session ID for this login
        const sessionId = crypto.randomBytes(32).toString('hex');

        return {
          id: admin._id.toString(),
          name: admin.username,
          email: admin.username,
          loginTime: Date.now(),
          sessionId,
        };
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