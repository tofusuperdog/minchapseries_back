import { NextResponse } from 'next/server';
import vod from '@byteplus/vcloud-sdk-nodejs';

const vodService = vod.vodOpenapi.defaultService;

function getSubtitleProxyUrl(subtitleUrl) {
  return `/api/vod/subtitle?url=${encodeURIComponent(subtitleUrl)}`;
}

function getSubtitleLabel(sub, idx) {
  const languageId = Number(sub.LanguageId);

  if (languageId === 30) return 'Thai';
  if (languageId === 1) return 'Chinese';

  return (
    sub.Language ||
    sub.Title ||
    sub.Tag ||
    `Subtitle ${idx + 1}`
  );
}

function getSubtitleLanguage(sub) {
  const languageId = Number(sub.LanguageId);

  if (languageId === 30) return 'th';
  if (languageId === 1) return 'zh';

  return String(sub.Language || sub.LanguageId || '');
}

function dedupeSubtitles(subtitleList) {
  const seen = new Set();

  return subtitleList.filter((sub) => {
    const key = [
      sub.SubtitleId || '',
      sub.SubtitleUrl || sub.Url || sub.MainUrl || sub.BackupUrl || sub.FileUrl || '',
      sub.LanguageId || sub.Language || '',
    ].join('|');

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function getSubtitleListForVid(subtitleRes, vid) {
  const directSubtitleList =
    subtitleRes?.Result?.SubtitleInfoList ||
    subtitleRes?.Result?.SubtitleInfoListForVid ||
    subtitleRes?.SubtitleInfoList;

  if (Array.isArray(directSubtitleList) && directSubtitleList.length > 0) {
    return directSubtitleList;
  }

  const fileSubtitleInfoList =
    subtitleRes?.Result?.FileSubtitleInfoList || [];

  const matchingFileSubtitleInfo = fileSubtitleInfoList.find(
    (fileSubtitleInfo) => fileSubtitleInfo?.FileId === vid
  );

  if (matchingFileSubtitleInfo?.SubtitleInfoList?.length > 0) {
    return matchingFileSubtitleInfo.SubtitleInfoList;
  }

  return fileSubtitleInfoList.flatMap(
    (fileSubtitleInfo) => fileSubtitleInfo?.SubtitleInfoList || []
  );
}

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const vid = (searchParams.get('vid') || '').trim();

  if (!vid) {
    return NextResponse.json(
      { error: 'Missing vid parameter' },
      { status: 400 }
    );
  }

  const accessKeyId =
    process.env.BYTEPLUS_ACCESS_KEY_ID ||
    process.env.AccessKeyId;

  const secretAccessKey =
    process.env.BYTEPLUS_SECRET_ACCESS_KEY ||
    process.env.SecretAccessKey;

  const spaceName =
    process.env.BYTEPLUS_VOD_SPACE_NAME ||
    process.env.VOD_SPACE_NAME;

  if (!accessKeyId || !secretAccessKey) {
    return NextResponse.json(
      { error: 'BytePlus credentials are not configured' },
      { status: 500 }
    );
  }

  vodService.setAccessKeyId(accessKeyId);
  vodService.setSecretKey(secretAccessKey);

  try {
    const baseParams = {
      Vid: vid,
      ...(spaceName ? { SpaceName: spaceName } : {}),
    };

    const playAuthToken = vodService.GetPlayAuthToken(baseParams, 3600);

    let subtitles = [];

    try {
      const subtitleParams = {
        ...baseParams,
        Ssl: '1',
      };

      const subtitleRes = await vodService.GetSubtitleInfoList(subtitleParams);

      console.log(
        'GetSubtitleInfoList raw:',
        JSON.stringify(subtitleRes, null, 2)
      );

      const subtitleList = getSubtitleListForVid(subtitleRes, vid);

      console.log('Selected subtitle list for vid:', {
        vid,
        count: subtitleList.length,
        fileIds: subtitleList.map((sub) => sub.FileId).filter(Boolean),
      });

      subtitles = dedupeSubtitles(subtitleList)
        .filter((sub) => {
          const status = String(sub.Status || '').toLowerCase();

          // ถ้าไม่มี Status ให้ผ่านไว้ก่อน
          if (!status) return true;

          return (
            status === 'enable' ||
            status === 'enabled' ||
            status === 'published'
          );
        })
        .map((sub, idx) => {
          const subtitleUrl =
            sub.SubtitleUrl ||
            sub.Url ||
            sub.MainUrl ||
            sub.BackupUrl ||
            sub.FileUrl ||
            '';

          console.log(`Subtitle[${idx}] normalized:`, {
            SubtitleId: sub.SubtitleId,
            Language: sub.Language,
            LanguageId: sub.LanguageId,
            Format: sub.Format,
            Status: sub.Status,
            SubtitleUrl: sub.SubtitleUrl,
            Url: sub.Url,
            MainUrl: sub.MainUrl,
            BackupUrl: sub.BackupUrl,
            FileUrl: sub.FileUrl,
            finalUrl: subtitleUrl,
          });

          const proxiedSubtitleUrl = getSubtitleProxyUrl(subtitleUrl);

          return {
            id: String(idx),
            url: proxiedSubtitleUrl,
            src: proxiedSubtitleUrl,
            originalUrl: subtitleUrl,
            text: getSubtitleLabel(sub, idx),
            language: getSubtitleLanguage(sub),
            format: 'webvtt',
            isDefault: idx === 0,
            default: idx === 0,
          };
        })
        .filter((sub) => Boolean(sub.src && sub.src.trim()));

    } catch (subError) {
      console.error('Error fetching subtitles from BytePlus:', subError);
    }

    console.log('Final subtitles sent to frontend:', subtitles);

    return NextResponse.json({
      playAuthToken,
      playDomain: process.env.BYTEPLUS_VOD_PLAY_DOMAIN || '',
      subtitles,
    });
  } catch (error) {
    console.error('Error generating play auth token:', error);

    return NextResponse.json(
      { error: 'Failed to generate play auth token' },
      { status: 500 }
    );
  }
}
