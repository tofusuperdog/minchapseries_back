'use client';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Minor badges for language
function LangBadge({ label, active }) {
  if (!active) return null;
  return (
    <span className="border border-gray-600 text-gray-300 text-[10px] w-6 h-4 rounded flex items-center justify-center font-medium">
      {label}
    </span>
  );
}

// Render lang row
function renderLangs(item, prefix) {
  const langs = ['th', 'en', 'jp', 'cn'];
  const activeLangs = langs.filter(lang => item[`${prefix}_${lang}`]);

  if (activeLangs.length === 0) return <span className="text-gray-500">-</span>;

  return (
    <div className="flex space-x-1">
      {activeLangs.map(lang => (
        <LangBadge key={lang} label={lang.toUpperCase()} active={true} />
      ))}
    </div>
  );
}

function StatusColumn({ status, missingEpisodes, seriesId, onPublish, onUnpublish }) {
  if (status === 'published') {
    return (
      <div className="w-[160px] flex flex-col items-center">
        <div className="bg-[#C7F1C9] text-[#2d4f29] font-medium text-[13px] py-1.5 w-full text-center rounded mb-1 border border-[#b2e5b5]">
          เผยแพร่แล้ว (3 วัน)
        </div>
        <button onClick={() => onUnpublish(seriesId)} className="text-[10px] text-[#a4d7a4] hover:text-[#8ac58a] underline cursor-pointer mb-5">ยกเลิกการเผยแพร่</button>

        <Link href={`/series/${seriesId}`} className="text-gray-300 hover:text-white underline text-xs font-light mb-2">รายละเอียด</Link>
        <Link href={`/series/${seriesId}/episodes`} className="text-gray-300 hover:text-white underline text-xs font-light">จัดการตอน</Link>
      </div>
    );
  } else if (status === 'ready') {
    return (
      <div className="w-[160px] flex flex-col items-center">
        <div className="bg-[#FAE7B5] text-[#6b5214] font-medium text-[13px] py-1.5 w-full text-center rounded mb-1 border border-[#ebd6a1]">
          พร้อมเผยแพร่
        </div>
        <button onClick={() => onPublish(seriesId)} className="text-[10px] text-[#ebd6a1] hover:text-yellow-200 underline cursor-pointer mb-5 text-[#ebd6a1]">เผยแพร่ซีรีส์</button>

        <Link href={`/series/${seriesId}`} className="text-gray-300 hover:text-white underline text-xs font-light mb-2">รายละเอียด</Link>
        <Link href={`/series/${seriesId}/episodes`} className="text-gray-300 hover:text-white underline text-xs font-light">จัดการตอน</Link>
      </div>
    );
  } else {
    return (
      <div className="w-[160px] flex flex-col items-center">
        <div className="bg-[#FCB3B6] text-[#712025] font-medium text-[13px] py-1.5 w-full text-center rounded mb-1 border border-[#ee9f9f]">
          ยังไม่พร้อมเผยแพร่
        </div>
        <div className="text-[10px] text-red-400 mb-5 text-center">วิดีโอไม่พร้อม {missingEpisodes} ตอน</div>

        <Link href={`/series/${seriesId}`} className="text-gray-300 hover:text-white underline text-xs font-light mb-2">รายละเอียด</Link>
        <Link href={`/series/${seriesId}/episodes`} className="text-gray-300 hover:text-white underline text-xs font-light">จัดการตอน</Link>
      </div>
    );
  }
}

