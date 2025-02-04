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
    maxAge: 2 * 60 * 60, // 2 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      // On sign in, update the token with new user data
      if (user) {
        token.user = user as CustomUser;
        token.loginTime = Date.now();
        token.sessionId = (user as CustomUser).sessionId;
        return token;
      }

      // For all requests (not just updates), validate the session
      const currentSessionId = (token.user as CustomUser)?.sessionId;
      if (!currentSessionId || currentSessionId !== token.sessionId) {
        return null as unknown as JWT;
      }
      
      // Force re-login after 8 hours regardless of activity
      const loginTime = token.loginTime as number;
      if (loginTime && (Date.now() - loginTime) > 8 * 60 * 60 * 1000) {
        return null as unknown as JWT;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token?.user) {
        session.user = token.user as CustomUser;
      }
      return session;
    }
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    }
  }
});

export { handler as GET, handler as POST }; 