'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

function BannerEditModal({ isOpen, onClose, bannerIndex, seriesList, onSave, isSaving }) {
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [selectedSeries, setSelectedSeries] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (seriesList && seriesList.length > 0) {
        setSelectedSeriesId(String(seriesList[0].id));
        setSelectedSeries(seriesList[0]);
      } else {
        setSelectedSeriesId('');
        setSelectedSeries(null);
      }
    }
  }, [isOpen, seriesList]);

  const handleSelectChange = (e) => {
    const id = e.target.value;
    setSelectedSeriesId(id);
    const series = seriesList.find(s => String(s.id) === id);
    setSelectedSeries(series || null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px] backdrop-grayscale">
      <div className="bg-[#12102f] border border-[#2d2252] rounded-xl w-full max-w-[620px] shadow-2xl p-8 py-10 relative">
        <h2 className="text-2xl font-semibold text-white text-center mb-8 tracking-wide flex items-center justify-center gap-3">
          แบนเนอร์ 
          <span className="w-9 h-9 rounded-full bg-[#52417e] text-white flex items-center justify-center text-[18px] font-medium shadow-md">
            {bannerIndex}
          </span>
        </h2>

        <div className="px-2">
          <span className="block text-[15px] font-light text-gray-300 mb-2">เลือกซีรีส์</span>
          
          <div className="relative mb-6">
            <select 
              value={selectedSeriesId}
              onChange={handleSelectChange}
              disabled={isSaving}
              className="w-full h-11 px-4 bg-white rounded text-black font-medium text-[15px] focus:outline-none focus:ring-2 focus:ring-[#709bf0] appearance-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {seriesList.length === 0 && <option value="" disabled>ไม่มีซีรีส์...</option>}
              {seriesList.map(s => (
                <option key={s.id} value={s.id}>{s.title_th}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Series Detail preview */}
          {selectedSeries && (
            <div className="flex gap-5 mb-8">
              <div className="w-[130px] aspect-[2/3] relative rounded overflow-hidden shadow-md shrink-0 bg-[#0d0a1b]">
                {selectedSeries.poster_url ? (
                  <Image src={selectedSeries.poster_url} alt={selectedSeries.title_th} fill sizes="130px" style={{ objectFit: 'cover' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">No Image</div>
                )}
              </div>
              
              <div className="flex flex-col justify-center space-y-3.5 py-1 flex-1 overflow-hidden">
                <div className="flex items-center gap-3">
                  <span className="w-[34px] h-[26px] border border-gray-400 rounded flex items-center justify-center text-[11px] font-medium text-gray-300 shrink-0 bg-white/5">TH</span>
                  <span className="text-gray-200 text-[14px] truncate" title={selectedSeries.title_th}>{selectedSeries.title_th || '-'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-[34px] h-[26px] border border-gray-400 rounded flex items-center justify-center text-[11px] font-medium text-gray-300 shrink-0 bg-white/5">EN</span>
                  <span className="text-gray-200 text-[14px] truncate" title={selectedSeries.title_en}>{selectedSeries.title_en || '-'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-[34px] h-[26px] border border-gray-400 rounded flex items-center justify-center text-[11px] font-medium text-gray-300 shrink-0 bg-white/5">JP</span>
                  <span className="text-gray-200 text-[14px] truncate" title={selectedSeries.title_jp}>{selectedSeries.title_jp || '-'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-[34px] h-[26px] border border-gray-400 rounded flex items-center justify-center text-[11px] font-medium text-gray-300 shrink-0 bg-white/5">CN</span>
                  <span className="text-gray-200 text-[14px] truncate" title={selectedSeries.title_cn}>{selectedSeries.title_cn || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {!selectedSeries && (
             <div className="h-[195px] mb-8 border border-dashed border-[#2d2252] rounded-lg flex items-center justify-center bg-[#181236]/30 text-gray-500 font-light text-[14px]">
               กรุณาเลือกซีรีส์เพื่อดูข้อมูล
             </div>
          )}

          <div className="flex justify-center gap-4 mt-2">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="w-[160px] h-11 border border-gray-500 hover:bg-white/5 transition-colors rounded text-gray-300 font-light cursor-pointer text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => onSave(bannerIndex, selectedSeriesId)}
              disabled={isSaving || !selectedSeriesId}
              className="w-[160px] h-11 bg-[#5c85f1] hover:bg-[#4a72d7] transition-colors rounded text-white font-medium cursor-pointer text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DisplaysPage() {
  const [activeTab, setActiveTab] = useState('main_banner');
  const [seriesList, setSeriesList] = useState([]);
  const [editingBanner, setEditingBanner] = useState(null);
  
  // Banner state
  const [mainBanners, setMainBanners] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = async () => {
    setLoading(true);
    // Fetch series
    const { data: sData, error: sError } = await supabase
      .from('series')
      .select('id, title_th, title_en, title_jp, title_cn, poster_url')
      .eq('status', 'published')
      .order('id', { ascending: false });

    if (!sError && sData) {
      const sortedData = sData.sort((a, b) => (a.title_th || '').localeCompare(b.title_th || '', 'th'));
      setSeriesList(sortedData);
    }

    // Fetch banners
    const { data: bData, error: bError } = await supabase
      .from('main_banner')
      .select('id, series_id, series:series_id(id, title_th, poster_url)');
    
    if (!bError && bData) {
      const bMap = {};
      bData.forEach(b => {
        bMap[b.id] = b;
      });
      setMainBanners(bMap);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSaveBanner = async (bannerIndex, seriesId) => {
    if (!seriesId) return;
    setIsSaving(true);
    
    const { error } = await supabase
      .from('main_banner')
      .upsert({ id: bannerIndex, series_id: parseInt(seriesId), updated_at: new Date().toISOString() });
      
    setIsSaving(false);
    
    if (error) {
      console.error('Error saving banner:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกแบนเนอร์');
    } else {
      setEditingBanner(null);
      fetchInitialData(); // Refresh to get the latest joined series data
    }
  };

  const tabs = [
    { id: 'main_banner', label: 'แบนเนอร์หลัก' },
    { id: 'top_ranking', label: 'อันดับยอดนิยม' },
    { id: 'content_category', label: 'หมวดคอนเทนต์' },
  ];

  return (
    <div className="w-full relative pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3 text-white">
          <div className="relative w-9 h-9">
            <Image src="/displays.svg" alt="Displays" fill sizes="36px" style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="text-xl text-gray-300 font-semibold tracking-wide">การแสดงผล</h1>
        </div>
      </div>

      {/* Tabs Container */}
      <div className="w-full bg-[#16132e] border border-[#2d2252] rounded-lg flex flex-col shadow-lg overflow-hidden">
        
        {/* Tab Headers */}
        <div className="flex border-b border-[#2d2252] bg-[#1a1733]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-3.5 text-[15px] transition-colors relative font-light cursor-pointer ${
                activeTab === tab.id
                  ? 'text-white bg-[#262247] shadow-inner'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-8 min-h-[500px]">
          {loading ? (
             <div className="flex items-center justify-center py-20 h-[400px]">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C72FF]"></div>
               <span className="ml-3 text-gray-300">กำลังโหลดข้อมูล...</span>
             </div>
          ) : activeTab === 'main_banner' && (
             <div className="w-full h-full">
               <div className="flex justify-between gap-6 w-full">
                 {[1, 2, 3, 4, 5].map((item) => {
                   const bannerData = mainBanners[item];
                   const hasBanner = bannerData && bannerData.series;

                   return (
                     <div key={item} className="flex flex-col items-center flex-1 max-w-[240px]">
                       {/* Placeholder Card */}
                       <div 
                         onClick={() => setEditingBanner(item)}
                         className="w-full flex flex-col rounded-md relative cursor-pointer overflow-hidden border border-transparent hover:border-[#5c85f1]/50 shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_16px_rgba(92,133,241,0.2)] transition-shadow"
                       >
                         {/* Number Badge (Always Top Right) */}
                         <div className="absolute top-3 right-3 w-[34px] h-[34px] rounded-full bg-[#52417e] text-white flex items-center justify-center text-[15px] font-medium shadow-md z-20">
                           {item}
                         </div>

                         {hasBanner ? (
                           <>
                             {/* Poster Area */}
                             <div className="w-full aspect-[2/3] relative bg-[#0d0a1b]">
                               {bannerData.series.poster_url && (
                                 <Image src={bannerData.series.poster_url} alt={bannerData.series.title_th} fill sizes="240px" style={{ objectFit: 'cover' }} className="z-0" />
                               )}
                             </div>
                             {/* Title Area */}
                             <div className="w-full h-[64px] bg-[#222222] flex items-center justify-center px-4 z-10">
                               <span className="text-[#e2e2e2] text-[14px] font-medium tracking-wide truncate block text-center w-full">
                                 {bannerData.series.title_th}
                               </span>
                             </div>
                           </>
                         ) : (
                           /* Empty Placeholder Area matching total height */
                           <div className="w-full flex items-center justify-center bg-[#dcdcdc] relative" style={{ paddingBottom: 'calc(150% + 64px)' }}>
                             <div className="absolute inset-0 flex items-center justify-center">
                               <span className="text-[140px] font-bold text-[#a0a0a0] leading-none select-none">
                                 ?
                               </span>
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>
          )}

          {activeTab === 'top_ranking' && (
            <div className="flex justify-center items-center h-[400px] text-gray-500 font-light">
              เนื้อหาของ อันดับยอดนิยม
            </div>
          )}

          {activeTab === 'content_category' && (
            <div className="flex justify-center items-center h-[400px] text-gray-500 font-light">
              เนื้อหาของ หมวดคอนเทนต์
            </div>
          )}
        </div>
      </div>

      <BannerEditModal 
        isOpen={editingBanner !== null}
        onClose={() => setEditingBanner(null)}
        bannerIndex={editingBanner}
        seriesList={seriesList}
        onSave={handleSaveBanner}
        isSaving={isSaving}
      />
    </div>
  );
}
