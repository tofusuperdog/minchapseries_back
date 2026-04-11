'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Helper for pill toggles
function LangToggle({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-9 h-7 text-xs border rounded flex items-center justify-center transition-colors cursor-pointer ${
        active 
          ? 'bg-[#181236] border-[#6C72FF] text-[#6C72FF]' 
          : 'bg-transparent border-gray-600 text-gray-300 hover:border-gray-400'
      }`}
    >
      {label}
    </button>
  );
}

export default function EditSeriesPage() {
  const router = useRouter();
  const { id: seriesId } = useParams();
  
  // State
  const [genres, setGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const [loadingSeries, setLoadingSeries] = useState(true);
  
  const [formData, setFormData] = useState({
    title_th: '',
    title_en: '',
    title_jp: '',
    title_cn: '',
    genre_ids: [],
    total_episodes: 1,
    dub_th: false,
    dub_en: false,
    dub_jp: false,
    dub_cn: false,
    sub_th: false,
    sub_en: false,
    sub_jp: false,
    sub_cn: false,
  });
  
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [deleteOldImage, setDeleteOldImage] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  
  const fileInputRef = useRef(null);

  // Fetch Genres & Series Data
  useEffect(() => {
    async function fetchData() {
      // Fetch genres
      const { data: gData, error: gError } = await supabase
        .from('genre')
        .select('id, name_th')
        .order('name_th', { ascending: true });
        
      if (!gError && gData) {
        setGenres(gData);
      }
      setLoadingGenres(false);

      // Fetch series by ID
      if (seriesId) {
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

        setFormData({
          title_th: sData.title_th || '',
          title_en: sData.title_en || '',
          title_jp: sData.title_jp || '',
          title_cn: sData.title_cn || '',
          genre_ids: sData.genre_ids || [],
          total_episodes: sData.total_episodes || 1,
          dub_th: !!sData.dub_th,
          dub_en: !!sData.dub_en,
          dub_jp: !!sData.dub_jp,
          dub_cn: !!sData.dub_cn,
          sub_th: !!sData.sub_th,
          sub_en: !!sData.sub_en,
          sub_jp: !!sData.sub_jp,
          sub_cn: !!sData.sub_cn,
        });

        if (sData.poster_url) {
          setPosterPreview(sData.poster_url);
        }
      }
      setLoadingSeries(false);
    }
    fetchData();
  }, [seriesId, router]);

  // Handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleGenre = (id) => {
    setFormData(prev => {
      const isSelected = prev.genre_ids.includes(id);
      if (isSelected) {
        return { ...prev, genre_ids: prev.genre_ids.filter(gId => gId !== id) };
      } else {
        return { ...prev, genre_ids: [...prev.genre_ids, id] };
      }
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check extension
    if (!file.name.toLowerCase().endsWith('.webp') && file.type !== 'image/webp') {
      alert('กรุณาอัปโหลดไฟล์ นามสกุล .webp เท่านั้น');
      e.target.value = '';
      return;
    }
    
    setPosterFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPosterPreview(objectUrl);
    setDeleteOldImage(false);
  };

  const handleDeleteImage = () => {
    setPosterPreview(null);
    setPosterFile(null);
    setDeleteOldImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!formData.title_th.trim()) {
      alert('กรุณากรอกชื่อเรื่อง (TH)');
      return;
    }
    
    setIsSaving(true);
    
    let updateFields = {
      title_th: formData.title_th,
      title_en: formData.title_en,
      title_jp: formData.title_jp,
      title_cn: formData.title_cn,
      genre_ids: formData.genre_ids,
      total_episodes: parseInt(formData.total_episodes),
      dub_th: formData.dub_th,
      dub_en: formData.dub_en,
      dub_jp: formData.dub_jp,
      dub_cn: formData.dub_cn,
      sub_th: formData.sub_th,
      sub_en: formData.sub_en,
      sub_jp: formData.sub_jp,
      sub_cn: formData.sub_cn,
    };
    
    // Check if new poster is uploaded
    if (posterFile) {
      const fileExt = posterFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `posters/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('posters')
        .upload(filePath, posterFile);
        
      if (uploadError) {
        console.error('Error uploading poster:', uploadError);
        alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
        setIsSaving(false);
        return;
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('posters')
        .getPublicUrl(filePath);
        
      updateFields.poster_url = publicUrlData.publicUrl;
    } else if (deleteOldImage) {
      // If image is deleted and no new one is uploaded
      updateFields.poster_url = null;
    }
    
    // Update DB
    const { error: dbError } = await supabase
      .from('series')
      .update(updateFields)
      .eq('id', seriesId);
      
    if (dbError) {
      console.error('Error updating series:', dbError);
      alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      setIsSaving(false);
      return;
    }
    
    setIsSaving(false);
    router.push('/series');
  };

  if (loadingSeries) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C72FF]"></div>
        <span className="ml-4 text-gray-300">กำลังโหลด...</span>
      </div>
    );
  }

  const selectedGenreNames = formData.genre_ids
    .map(id => genres.find(g => g.id === id)?.name_th)
    .filter(Boolean)
    .join(', ');

  return (
    <div className="w-full pb-20">
      {/* Header */}
      <div className="flex items-center mb-8 text-white">
        <div className="relative w-6 h-6 mr-3">
          <Image src="/series.svg" alt="Series" fill sizes="24px" style={{ objectFit: 'contain' }} />
        </div>
        <h1 className="text-xl font-semibold tracking-wide flex items-center gap-2">
          <Link href="/series" className="hover:text-gray-300 transition-colors underline underline-offset-4">ซีรีส์</Link>
          <span className="text-gray-300 font-light">&gt;</span>
          <span className="text-gray-200 font-light">รายละเอียด</span>
        </h1>
      </div>

      <div className="bg-[#181236]/70 border border-[#2d2252] rounded-lg p-8 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-14 shadow-lg">
        {/* Left: Poster */}
        <div className="flex flex-col items-center pt-2">
          <div className="w-[200px] h-[280px] border border-dashed border-gray-600 rounded bg-transparent flex flex-col items-center justify-center relative overflow-hidden mb-3">
            {posterPreview ? (
               <Image src={posterPreview} alt="Poster preview" fill sizes="200px" className="object-cover" />
            ) : (
              <div className="text-center text-gray-500 flex flex-col items-center">
                <div className="mb-12 text-sm">ภาพโปสเตอร์</div>
                <div className="w-16 h-12 relative mb-3 opacity-60">
                  <svg className="w-full h-full text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                    <path d="M14 10.5l-3 4-1.5-2-2.5 3h10z"/>
                  </svg>
                </div>
                <div className="text-[11px] font-light">webp - 220x300 px</div>
              </div>
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".webp,image/webp"
            onChange={handleFileChange}
          />

          {/* Delete or Update Image Links */}
          <div className="flex flex-col items-center space-y-1">
            {posterPreview ? (
               <button
                 type="button"
                 onClick={handleDeleteImage}
                 className="text-[#6495ED] hover:text-[#4a72d7] underline text-sm transition-colors cursor-pointer font-light"
               >
                 ลบรูปภาพ
               </button>
            ) : (
               <button
                 type="button"
                 onClick={() => fileInputRef.current?.click()}
                 className="text-[#6495ED] hover:text-[#4a72d7] underline text-sm transition-colors cursor-pointer font-light"
               >
                 เพิ่มรูปภาพ
               </button>
            )}
          </div>
        </div>

        {/* Right: Form */}
        <div className="space-y-6">
          <div className="flex items-start">
            <span className="w-[110px] text-[15px] font-light text-white shrink-0 pt-2">ชื่อเรื่อง</span>
            <div className="flex-1 space-y-3">
              <div className="flex items-center space-x-3">
                <span className="w-9 h-7 border border-gray-500 rounded flex items-center justify-center text-[10px] text-gray-300 tracking-wider">TH</span>
                <input type="text" value={formData.title_th} onChange={(e) => handleInputChange('title_th', e.target.value)} className="flex-1 h-9 px-3 bg-white rounded text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#709bf0]" />
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-9 h-7 border border-gray-500 rounded flex items-center justify-center text-[10px] text-gray-300 tracking-wider">EN</span>
                <input type="text" value={formData.title_en} onChange={(e) => handleInputChange('title_en', e.target.value)} className="flex-1 h-9 px-3 bg-white rounded text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#709bf0]" />
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-9 h-7 border border-gray-500 rounded flex items-center justify-center text-[10px] text-gray-300 tracking-wider">JP</span>
                <input type="text" value={formData.title_jp} onChange={(e) => handleInputChange('title_jp', e.target.value)} className="flex-1 h-9 px-3 bg-white rounded text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#709bf0]" />
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-9 h-7 border border-gray-500 rounded flex items-center justify-center text-[10px] text-gray-300 tracking-wider">CN</span>
                <input type="text" value={formData.title_cn} onChange={(e) => handleInputChange('title_cn', e.target.value)} className="flex-1 h-9 px-3 bg-white rounded text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#709bf0]" />
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <span className="w-[110px] text-[15px] font-light text-white shrink-0">แนวหนัง</span>
            <div className="flex-1 relative">
              <div 
                onClick={() => setIsGenreOpen(!isGenreOpen)}
                className="w-full h-9 px-3 py-1 bg-white rounded flex items-center cursor-pointer text-black"
              >
                <div className="flex-1 truncate text-sm font-medium">
                  {selectedGenreNames || <span className="text-gray-300"></span>}
                </div>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
              
              {isGenreOpen && (
                <div className="absolute top-10 left-0 w-full bg-white rounded shadow-lg max-h-60 overflow-y-auto z-10 p-2 text-black border border-gray-200">
                  {loadingGenres ? (
                    <div className="px-3 py-2 text-sm text-gray-500">กำลังโหลด...</div>
                  ) : genres.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">ยังไม่มีแนวหนัง</div>
                  ) : (
                    genres.map(genre => (
                      <div 
                        key={genre.id} 
                        onClick={() => toggleGenre(genre.id)}
                        className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer rounded"
                      >
                        <div className={`w-4 h-4 border rounded mr-2 flex items-center justify-center ${formData.genre_ids.includes(genre.id) ? 'bg-[#5c85f1] border-[#5c85f1]' : 'border-gray-400'}`}>
                          {formData.genre_ids.includes(genre.id) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-sm font-medium">{genre.name_th}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <span className="w-[110px] text-[15px] font-light text-white shrink-0">จำนวนตอน</span>
            <div className="w-[100px]">
              <select 
                value={formData.total_episodes}
                onChange={(e) => handleInputChange('total_episodes', e.target.value)}
                className="w-[70px] h-9 pl-4 pr-2 bg-white rounded text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#709bf0] cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.2rem_center] bg-[length:1rem_1rem]"
              >
                {Array.from({ length: 99 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <span className="w-[110px] text-[15px] font-light text-white shrink-0">เสียงพากย์</span>
            <div className="flex space-x-2">
              <LangToggle label="TH" active={formData.dub_th} onClick={() => handleInputChange('dub_th', !formData.dub_th)} />
              <LangToggle label="EN" active={formData.dub_en} onClick={() => handleInputChange('dub_en', !formData.dub_en)} />
              <LangToggle label="JP" active={formData.dub_jp} onClick={() => handleInputChange('dub_jp', !formData.dub_jp)} />
              <LangToggle label="CN" active={formData.dub_cn} onClick={() => handleInputChange('dub_cn', !formData.dub_cn)} />
            </div>
          </div>

          <div className="flex items-center">
            <span className="w-[110px] text-[15px] font-light text-white shrink-0">บรรยาย</span>
            <div className="flex space-x-2">
              <LangToggle label="TH" active={formData.sub_th} onClick={() => handleInputChange('sub_th', !formData.sub_th)} />
              <LangToggle label="EN" active={formData.sub_en} onClick={() => handleInputChange('sub_en', !formData.sub_en)} />
              <LangToggle label="JP" active={formData.sub_jp} onClick={() => handleInputChange('sub_jp', !formData.sub_jp)} />
              <LangToggle label="CN" active={formData.sub_cn} onClick={() => handleInputChange('sub_cn', !formData.sub_cn)} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-10 pb-4">
            <div className="w-[110px]"></div>
            <Link
              href="/series"
              className="w-28 h-10 border border-[#504481] hover:bg-white/5 transition-colors rounded flex items-center justify-center text-gray-300 font-light text-[15px] cursor-pointer"
            >
              ยกเลิก
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-28 h-10 bg-[#5c85f1] hover:bg-[#4a72d7] transition-colors rounded text-white font-light text-[15px] cursor-pointer disabled:opacity-50 flex items-center justify-center shadow-lg"
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
