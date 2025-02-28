import { NextResponse } from 'next/server';
import { updateContainerAccess } from '@/app/utils/azureStorage';

export async function POST() {
  try {
    await updateContainerAccess();
    return NextResponse.json({ message: 'Container access updated successfully' });
  } catch (error) {
    console.error('Error updating container access:', error);
    return NextResponse.json(
      { error: 'Failed to update container access' },
      { status: 500 }
    );
  }
} 