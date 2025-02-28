import NextAuth from 'next-auth';
import { authOptions } from '../auth.config';
import { logger } from '@/app/utils/logger';

// Add global error handler for uncaught auth errors
process.on('unhandledRejection', (error) => {
  logger.error('auth', 'Unhandled authentication error', { error });
});

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 