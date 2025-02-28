import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { redirect } from 'next/navigation';
import DashboardContent from './DashboardContent';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/admin/login');
  }

  return <DashboardContent />;
} 