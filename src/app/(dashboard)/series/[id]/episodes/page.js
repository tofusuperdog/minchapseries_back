'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import '@byteplus/veplayer/index.min.css';

// Helper component for BytePlus VePlayer
function VePlayerComponent({ vid, playAuthToken, playDomain, lineAppId, lineUserId, subtitles }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !vid || !playAuthToken) return;

    let cancelled = false;

    const initPlayer = async () => {
      try {
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }

        containerRef.current.innerHTML = '';

        // Dynamic import to avoid SSR issues with VePlayer
        const VePlayerModule = await import('@byteplus/veplayer');
        const VePlayer = VePlayerModule.default || VePlayerModule;

        const playerId = `veplayer-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        containerRef.current.id = playerId;

        const license = process.env.NEXT_PUBLIC_BYTEPLUS_LICENSE;
        const parsedLineAppId = Number(lineAppId);
        const vodLogOpts = Number.isFinite(parsedLineAppId) && parsedLineAppId > 0
          ? {
            line_app_id: parsedLineAppId,
            line_user_id: lineUserId || `web-${Date.now()}`,
          }
          : undefined;

        // Web Player SDK requires the license to be configured before init.
        if (license && typeof VePlayer.setLicenseConfig === 'function') {
          await VePlayer.setLicenseConfig({ license });
        }

        if (cancelled) return;

        const playerConfig = {
          id: playerId,
          vid,
          getVideoByToken: {
            playAuthToken,
            ...(playDomain ? { playDomain } : {}),
          },
          lang: 'en',
          width: '100%',
          height: '100%',
          license: license || undefined,
          ...(vodLogOpts ? { vodLogOpts } : {}),
          autoplay: true,
          enableMenu: true,
          controls: true,
          controlBar: {
            visible: true,
          },
        };

        // Add Subtitle support if provided
        if (subtitles && subtitles.length > 0) {
          playerConfig.plugins = [VePlayer.Subtitle];
          playerConfig.Subtitle = {
            isDefaultOpen: true,
            list: subtitles.map((sub, idx) => ({
              id: sub.id || String(idx),
              src: sub.src,
              text: sub.text,
              language: sub.language || sub.text,
              default: sub.default || idx === 0,
            })),
          };
        }

        playerRef.current = new VePlayer(playerConfig);
      } catch (error) {
        console.error('Failed to initialize BytePlus player:', error);
      }
    };

    initPlayer();

    return () => {
      cancelled = true;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [vid, playAuthToken, playDomain, lineAppId, lineUserId, subtitles]);

  return <div ref={containerRef} className="w-full h-full bg-black" />;
}


// Helper for pill badges
function LangBadge({ label, active }) {
  if (!active) return null;
  return (
    <span className="border border-gray-500 text-[#f3f4f6] text-[11px] w-8 h-5 rounded flex items-center justify-center font-medium opacity-90">
      {label}
    </span>
  );
}

function LangPrefix({ label, active }) {
  if (!active) return null;
  return (
    <span className="w-9 h-6 border border-gray-500 rounded flex items-center justify-center text-[11px] text-gray-300 tracking-wider mr-3 shrink-0">
      {label}
    </span>
  );
}

const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const PlayIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polygon points="10 8 16 12 10 16 10 8"></polygon>
  </svg>
);

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"></path>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

export default function EpisodesPage() {
  const router = useRouter();
  const { id: seriesId } = useParams();

  const [series, setSeries] = useState(null);
  const [genres, setGenres] = useState([]);
  const [savedEpisodes, setSavedEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [videoLink, setVideoLink] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [episodeToDelete, setEpisodeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Video Playing State
  const [playingVid, setPlayingVid] = useState(null);
  const [playAuthToken, setPlayAuthToken] = useState(null);
  const [playDomain, setPlayDomain] = useState('');
  const [playingSubtitles, setPlayingSubtitles] = useState([]);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  // Notification State
  const [errorMsg, setErrorMsg] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const errorTimeoutRef = useRef(null);

  const showError = (msg) => {
    setErrorMsg(msg);
    setErrorVisible(true);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setErrorVisible(false);
    }, 4000);
  };

  const closeVideoModal = () => {
    setPlayingVid(null);
    setPlayAuthToken(null);
    setPlayDomain('');
    setPlayingSubtitles([]);
  };

  const playVideo = async (episode) => {
    const vid = episode?.video_url || '';
    const cleanVid = typeof vid === 'string' ? vid.trim() : '';
    if (!cleanVid) return;
    setIsVideoLoading(true);
    setPlayingVid(cleanVid);
    setPlayingSubtitles([]);
    try {
      const res = await fetch(`/api/vod/playauth?vid=${encodeURIComponent(cleanVid)}`);
      const data = await res.json();
      if (res.ok && data.playAuthToken) {
        setPlayAuthToken(data.playAuthToken);
        setPlayDomain(data.playDomain || '');

        // Use the ones from API
        if (data.subtitles && data.subtitles.length > 0) {
          console.log(data.subtitles);
          setPlayingSubtitles(data.subtitles);
        }
      } else {
        alert('ไม่สามารถดึงข้อมูลสำหรับเล่นวิดีโอได้ (Failed to load token)');
        closeVideoModal();
      }
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ (Error fetching token)');
      closeVideoModal();
    } finally {
      setIsVideoLoading(false);
    }
  };

  const confirmDeleteEpisode = async () => {
    if (!episodeToDelete) return;
    setIsDeleting(true);
    const { error } = await supabase.from('episode').delete().eq('series_id', seriesId).eq('episode_no', episodeToDelete);
    if (!error) {
      setSavedEpisodes(prev => prev.filter(e => e.episode_no !== episodeToDelete));
      setShowDeleteModal(false);
      setEpisodeToDelete(null);
    } else {
      alert("ลบไม่สำเร็จ: " + error.message);
    }
    setIsDeleting(false);
  };

  const openModal = (epNum) => {
    setSelectedEpisode(epNum);
    const existing = savedEpisodes.find(e => e.episode_no === epNum);
    setVideoLink(existing ? (existing.video_url || '') : '');
    setIsFree(existing ? existing.is_free : false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setVideoLink('');
    setIsFree(false);
    setSelectedEpisode(null);
  };

  const saveEpisode = async () => {
    const cleanedVideoLink = videoLink.trim();

    if (!cleanedVideoLink) {
      showError('กรุณากรอก vid');
      return;
    }

    setIsSaving(true);
    const payload = {
      series_id: seriesId,
      episode_no: selectedEpisode,
      video_url: cleanedVideoLink,
      is_free: isFree,
    };

    const { data, error } = await supabase
      .from('episode')
      .upsert(payload, { onConflict: 'series_id, episode_no' })
      .select('*');

    if (error) {
      alert('บันทึกผิดพลาด: ' + error.message);
    } else {
      setSavedEpisodes(prev => {
        const others = prev.filter(e => e.episode_no !== selectedEpisode);
        if (data && data.length > 0) {
          return [...others, data[0]];
        }
        return [...others, payload]; // fallback
      });
      closeModal();
    }
    setIsSaving(false);
  };

  // Fetch Series & Genres
  useEffect(() => {
    async function fetchData() {
      if (!seriesId) return;

      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        setCurrentUserId(authData.user.id);
      }

      // Fetch genres
      const { data: gData } = await supabase.from('genre').select('id, name_th');
      if (gData) setGenres(gData);

      // Fetch series by ID
      const { data: sData, error: sError } = await supabase
        .from('series')
        .select('*')
        .eq('id', seriesId)
        .single();

      if (sError || !sData) {
        console.error("Error fetching series data:", sError);
        alert('ไม่พบข้อมูลซีรีส์');
        router.push('/series');
        return;
      }

      // Fetch episodes
      const { data: epData } = await supabase.from('episode').select('*').eq('series_id', seriesId);
      if (epData) setSavedEpisodes(epData);

      setSeries(sData);
      setLoading(false);
    }
    fetchData();
  }, [seriesId, router]);

  if (loading || !series) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C72FF]"></div>
        <span className="ml-4 text-gray-300">กำลังโหลด...</span>
      </div>
    );
  }

  // Get genre names
  const genreNames = (series.genre_ids || [])
    .map(id => genres.find(g => g.id === id)?.name_th)
    .filter(Boolean);

  const episodes = Array.from({ length: series.total_episodes }, (_, i) => i + 1);

  return (
    <div className="w-full pb-20 relative">
      {/* Error Notification */}
      <div
        className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${errorVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}
        style={{ display: errorMsg ? 'block' : 'none' }}
      >
        <div className="bg-[#D24949] text-white px-6 py-3.5 rounded shadow-2xl flex items-center space-x-4 w-max min-w-[300px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L22 20H2L12 2ZM11 16V18H13V16H11ZM11 10V14H13V10H11Z" />
          </svg>
          <span className="font-medium tracking-wide">{errorMsg}</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center space-x-3 mb-8 text-white">
        <div className="relative w-9 h-9">
          <Image src="/series.svg" alt="Series" fill sizes="36px" style={{ objectFit: 'contain' }} />
        </div>
        <h1 className="text-xl text-gray-300 font-semibold tracking-wide flex items-center gap-2 truncate">
          <Link href="/series" className="hover:text-white transition-colors underline underline-offset-4 shrink-0">ซีรีส์</Link>
          <span className="text-gray-500 font-light text-[15px] shrink-0">&gt;</span>
          <Link href={`/series/${seriesId}`} className="hover:text-white transition-colors underline underline-offset-4 truncate" title={series.title_th}>
            {series.title_th}
          </Link>
          <span className="text-gray-500 font-light text-[15px] shrink-0">&gt;</span>
          <span className="text-white font-light shrink-0">จัดการตอน</span>
        </h1>
      </div>

      <div className="bg-[#181236]/70 border border-[#2d2252] rounded-lg p-8 shadow-lg space-y-8">
        {/* Info Card */}
        <div className="flex gap-8">
          {/* Poster */}
          <div className="w-[200px] h-[280px] shrink-0 bg-[#0d0a1b] rounded overflow-hidden relative border border-gray-700 shadow-lg">
            {series.poster_url ? (
              <Image src={series.poster_url} alt={series.title_th} fill sizes="200px" style={{ objectFit: 'cover' }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No Image</div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col pt-1">
            <div className="space-y-2 mb-6">
              <div className="flex items-center text-xl text-white tracking-wide font-medium">
                <LangPrefix label="TH" active={true} />
                {series.title_th}
              </div>
              {series.title_en && (
                <div className="flex items-center text-[15px] text-gray-300 font-light">
                  <LangPrefix label="EN" active={true} />
                  {series.title_en}
                </div>
              )}
              {series.title_jp && (
                <div className="flex items-center text-[15px] text-gray-300 font-light">
                  <LangPrefix label="JP" active={true} />
                  {series.title_jp}
                </div>
              )}
              {series.title_cn && (
                <div className="flex items-center text-[15px] text-gray-300 font-light">
                  <LangPrefix label="CN" active={true} />
                  {series.title_cn}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {genreNames.map((name, idx) => (
                <span key={idx} className="border border-gray-500 text-gray-200 text-[13px] px-3 py-1 rounded-md">
                  {name}
                </span>
              ))}
            </div>


            <div className="space-y-3 flex flex-col">
              <div className="flex items-center text-[15px] text-gray-300 font-light space-x-3">
                <span className="w-20">เสียงพากย์</span>
                <div className="flex space-x-2">
                  {['th', 'en', 'jp', 'cn'].map(lang => (
                    <LangBadge key={lang} label={lang.toUpperCase()} active={series[`dub_${lang}`]} />
                  ))}
                </div>
              </div>
              <div className="flex items-center text-[15px] text-gray-300 font-light space-x-3">
                <span className="w-20">บรรยาย</span>
                <div className="flex space-x-2">
                  {['th', 'en', 'jp', 'cn'].map(lang => (
                    <LangBadge key={lang} label={lang.toUpperCase()} active={series[`sub_${lang}`]} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Episodes Table Container */}
        <div className="border border-[#2d2252] rounded-lg overflow-hidden bg-[#12102f]/80 shadow-xl">
          <table className="w-full text-center text-sm font-light text-gray-300">
            <thead>
              <tr className="border-b border-[#2d2252]">
                <th className="font-light py-4 w-[15%]">ตอน</th>
                <th className="font-light py-4 w-[25%]">สถานะ</th>
                <th className="font-light py-4 w-[20%]">เล่น</th>
                <th className="font-light py-4 w-[20%]">แก้ไข</th>
                <th className="font-light py-4 w-[20%]">ลบ</th>
              </tr>
            </thead>
            <tbody>
              {episodes.map((ep, idx) => {
                const savedEp = savedEpisodes.find(e => e.episode_no === ep);

                return (
                  <tr
                    key={ep}
                    className={`transition-colors h-14 ${idx % 2 === 0 ? 'bg-white/5' : ''} hover:bg-[#28214f]/50`}
                  >
                    <td className="py-3 font-medium">{ep}</td>
                    {savedEp ? (
                      <>
                        <td className="py-3 text-center">
                          <div className="flex justify-center items-center text-gray-300">
                            {savedEp.is_free ? (
                              <span className="text-[13px] font-medium">ฟรี</span>
                            ) : (
                              <LockIcon />
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center items-center">
                            {savedEp.video_url ? (
                              <button onClick={() => playVideo(savedEp)} className="text-green-500 hover:text-green-400 transition-colors cursor-pointer outline-none">
                                <PlayIcon />
                              </button>
                            ) : (
                              <span className="text-gray-600 cursor-not-allowed">
                                <PlayIcon />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center items-center">
                            <button onClick={() => openModal(ep)} className="text-[#a1a1aa] hover:text-white transition-colors cursor-pointer">
                              <EditIcon />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center items-center">
                            <button onClick={() => {
                              setEpisodeToDelete(ep);
                              setShowDeleteModal(true);
                            }} className="text-[#a1a1aa] hover:text-red-400 transition-colors cursor-pointer">
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <td colSpan={4} className="py-3">
                        <button
                          onClick={() => openModal(ep)}
                          className="text-[#a1a1aa] underline underline-offset-4 cursor-pointer hover:text-white transition-colors text-[13px]"
                        >
                          เพิ่มวิดีโอ
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {episodes.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-gray-500">
                    ไม่มีตอนในระบบ (จำนวนตอนเป็น 0)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm backdrop-grayscale">
          <div className="bg-[#12102f] border border-[#2d2252] w-full max-w-[500px] rounded-xl shadow-2xl overflow-hidden flex flex-col relative text-white">

            {/* Modal Header */}
            <div className="flex items-center justify-center px-6 py-4 border-b border-[#2d2252] relative">
              <h2 className="text-lg font-medium tracking-wide">
                {savedEpisodes.some(e => e.episode_no === selectedEpisode) ? 'แก้ไขวีดีโอ' : 'เพิ่มวีดีโอ'}
              </h2>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="flex gap-5 mb-6">
                <div className="w-[100px] h-[140px] shrink-0 bg-[#0d0a1b] rounded overflow-hidden relative border border-gray-700 shadow">
                  {series.poster_url ? (
                    <Image src={series.poster_url} alt={series.title_th} fill sizes="100px" style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px]">No Image</div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center space-y-2">
                  <div className="flex items-center text-[16px] font-medium">
                    <LangPrefix label="TH" active={true} />
                    <span className="line-clamp-1 break-all">{series.title_th}</span>
                  </div>
                  {series.title_en && (
                    <div className="flex items-center text-[14px] text-gray-300">
                      <LangPrefix label="EN" active={true} />
                      <span className="line-clamp-1 break-all">{series.title_en}</span>
                    </div>
                  )}
                  {series.title_jp && (
                    <div className="flex items-center text-[14px] text-gray-300">
                      <LangPrefix label="JP" active={true} />
                      <span className="line-clamp-1 break-all">{series.title_jp}</span>
                    </div>
                  )}
                  {series.title_cn && (
                    <div className="flex items-center text-[14px] text-gray-300">
                      <LangPrefix label="CN" active={true} />
                      <span className="line-clamp-1 break-all">{series.title_cn}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Episode Banner */}
              <div className="bg-[#1a1738] rounded-md text-center py-2.5 mb-6 border border-[#2d2252] shadow-inner">
                <span className="text-gray-200 text-[15px] font-medium tracking-wide">ตอนที่ {selectedEpisode}</span>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <label className="w-24 text-[13px] text-gray-300">vid</label>
                  <input
                    type="text"
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    className="flex-1 bg-white text-black px-3 py-2 rounded text-[13px] outline-none w-full shadow-sm"
                  />
                </div>
                <div className="flex items-center pb-2">
                  <label className="w-24 text-[13px] text-gray-300">สถานะ</label>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center cursor-pointer space-x-2">
                      <input
                        type="radio"
                        name="status"
                        checked={!isFree}
                        onChange={() => setIsFree(false)}
                        className="w-4 h-4 bg-transparent border-gray-500 cursor-pointer accent-[#5c67f2]"
                      />
                      <span className="text-[13px] text-gray-300">จ่ายเงิน</span>
                    </label>
                    <label className="flex items-center cursor-pointer space-x-2">
                      <input
                        type="radio"
                        name="status"
                        checked={isFree}
                        onChange={() => setIsFree(true)}
                        className="w-4 h-4 bg-transparent border-gray-500 cursor-pointer accent-[#5c67f2]"
                      />
                      <span className="text-[13px] text-gray-300">ฟรี</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-center pt-2 gap-4">
                  <button
                    onClick={closeModal}
                    className="px-8 py-2 border border-gray-600 hover:bg-white/5 text-white rounded-md transition-colors text-[14px] cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={saveEpisode}
                    disabled={isSaving}
                    className="px-8 py-2 bg-[#5c67f2] hover:bg-[#4a54c4] text-white rounded-md transition-colors disabled:opacity-50 text-[14px] cursor-pointer"
                  >
                    {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm backdrop-grayscale">
          <div className="bg-[#12102f] border border-[#2d2252] w-full max-w-[400px] rounded-xl shadow-2xl overflow-hidden flex flex-col relative text-white">
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <h2 className="text-xl font-medium text-center tracking-wide">ยืนยันการลบ</h2>
              <p className="text-[13px] text-gray-300 text-center leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบวิดีโอตอนที่ <span className="text-white font-medium">{episodeToDelete}</span>? <br />
                หากลบแล้วจะไม่สามารถกู้คืนข้อมูลของตอนนี้ได้
              </p>
              <div className="flex w-full space-x-4 pt-6">
                <button
                  onClick={confirmDeleteEpisode}
                  disabled={isDeleting}
                  className="flex-1 bg-[#D24949] hover:bg-red-500 text-white px-4 py-2.5 rounded-md transition-colors disabled:opacity-50 text-[14px]"
                >
                  {isDeleting ? 'กำลังลบ...' : 'ลบข้อมูล'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setEpisodeToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 border border-gray-600 hover:bg-white/5 text-white px-4 py-2.5 rounded-md transition-colors disabled:opacity-50 text-[14px]"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {playingVid && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-md backdrop-grayscale" onContextMenu={(e) => e.preventDefault()}>
          <button onClick={closeVideoModal} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-[80] outline-none">
            <div className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <XIcon />
            </div>
          </button>

          <div
            className="w-full max-w-5xl aspect-video relative rounded-lg overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 bg-black select-none"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onMouseDown={(e) => {
              if (e.button === 2) e.preventDefault();
            }}
            onTouchStart={(e) => e.preventDefault()}
          >
            {isVideoLoading || !playAuthToken ? (
              <div className="absolute inset-0 z-[70] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5c67f2]"></div>
              </div>
            ) : (
              <VePlayerComponent
                vid={playingVid}
                playAuthToken={playAuthToken}
                playDomain={playDomain}
                lineAppId={1006938}
                lineUserId={currentUserId}
                subtitles={playingSubtitles}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
