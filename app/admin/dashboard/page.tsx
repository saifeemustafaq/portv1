import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { redirect } from 'next/navigation';
import DashboardContent from './DashboardContent';
import { headers } from 'next/headers';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  // Force dynamic rendering
  headers();
  
  if (!session?.user?.email) {
    redirect('/admin/login');
  }

  return (
    <DashboardContent 
      initialSession={{
        user: session.user,
        expires: session.expires,
        loginTime: session.loginTime,
        sessionId: session.sessionId
      }} 
    />
  );
} 