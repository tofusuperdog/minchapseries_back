import { NextResponse } from 'next/server';
import vod from '@byteplus/vcloud-sdk-nodejs';

const vodService = vod.vodOpenapi.defaultService;

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const vid = (searchParams.get('vid') || '').trim();

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
    const params = {
      Vid: vid,
      ...(spaceName ? { SpaceName: spaceName } : {}),
    };

    // SpaceName helps BytePlus resolve playback assets when multiple spaces exist.

    const playAuthToken = vodService.GetPlayAuthToken(params, 3600);

    // Fetch play info to get subtitles (SubtitleInfoList)
    let subtitles = [];
    try {
      const playInfoParams = {
        ...params,
        Ssl: '1', // Request HTTPS URLs for subtitles
      };
      const playInfoRes = await vodService.GetPlayInfo(playInfoParams);

      // The response structure: { Result: { SubtitleInfoList: [...] } }
      const result = playInfoRes?.Result;
      const subtitleList = result?.SubtitleInfoList;

      // Log raw subtitle objects to see all available fields
      if (subtitleList && subtitleList.length > 0) {
        console.log('Raw SubtitleInfoList:', JSON.stringify(subtitleList, null, 2));

        subtitles = subtitleList
          .filter(sub => sub.Status === 'enable' || !sub.Status)
          .map((sub, idx) => {
            // Try multiple possible URL fields
            const subtitleUrl = sub.SubtitleUrl || sub.MainUrl || sub.BackupUrl || sub.Url || '';
            console.log(`Subtitle[${idx}] keys:`, Object.keys(sub), 'SubtitleUrl:', sub.SubtitleUrl, 'All values:', sub);

            return {
              id: sub.SubtitleId || String(idx),
              src: subtitleUrl,
              text: sub.Language || sub.Tag || `Subtitle ${idx + 1}`,
              language: sub.Language || sub.LanguageId,
              format: sub.Format || 'webvtt',
              default: idx === 0,
            };
          });
      }
    } catch (subError) {
      console.error('Error fetching subtitles from BytePlus:', subError);
      // Don't fail the whole request if subtitles fail
    }

    return NextResponse.json({
      playAuthToken,
      playDomain: process.env.BYTEPLUS_VOD_PLAY_DOMAIN || 'https://vod.byteplusapi.com',
      subtitles,
    });
  } catch (error) {
    console.error('Error generating play auth token:', error);
    return NextResponse.json({ error: 'Failed to generate play auth token' }, { status: 500 });
  }
}