export default function SeriesPage() {
  const [series, setSeries] = useState([]);
  const [genres, setGenres] = useState([]);
  const [episodeCounts, setEpisodeCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Fetch genres
      const { data: genresData } = await supabase.from('genre').select('id, name_th');
      if (genresData) setGenres(genresData);

      // Fetch series
      const { data: seriesData } = await supabase.from('series').select('*');
      if (seriesData) setSeries(seriesData);

      // Fetch episode counts
      const { data: epData } = await supabase.from('episode').select('series_id');
      if (epData) {
        const counts = {};
        epData.forEach(ep => {
          counts[ep.series_id] = (counts[ep.series_id] || 0) + 1;
        });
        setEpisodeCounts(counts);
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  const handlePublish = async (id) => {
    const { error } = await supabase.from('series').update({ status: 'published' }).eq('id', id);
    if (!error) {
      setSeries(prev => prev.map(s => s.id === id ? { ...s, status: 'published' } : s));
    }
  };

  const handleUnpublish = async (id) => {
    const { error } = await supabase.from('series').update({ status: 'not_ready' }).eq('id', id);
    if (!error) {
      setSeries(prev => prev.map(s => s.id === id ? { ...s, status: 'not_ready' } : s));
    }
  };

  const getGenreNames = (genreIds) => {
    if (!genreIds || !Array.isArray(genreIds)) return [];
    return genreIds.map(id => genres.find(g => g.id === id)?.name_th).filter(Boolean);
  };

  const filteredSeries = useMemo(() => {
    let filtered = series;

    // Filter by Search
    if (searchTerm.trim()) {
      filtered = filtered.filter(s => s.title_th?.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Filter by Status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Sort logic (Thai Alphabetical)
    return filtered.sort((a, b) => a.title_th?.localeCompare(b.title_th, 'th'));
  }, [series, searchTerm, statusFilter]);

  return (
    <div className="w-full pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3 text-white">
          <div className="relative w-6 h-6">
            <Image src="/series.svg" alt="Series" fill sizes="24px" style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="text-xl font-semibold tracking-wide">ซีรีส์</h1>
        </div>
        <Link
          href="/series/create"
          className="bg-[#5c85f1] hover:bg-[#4a72d7] transition-colors text-white px-5 py-2 rounded font-medium text-sm cursor-pointer"
        >
          เพิ่มซีรีส์ใหม่
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#181236]/80 border border-[#2d2252] rounded-md px-5 py-3 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="text-gray-300 font-light text-[15px]">
          ทั้งหมด {filteredSeries.length} ซีรีส์
        </div>

        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative w-[240px]">
            <input
              type="text"
              placeholder="ชื่อเรื่อง"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-4 pr-10 bg-[#3a305d] border border-[#2d2252] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#709bf0] placeholder-gray-400"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="relative w-[180px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 pl-4 pr-8 bg-[#3a305d] border border-[#2d2252] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#709bf0] appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.5rem_center] bg-[length:1rem_1rem]"
            >
              <option value="all">ทุกประเภท</option>
              <option value="not_ready">ยังไม่พร้อมเผยแพร่</option>
              <option value="ready">พร้อมเผยแพร่</option>
              <option value="published">เผยแพร่แล้ว</option>
            </select>
          </div>
        </div>
      </div>

      {/* Series List */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-300">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C72FF] mr-3"></div>
            กำลังโหลดข้อมูล...
          </div>
        ) : filteredSeries.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-[#181236]/40 border border-[#2d2252] rounded-md">
            {series.length === 0 ? 'ยังไม่มีซีรีส์ในระบบ กรุณาเพิ่มซีรีส์ใหม่' : 'ไม่พบซีรีส์ที่ค้นหา'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSeries.map((s) => {
              const readyEpisodes = episodeCounts[s.id] || 0;
              const missingEpisodes = Math.max(0, s.total_episodes - readyEpisodes);
              let computedStatus = s.status;
              if (s.status !== 'published') {
                computedStatus = missingEpisodes <= 0 ? 'ready' : 'not_ready';
              }

              return (
              <div key={s.id} className="bg-[#181236]/60 border border-[#2d2252] rounded-lg p-5 flex gap-6 hover:bg-[#181236]/90 transition-colors shadow-lg">

                {/* Poster */}
                <div className="w-[100px] h-[140px] shrink-0 bg-[#0d0a1b] rounded overflow-hidden relative border border-gray-700">
                  {s.poster_url ? (
                    <Image src={s.poster_url} alt={s.title_th} fill sizes="100px" style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No Image</div>
                  )}
                </div>

                {/* Titles & Genres */}
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h2 className="text-[22px] font-medium text-white mb-2 leading-tight tracking-wide">{s.title_th}</h2>
                    <div className="space-y-[2px]">
                      {s.title_en && <div className="text-[13px] text-gray-300 font-light"><span className="text-gray-500 tracking-wider">EN:</span> {s.title_en}</div>}
                      {s.title_jp && <div className="text-[13px] text-gray-300 font-light"><span className="text-gray-500 tracking-wider">JP:</span> {s.title_jp}</div>}
                      {s.title_cn && <div className="text-[13px] text-gray-300 font-light"><span className="text-gray-500 tracking-wider">CN:</span> {s.title_cn}</div>}
                    </div>
                  </div>

                  {/* Genres */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {getGenreNames(s.genre_ids).map((genre, idx) => (
                      <span key={idx} className="border border-gray-500 text-gray-300 text-[10px] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-px bg-[#2d2252] my-1 mx-2"></div>

                {/* Statistics */}
                <div className="w-[180px] shrink-0 py-1 text-[13px] text-gray-300 font-light flex flex-col justify-center space-y-2">
                  <div className="flex justify-between">
                    <span>ทั้งหมด</span>
                    <span>{s.total_episodes} ตอน</span>
                  </div>
                  {s.status === 'published' ? (
                    <>
                      <div className="flex justify-between">
                        <span>ยอดวิว</span>
                        <span className="text-white">999 ตอน</span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span>ยอดซื้อ</span>
                        <span className="text-white">300 ตอน</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>พร้อม</span>
                        <span>{readyEpisodes} ตอน</span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span>ขาด</span>
                        <span className={missingEpisodes > 0 ? "text-red-400" : ""}>{missingEpisodes} ตอน</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center">
                    <span>เสียงพากย์</span>
                    <div className="flex justify-end">{renderLangs(s, 'dub')}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>คำบรรยาย</span>
                    <div className="flex justify-end">{renderLangs(s, 'sub')}</div>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-px bg-[#2d2252] my-1 mx-2"></div>

                {/* Status & Actions */}
                <div className="w-[160px] shrink-0 py-1 flex items-center justify-center">
                  <StatusColumn 
                    status={computedStatus} 
                    missingEpisodes={missingEpisodes} 
                    seriesId={s.id} 
                    onPublish={handlePublish}
                    onUnpublish={handleUnpublish}
                  />
                </div>

              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
