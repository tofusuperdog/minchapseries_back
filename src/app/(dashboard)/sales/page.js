'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

function CustomCheckbox({ checked, onChange }) {
  return (
    <div
      onClick={onChange}
      className={`w-4 h-4 border flex items-center justify-center cursor-pointer transition-colors ${checked ? 'border-gray-400' : 'border-gray-400'}`}
    >
      {checked && (
        <svg className="w-3.5 h-3.5 text-[#3ceb8b]" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );
}

function CustomRadio({ checked, onChange }) {
  return (
    <div
      onClick={onChange}
      className={`w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${checked ? 'border-[#3ceb8b]' : 'border-gray-400'}`}
    >
      {checked && (
        <div className="w-2 h-2 rounded-full bg-[#3ceb8b]" />
      )}
    </div>
  );
}

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState('episodes'); // 'episodes' | 'vip'
  const [isEpisodesActive, setIsEpisodesActive] = useState(true);
  const [originalIsEpisodesActive, setOriginalIsEpisodesActive] = useState(true);
  const [isVipActive, setIsVipActive] = useState(true);
  const [originalIsVipActive, setOriginalIsVipActive] = useState(true);

  // Episode Packages
  const [packages, setPackages] = useState([]);
  const [originalPackages, setOriginalPackages] = useState([]);

  // VIP Packages
  const [vipPackages, setVipPackages] = useState([]);
  const [originalVipPackages, setOriginalVipPackages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPackages = async () => {
    setLoading(true);

    // Fetch Settings
    const { data: settingsData } = await supabase
      .from('app_settings')
      .select('is_episodes_active, is_vip_active')
      .eq('id', 1)
      .single();

    if (settingsData) {
      if (settingsData.is_episodes_active !== undefined) {
        setIsEpisodesActive(settingsData.is_episodes_active);
        setOriginalIsEpisodesActive(settingsData.is_episodes_active);
      }
      if (settingsData.is_vip_active !== undefined) {
        setIsVipActive(settingsData.is_vip_active);
        setOriginalIsVipActive(settingsData.is_vip_active);
      }
    }

    // Fetch Episodes
    const { data: epData, error: epError } = await supabase
      .from('episode_package')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!epError && epData) {
      setPackages(epData);
      setOriginalPackages(JSON.parse(JSON.stringify(epData)));
    }

    // Fetch VIPs
    const { data: vipData, error: vipError } = await supabase
      .from('vip_package')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!vipError && vipData) {
      setVipPackages(vipData);
      setOriginalVipPackages(JSON.parse(JSON.stringify(vipData)));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Handlers for Episodes
  const handleChange = (id, field, value) => {
    setPackages(prev => prev.map(pkg =>
      pkg.id === id ? { ...pkg, [field]: value } : pkg
    ));
  };

  const handleRadioChange = (id) => {
    setPackages(prev => prev.map(pkg =>
      ({ ...pkg, badge_color: pkg.id === id })
    ));
  };

  const handleCancel = () => {
    setPackages(JSON.parse(JSON.stringify(originalPackages)));
  };

  const handleToggleChange = async (checked) => {
    setIsEpisodesActive(checked);
    setOriginalIsEpisodesActive(checked);

    await supabase
      .from('app_settings')
      .upsert({ id: 1, is_episodes_active: checked });
  };

  const handleSave = async () => {
    setIsSaving(true);

    for (const pkg of packages) {
      await supabase
        .from('episode_package')
        .update({
          price: pkg.price,
          unlock_episodes: pkg.unlock_episodes,
          discount_percent: pkg.discount_percent,
          badge_discount: pkg.badge_discount,
          badge_color: pkg.badge_color,
          show_price: pkg.show_price
        })
        .eq('id', pkg.id);
    }
    await fetchPackages();
    setIsSaving(false);
  };

  const isDirty = JSON.stringify(packages) !== JSON.stringify(originalPackages);

  // Handlers for VIP
  const handleVipChange = (id, field, value) => {
    setVipPackages(prev => prev.map(pkg =>
      pkg.id === id ? { ...pkg, [field]: value } : pkg
    ));
  };

  const handleVipRadioChange = (id) => {
    setVipPackages(prev => prev.map(pkg =>
      ({ ...pkg, is_recommended: pkg.id === id })
    ));
  };

  const handleCancelVip = () => {
    setVipPackages(JSON.parse(JSON.stringify(originalVipPackages)));
  };

  const handleVipToggleChange = async (checked) => {
    setIsVipActive(checked);
    setOriginalIsVipActive(checked);

    await supabase
      .from('app_settings')
      .upsert({ id: 1, is_vip_active: checked });
  };

  const handleSaveVip = async () => {
    setIsSaving(true);
    for (const pkg of vipPackages) {
      await supabase
        .from('vip_package')
        .update({
          price_thb: pkg.price_thb === '' ? 0 : pkg.price_thb,
          price_usd: pkg.price_usd === '' ? 0 : pkg.price_usd,
          price_jpy: pkg.price_jpy === '' ? 0 : pkg.price_jpy,
          price_cny: pkg.price_cny === '' ? 0 : pkg.price_cny,
          is_recommended: pkg.is_recommended
        })
        .eq('id', pkg.id);
    }
    await fetchPackages();
    setIsSaving(false);
  };

  const isVipDirty = JSON.stringify(vipPackages) !== JSON.stringify(originalVipPackages);

  return (
    <div className="w-full pb-20">
      {/* Header */}
      <div className="flex items-center mb-8 text-white space-x-3">
        <div className="relative w-8 h-8">
          <Image src="/sales.svg" alt="Sales" fill sizes="36px" style={{ objectFit: 'contain' }} />
        </div>
        <h1 className="text-xl text-gray-300 font-semibold tracking-wide">การขาย</h1>
      </div>

      <div className="border border-[#2d2252] rounded-lg overflow-hidden shadow-lg bg-[#12102f]/60">

        {/* Tabs */}
        <div className="flex border-b border-[#2d2252] text-[15px]">
          <button
            onClick={() => setActiveTab('episodes')}
            className={`flex items-center gap-2 px-8 py-3.5 transition-colors font-medium tracking-wide ${activeTab === 'episodes' ? 'bg-[#28214f] text-white' : 'text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer'}`}
          >
            เพิ่มตอน
            {isEpisodesActive ? (
              <svg className="w-4 h-4 text-[#3ceb8b]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            )}
          </button>
          <button
            onClick={() => setActiveTab('vip')}
            className={`flex items-center gap-2 px-8 py-3.5 transition-colors font-medium tracking-wide ${activeTab === 'vip' ? 'bg-[#28214f] text-white' : 'text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer'}`}
          >
            VIP
            {isVipActive ? (
              <svg className="w-4 h-4 text-[#3ceb8b]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'episodes' && (
            <div className="w-full max-w-[1200px] mx-auto flex flex-col items-center animate-fadeIn">

              {/* Master Toggle */}
              <div className="w-full flex justify-end items-center mb-6">
                <span className="text-gray-300 font-medium mr-4">เปิดใช้งานแพ็กเกจเพิ่มตอน</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isEpisodesActive}
                    onChange={(e) => handleToggleChange(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3ceb8b]"></div>
                </label>
              </div>

              <div className={`w-full flex flex-col xl:flex-row items-start justify-center gap-5 transition-all duration-300 ${!isEpisodesActive ? 'opacity-40 grayscale pointer-events-none' : ''}`}>

                {/* Preview Section */}
                <div className="w-[360px] shrink-0 mb-4 p-4 rounded-xl bg-[#060608] border border-gray-900 shadow-2xl">
                  <div className="flex items-center gap-2 mb-3 pl-1">
                    <img src="/addespisodeicon.svg" alt="เพิ่มตอน" className="w-[34px] h-[34px] shrink-0 object-contain drop-shadow-lg" />
                    <h2 className="text-[20px] font-medium text-white tracking-wider mt-0.5">เพิ่มตอน</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {packages.filter(p => p.show_price).map(pkg => {
                      const isRecommended = pkg.badge_color;
                      const cardBg = isRecommended ? 'bg-[#51139f]' : 'bg-[#151515]';
                      const cardBorder = isRecommended ? 'border-transparent' : 'border-[#4e109d]';

                      return (
                        <div key={`preview-${pkg.id}`} className={`relative flex flex-col items-start justify-center p-3 pl-3.5 rounded-xl border ${cardBorder} ${cardBg} overflow-hidden shadow-lg`}>

                          {/* Discount Badge */}
                          {pkg.badge_discount && pkg.discount_percent > 0 && (
                            <div className={`absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg text-[10px] font-medium text-white ${isRecommended ? 'bg-[#cb2385]' : 'bg-[#151515] border-b border-l border-[#4e109d]'}`}>
                              ลด {pkg.discount_percent}%
                            </div>
                          )}

                          <div className="flex items-center justify-start gap-1.5 mb-1 mt-2">
                            <img src="/bean.svg" alt="bean" className="w-[22px] h-[22px] mb-0.5 drop-shadow-md" />
                            <span className="text-[26px] leading-none font-semibold text-white tracking-wide">{pkg.price}</span>
                          </div>

                          <div className="text-[11px] text-gray-300 tracking-wide font-light text-left pl-0.5">
                            ปลดล็อกได้ {pkg.unlock_episodes} ตอน
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1 w-full bg-[#12102f]/40 rounded-xl p-4 overflow-x-auto border border-[#2d2252]/50">
                  <table className="w-full text-center text-[13px] font-medium text-white border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b-[0.5px] border-b-gray-700 bg-[#0c0a1b]/60">
                        <th className="py-3 px-2 font-medium tracking-wide">จำนวน bean</th>
                        <th className="py-3 px-2 font-medium tracking-wide">ปลดล็อก (ตอน)</th>
                        <th className="py-3 px-2 font-medium tracking-wide">ส่วนลด (%)</th>
                        <th className="py-3 px-2 font-medium tracking-wide">ส่วนลดมุมบน</th>
                        <th className="py-3 px-2 font-medium tracking-wide">แพ็กเกจแนะนำ</th>
                        <th className="py-3 px-2 font-medium tracking-wide">เปิดใช้งาน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-gray-500 font-light text-[14px]">กำลังโหลดแพ็กเกจ...</td>
                        </tr>
                      ) : packages.map((pkg, idx) => (
                        <tr key={pkg.id} className={`${idx % 2 === 0 ? 'bg-[#28214f]/30' : 'bg-[#28214f]/10'} hover:bg-[#3d3278]/20 transition-colors`}>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={pkg.price}
                              onChange={(e) => handleChange(pkg.id, 'price', parseInt(e.target.value) || 0)}
                              className="w-full max-w-[55px] h-7 bg-[#e5e7eb] text-black text-center focus:outline-none focus:ring-2 focus:ring-[#709bf0] disabled:opacity-50 text-[13px] rounded-sm"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={pkg.unlock_episodes}
                              onChange={(e) => handleChange(pkg.id, 'unlock_episodes', parseInt(e.target.value) || 0)}
                              className="w-full max-w-[55px] h-7 bg-[#e5e7eb] text-black text-center focus:outline-none focus:ring-2 focus:ring-[#709bf0] text-[13px] rounded-sm"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={pkg.discount_percent}
                              onChange={(e) => handleChange(pkg.id, 'discount_percent', parseInt(e.target.value) || 0)}
                              className="w-full max-w-[55px] h-7 bg-[#e5e7eb] text-black text-center focus:outline-none focus:ring-2 focus:ring-[#709bf0] text-[13px] rounded-sm"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex justify-center transform scale-90">
                              <CustomCheckbox
                                checked={pkg.badge_discount}
                                onChange={() => handleChange(pkg.id, 'badge_discount', !pkg.badge_discount)}
                              />
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex justify-center transform scale-90">
                              <CustomRadio
                                checked={pkg.badge_color}
                                onChange={() => handleRadioChange(pkg.id)}
                              />
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex justify-center transform scale-90">
                              <CustomCheckbox
                                checked={pkg.show_price}
                                onChange={() => handleChange(pkg.id, 'show_price', !pkg.show_price)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="w-full flex justify-center gap-4 mt-6 mb-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={!isDirty || isSaving}
                  className="w-40 h-11 bg-transparent border border-[#5c85f1] hover:bg-[#5c85f1]/10 transition-colors rounded text-[#5c85f1] font-medium tracking-widest cursor-pointer disabled:opacity-30 disabled:border-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed text-[15px]"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isDirty || isSaving}
                  className="w-40 h-11 bg-[#5c85f1] hover:bg-[#4a72d7] transition-colors rounded text-white font-medium tracking-widest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-[15px] shadow-md"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>

            </div>
          )}

          {activeTab === 'vip' && (
            <div className="w-full max-w-[1200px] mx-auto flex flex-col items-center animate-fadeIn">

              {/* Master Toggle for VIP */}
              <div className="w-full flex justify-end items-center mb-6">
                <span className="text-gray-300 font-medium mr-4">เปิดใช้งานแพ็กเกจ VIP</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isVipActive}
                    onChange={(e) => handleVipToggleChange(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3ceb8b]"></div>
                </label>
              </div>

              <div className={`w-full flex flex-col xl:flex-row items-start justify-center gap-5 transition-all duration-300 ${!isVipActive ? 'opacity-40 grayscale pointer-events-none' : ''}`}>

                {/* VIP Preview Section */}
                <div className="w-[360px] shrink-0 mb-4 p-4 rounded-xl bg-[#0a0a0a] border border-gray-800 shadow-xl overflow-hidden">
                  <div className="flex items-center gap-3 mb-4 pl-1">
                    <img src="/popcornicon.svg" alt="Popcorn" className="w-[34px] h-[34px] mt-1 shrink-0 drop-shadow-md" />
                    <h2 className="text-[22px] font-semibold text-white tracking-wide mt-1">Minchap - VIP</h2>
                  </div>

                  <div className="flex flex-col gap-3">
                    {vipPackages.map(pkg => {
                      const isRecommended = pkg.is_recommended;
                      const cardBg = isRecommended ? 'bg-[#51139f]' : 'bg-[#151515]';
                      const cardBorderColor = isRecommended ? 'border-transparent' : 'border-[#4e109d]';

                      return (
                        <div key={`vip-preview-${pkg.id}`} className={`relative p-4 rounded-xl border ${cardBorderColor} ${cardBg} shadow-lg overflow-hidden flex justify-between items-center`}>

                          {/* Recommended Badge */}
                          {isRecommended && (
                            <div className="absolute top-0 right-0 bg-[#cb2385] text-white text-[12px] font-medium px-3 py-1 rounded-bl-xl z-10 shadow-sm">
                              ยอดนิยม
                            </div>
                          )}

                          <div className="flex flex-col z-0 relative">
                            <div className="flex items-center gap-2 mb-1.5">
                              <img src="/popcornicon.svg" alt="Popcorn base" className="w-[20px] h-[20px] drop-shadow-sm mb-0.5" />
                              <span className="text-[19px] font-medium text-white">{pkg.type}</span>
                            </div>
                            <div className="text-[13px] text-white/90 font-light mt-0.5 w-max">ดูซีรีย์ได้ไม่จำกัด</div>
                            <div className="text-[11px] text-white/70 font-light mt-0.5">ต่ออายุอัตโนมัติ ยกเลิกได้ตลอดเวลา</div>
                          </div>

                          <div className="flex flex-col items-end justify-center pt-5 pr-1 relative z-0">
                            <div className="text-[26px] font-bold text-white tracking-wide leading-none select-none">
                              {pkg.price_thb} <span className="text-[18px] font-medium ml-1">บาท</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* VIP Table Section */}
                <div className="flex-1 w-full bg-[#12102f]/40 rounded-xl p-4 overflow-x-auto border border-[#2d2252]/50">
                  <table className="w-full text-center text-[13px] font-medium text-white border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b-[0.5px] border-b-gray-700 bg-[#0c0a1b]/60">
                        <th className="py-3 px-2 font-medium tracking-wide">ประเภท</th>
                        <th className="py-3 px-2 font-medium tracking-wide">ไทย (THB)</th>
                        <th className="py-3 px-2 font-medium tracking-wide">USA (USD)</th>
                        <th className="py-3 px-2 font-medium tracking-wide">ญี่ปุ่น (JPY)</th>
                        <th className="py-3 px-2 font-medium tracking-wide">จีน (CNY)</th>
                        <th className="py-3 px-2 font-medium tracking-wide">แพ็กเกจแนะนำ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-gray-500 font-light text-[14px]">กำลังโหลดแพ็กเกจ...</td>
                        </tr>
                      ) : vipPackages.map((pkg, idx) => (
                        <tr key={pkg.id} className={`${idx % 2 === 0 ? 'bg-[#28214f]/30' : 'bg-[#28214f]/10'} hover:bg-[#3d3278]/20 transition-colors`}>
                          <td className="py-2 px-2 text-gray-200">{pkg.type}</td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="0.01"
                              value={pkg.price_thb}
                              onChange={(e) => handleVipChange(pkg.id, 'price_thb', e.target.value)}
                              className="w-full max-w-[75px] h-7 bg-[#e5e7eb] text-black text-center focus:outline-none focus:ring-2 focus:ring-[#709bf0] text-[13px] rounded-sm"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="0.01"
                              value={pkg.price_usd}
                              onChange={(e) => handleVipChange(pkg.id, 'price_usd', e.target.value)}
                              className="w-full max-w-[75px] h-7 bg-[#e5e7eb] text-black text-center focus:outline-none focus:ring-2 focus:ring-[#709bf0] text-[13px] rounded-sm"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="0.01"
                              value={pkg.price_jpy}
                              onChange={(e) => handleVipChange(pkg.id, 'price_jpy', e.target.value)}
                              className="w-full max-w-[75px] h-7 bg-[#e5e7eb] text-black text-center focus:outline-none focus:ring-2 focus:ring-[#709bf0] text-[13px] rounded-sm"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="0.01"
                              value={pkg.price_cny}
                              onChange={(e) => handleVipChange(pkg.id, 'price_cny', e.target.value)}
                              className="w-full max-w-[75px] h-7 bg-[#e5e7eb] text-black text-center focus:outline-none focus:ring-2 focus:ring-[#709bf0] text-[13px] rounded-sm"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex justify-center transform scale-90">
                              <CustomRadio
                                checked={pkg.is_recommended || false}
                                onChange={() => handleVipRadioChange(pkg.id)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="w-full flex justify-center gap-4 mt-6 mb-2">
                <button
                  type="button"
                  onClick={handleCancelVip}
                  disabled={!isVipDirty || isSaving}
                  className="w-40 h-11 bg-transparent border border-[#5c85f1] hover:bg-[#5c85f1]/10 transition-colors rounded text-[#5c85f1] font-medium tracking-widest cursor-pointer disabled:opacity-30 disabled:border-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed text-[15px]"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveVip}
                  disabled={!isVipDirty || isSaving}
                  className="w-40 h-11 bg-[#5c85f1] hover:bg-[#4a72d7] transition-colors rounded text-white font-medium tracking-widest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-[15px] shadow-md"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
