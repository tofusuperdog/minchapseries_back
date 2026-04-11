'use client';
import Image from "next/image";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

function GenreModal({ isOpen, title, formData, setFormData, onClose, onSave, isSaving }) {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  const languages = [
    { key: 'th', label: 'TH' },
    { key: 'en', label: 'EN' },
    { key: 'jp', label: 'JP' },
    { key: 'cn', label: 'CN' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
      <div className="bg-[#12102f] border border-[#504481] rounded-xl w-full max-w-[480px] shadow-2xl p-8 py-10">
        <h2 className="text-2xl font-semibold text-white text-center mb-10 tracking-wide">
          {title}
        </h2>

        <form onSubmit={handleSubmit} className="px-4">
          <span className="block text-[15px] font-light text-white mb-4">ชื่อแนวเรื่อง</span>
          
          <div className="space-y-4 mb-10">
            {languages.map((lang) => (
              <div key={lang.key} className="flex items-center space-x-3">
                <div className="w-10 h-10 border border-gray-400 rounded flex items-center justify-center text-sm font-medium text-white shrink-0 bg-white/5">
                  {lang.label}
                </div>
                <input
                  type="text"
                  required={lang.key === 'th'}
                  value={formData[lang.key]}
                  onChange={(e) => setFormData({ ...formData, [lang.key]: e.target.value })}
                  className="flex-1 h-10 px-3 bg-white rounded text-black focus:outline-none focus:ring-2 focus:ring-[#709bf0]"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-36 h-10 border border-gray-500 hover:bg-white/5 transition-colors rounded text-gray-300 font-light disabled:opacity-50 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-36 h-10 bg-[#5c85f1] hover:bg-[#4a72d7] transition-colors rounded text-white font-light disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GenresPage() {
  const [genres, setGenres] = useState([]);
  const [allSeries, setAllSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [editingGenre, setEditingGenre] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ th: '', en: '', jp: '', cn: '' });

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch genres
    const { data: gData, error: gError } = await supabase
      .from('genre')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    if (!gError && gData) {
      setGenres(gData);
    }
    
    // Fetch series
    const { data: sData, error: sError } = await supabase
      .from('series')
      .select('id, title_th, title_en, poster_url, genre_ids')
      .order('id', { ascending: false });
      
    if (!sError && sData) {
      setAllSeries(sData);
    }
    
    setLoading(false);
  };

  // Fetch when mounted
  useState(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setFormData({ th: '', en: '', jp: '', cn: '' });
    setEditingGenre(null);
    setModalMode('add');
  };

  const openEdit = (genre) => {
    setFormData({
      th: genre.name_th || '',
      en: genre.name_en || '',
      jp: genre.name_jp || '',
      cn: genre.name_cn || '',
    });
    setEditingGenre(genre);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
  };

  const handleSave = async () => {
    if (!formData.th.trim()) {
      alert('กรุณากรอกชื่อแนวเรื่องภาษาไทย');
      return;
    }

    setIsSaving(true);
    let error;

    if (modalMode === 'add') {
      const maxSortOrder = genres.length > 0 ? Math.max(...genres.map(g => g.sort_order || 0)) : 0;
      const { error: insertError } = await supabase.from('genre').insert({
        name_th: formData.th.trim(),
        name_en: formData.en.trim() || null,
        name_jp: formData.jp.trim() || null,
        name_cn: formData.cn.trim() || null,
        is_published: false,
        sort_order: maxSortOrder + 1
      });
      error = insertError;
    } else if (modalMode === 'edit' && editingGenre) {
      const { error: updateError } = await supabase.from('genre').update({
        name_th: formData.th.trim(),
        name_en: formData.en.trim() || null,
        name_jp: formData.jp.trim() || null,
        name_cn: formData.cn.trim() || null,
      }).eq('id', editingGenre.id);
      error = updateError;
    }

    setIsSaving(false);

    if (error) {
      console.error('Error saving genre:', error);
      alert('เกิดข้อผิดพลาด: ' + (error.message || 'ไม่สามารถบันทึกแนวเรื่องได้'));
    } else {
      closeModal();
      fetchData(); // Refresh list after saving
    }
  };

  const handleTogglePublish = async (genre) => {
    const newStatus = !genre.is_published;
    
    // Optimistic update
    setGenres(genres.map(g => g.id === genre.id ? { ...g, is_published: newStatus } : g));

    const { error } = await supabase
      .from('genre')
      .update({ is_published: newStatus })
      .eq('id', genre.id);

    if (error) {
      console.error('Error toggling publish:', error);
      fetchData(); // Revert on error
    }
  };

  const handleMove = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === genres.length - 1) return;

    const newGenres = [...genres];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap items locally
    const temp = newGenres[index];
    newGenres[index] = newGenres[targetIndex];
    newGenres[targetIndex] = temp;
    setGenres(newGenres);

    // Update sort_order for all items
    const updates = newGenres.map((g, i) => ({
      ...g,
      sort_order: i
    }));

    // Supabase upsert for bulk update
    const { error } = await supabase
      .from('genre')
      .upsert(updates);

    if (error) {
      console.error('Error updating order:', error);
      fetchData(); // Revert on error
    }
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center space-x-3 text-white mb-1">
            <div className="relative w-7 h-7">
              <Image src="/genres.svg" alt="Genres" fill sizes="28px" style={{ objectFit: 'contain' }} />
            </div>
            <h1 className="text-[26px] font-semibold tracking-wide">แนวเรื่อง</h1>
          </div>
          <p className="text-gray-500 text-sm pl-10">ลำดับการแสดงแนวเรื่องในแอป</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="bg-[#5c85f1] hover:bg-[#4a72d7] transition-colors text-white px-5 py-2.5 rounded font-medium text-[15px] cursor-pointer shadow-lg"
        >
          เพิ่มแนวเรื่อง
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C72FF]"></div>
          <span className="ml-3 text-gray-300">กำลังโหลด...</span>
        </div>
      ) : (
        /* List Container */
        <div className="space-y-6">
          {genres.length === 0 ? (
            <div className="text-center text-gray-500 py-10 bg-[#12102f] rounded-lg border border-[#2d2252]">ยังไม่มีกลุ่มแนวเรื่อง</div>
          ) : (
            genres.map((genre, index) => {
              const names = [genre.name_en, genre.name_jp, genre.name_cn].filter(Boolean).join(' - ');
              const genreSeries = allSeries.filter(s => s.genre_ids?.includes(genre.id));

              return (
                <div key={genre.id} className="bg-[#12102f] shadow-lg border border-[#2d2252] rounded-lg p-6 flex flex-col group transition-colors">
                  
                  {/* Genre Header Section */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-xl font-medium text-white tracking-wide">{genre.name_th}</h3>
                        <div className="border border-gray-600 rounded-full px-2.5 py-0.5 text-[11px] text-gray-300 bg-white/5">
                          {genreSeries.length} ซีรีส์
                        </div>
                      </div>
                      {names && (
                        <p className="text-[12px] font-light text-gray-300">{names}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-1">
                        {/* Up button */}
                        <button 
                          onClick={() => handleMove(index, 'up')} 
                          disabled={index === 0}
                          className={`p-1 cursor-pointer hover:bg-white/10 rounded transition-colors ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'text-[#3ceb8b]'}`}
                        >
                          <svg className="w-5 h-5 stroke-[4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        
                        {/* Down button */}
                        <button 
                          onClick={() => handleMove(index, 'down')} 
                          disabled={index === genres.length - 1}
                          className={`p-1 cursor-pointer hover:bg-white/10 rounded transition-colors ${index === genres.length - 1 ? 'opacity-30 cursor-not-allowed' : 'text-[#eb6161]'}`}
                        >
                          <svg className="w-5 h-5 stroke-[4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      <button 
                        onClick={() => openEdit(genre)}
                        className="p-2 cursor-pointer hover:bg-white/10 rounded transition-colors text-gray-300 hover:text-white" 
                        title="แก้ไข"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      <div className="flex flex-col items-center justify-center pt-1 min-w-[40px]">
                        {/* Toggle switch for is_published */}
                        <div 
                          onClick={() => handleTogglePublish(genre)}
                          className={`w-[42px] h-6 rounded-full relative cursor-pointer transition-colors ${genre.is_published ? 'bg-[#3ceb8b]' : 'bg-gray-500'}`}
                          title="เปิด/ปิดการเผยแพร่"
                        >
                          <div className={`w-[18px] h-[18px] bg-white rounded-full absolute top-[3px] transition-transform ${genre.is_published ? 'translate-x-[21px]' : 'translate-x-[3px]'}`} />
                        </div>
                        <span className="text-[10px] text-[#3ceb8b] mt-1 font-light tracking-wider opacity-80">เผยแพร่</span>
                      </div>
                    </div>
                  </div>

                  {/* Series Posters Strip */}
                  <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {genreSeries.map(s => (
                      <div key={s.id} className="flex-shrink-0 w-[110px] flex flex-col group cursor-pointer hover:opacity-80 transition-opacity">
                         <div className="w-[110px] h-[155px] relative rounded overflow-hidden mb-2 border border-[#2d2252] shadow-md">
                           {s.poster_url ? (
                             <Image src={s.poster_url} alt={s.title_th} fill sizes="110px" style={{objectFit: 'cover'}}/>
                           ) : (
                             <div className="bg-[#0d0a1b] w-full h-full text-[10px] flex items-center justify-center text-gray-600">No Image</div>
                           )}
                         </div>
                         <div className="text-[11px] text-gray-200 truncate w-full pt-1" title={s.title_en || s.title_th}>
                            {s.title_en || s.title_th}
                         </div>
                         <div className="text-[10px] text-gray-500 truncate w-full font-light" title={s.title_th}>
                            {s.title_th}
                         </div>
                      </div>
                    ))}
                    {genreSeries.length === 0 && (
                      <div className="w-full py-8 text-center text-sm text-gray-600 border border-dashed border-[#2d2252] rounded">
                         ยังไม่มีซีรีส์ในแนวเรื่องนี้
                      </div>
                    )}
                  </div>

                </div>
              )
            })
          )}
        </div>
      )}

      <GenreModal 
        isOpen={modalMode !== null} 
        title={modalMode === 'add' ? 'เพิ่มแนวเรื่อง' : 'แก้ไขแนวเรื่อง'}
        formData={formData}
        setFormData={setFormData}
        onClose={closeModal} 
        onSave={handleSave} 
        isSaving={isSaving} 
      />
    </div>
  );
}
