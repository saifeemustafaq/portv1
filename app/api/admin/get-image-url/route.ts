import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { getImageUrl } from '@/app/utils/azureStorage';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const fileName = searchParams.get('fileName');
    const thumbnail = searchParams.get('thumbnail') === 'true';

    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    // Generate SAS URL
    const imageUrl = await getImageUrl(fileName, thumbnail);

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error('Error generating image URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate image URL' },
      { status: 500 }
    );
  }
} 