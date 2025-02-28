import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';
import { logAuth } from '@/app/utils/logger';
import { AuthenticationError, ValidationError, NotFoundError, DatabaseError } from '@/lib/errors/CustomErrors';
import { withErrorHandler } from '@/lib/errors/errorMiddleware';

function getRequestInfo(request: NextRequest) {
  return {
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    path: request.nextUrl.pathname,
    method: request.method
  };
}

async function handleChangePassword(request: NextRequest) {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    throw new AuthenticationError('Not authenticated');
  }

  const { currentPassword, newPassword } = await request.json();
  const requestInfo = getRequestInfo(request);

  if (!currentPassword || !newPassword) {
    throw new ValidationError('Missing required fields', { 
      currentPassword: !currentPassword ? 'Current password is required' : undefined,
      newPassword: !newPassword ? 'New password is required' : undefined
    });
  }

  try {
    await connectDB();
  } catch (error) {
    throw new DatabaseError('Failed to connect to database', { error });
  }

  const admin = await Admin.findOne({ email: session.user.email });

  if (!admin) {
    await logAuth('Password change failed - admin not found', { email: session.user.email }, requestInfo);
    throw new NotFoundError('Admin account');
  }

  const isMatch = await bcrypt.compare(currentPassword, admin.password);

  if (!isMatch) {
    await logAuth('Password change failed - invalid current password', { email: admin.email }, requestInfo);
    throw new ValidationError('Current password is incorrect');
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    admin.password = hashedPassword;
    await admin.save();

    await logAuth('Password changed successfully', { email: admin.email }, requestInfo);
    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    throw new DatabaseError('Failed to update password', { error });
  }
}

export const PUT = withErrorHandler(handleChangePassword); 