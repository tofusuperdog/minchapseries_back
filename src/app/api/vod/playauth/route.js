import { NextResponse } from 'next/server';
import vod from '@byteplus/vcloud-sdk-nodejs';

const vodService = vod.vodOpenapi.defaultService;

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const vid = searchParams.get('vid');

  if (!vid) {
    return NextResponse.json({ error: 'Missing vid parameter' }, { status: 400 });
  }

  const accessKeyId = process.env.BYTEPLUS_ACCESS_KEY_ID || process.env.AccessKeyId;
  const secretAccessKey = process.env.BYTEPLUS_SECRET_ACCESS_KEY || process.env.SecretAccessKey;
  const spaceName = process.env.BYTEPLUS_VOD_SPACE_NAME || process.env.VOD_SPACE_NAME;

  if (!accessKeyId || !secretAccessKey) {
    return NextResponse.json(
      { error: 'BytePlus credentials are not configured' },
      { status: 500 }
    );
  }

  vodService.setAccessKeyId(accessKeyId);
  vodService.setSecretKey(secretAccessKey);

  try {
    const params = { Vid: vid };

    // SpaceName helps BytePlus resolve playback assets when multiple spaces exist.
    if (spaceName) {
      params.SpaceName = spaceName;
    }

    const playAuthToken = vodService.GetPlayAuthToken(params, 3600);

    return NextResponse.json({
      playAuthToken,
      playDomain: process.env.BYTEPLUS_VOD_PLAY_DOMAIN || 'https://vod.byteplusapi.com',
    });
  } catch (error) {
    console.error('Error generating play auth token:', error);
    return NextResponse.json({ error: 'Failed to generate play auth token' }, { status: 500 });
  }
}
