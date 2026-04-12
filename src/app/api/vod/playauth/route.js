import { NextResponse } from 'next/server';
import vod from '@byteplus/vcloud-sdk-nodejs';

const vodService = vod.vodOpenapi.defaultService;

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const vid = searchParams.get('vid');

  if (!vid) {
    return NextResponse.json({ error: 'Missing vid parameter' }, { status: 400 });
  }

  // Set AccessKeyId and SecretAccessKey from .env.local
  vodService.setAccessKeyId(process.env.AccessKeyId);
  vodService.setSecretKey(process.env.SecretAccessKey);

  try {
    const params = { Vid: vid };
    
    // If you have multiple spaces or need explicit domain binding, adding SpaceName helps BytePlus find your delivery domain
    if (process.env.VOD_SPACE_NAME) {
      params.SpaceName = process.env.VOD_SPACE_NAME;
    }

    const playAuthToken = vodService.GetPlayAuthToken(params, 3600);
    return NextResponse.json({ playAuthToken });
  } catch (error) {
    console.error('Error generating play auth token:', error);
    return NextResponse.json({ error: 'Failed to generate play auth token' }, { status: 500 });
  }
}
