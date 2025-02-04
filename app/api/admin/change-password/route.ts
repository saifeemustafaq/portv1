import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';
import { logAuth, logError } from '@/app/utils/logger';

function getRequestInfo(request: NextRequest) {
  return {
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    path: request.nextUrl.pathname,
    method: request.method
  };
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();
    const requestInfo = getRequestInfo(request);

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const admin = await Admin.findOne({ email: session.user.email });

    if (!admin) {
      await logAuth('Password change failed - admin not found', { email: session.user.email }, requestInfo);
      return NextResponse.json({ message: 'Admin not found' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);

    if (!isMatch) {
      await logAuth('Password change failed - invalid current password', { email: admin.email }, requestInfo);
      return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    admin.password = hashedPassword;
    await admin.save();

    await logAuth('Password changed successfully', { email: admin.email }, requestInfo);
    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error: unknown) {
    const requestInfo = getRequestInfo(request);
    await logError('auth', 'Error changing password', error as Error, requestInfo);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
} 