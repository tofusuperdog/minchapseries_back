import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import VersionManager from './VersionManager';

export const revalidate = 0; // opt out of static rendering

export default async function OverviewPage() {
  // Fetch real data to compute statistics
  const { data: seriesData } = await supabase.from('series').select('id, status, total_episodes');
  const { data: epData } = await supabase.from('episode').select('series_id');

  const episodeCounts = {};
  if (epData) {
    epData.forEach(ep => {
      episodeCounts[ep.series_id] = (episodeCounts[ep.series_id] || 0) + 1;
    });
  }

  let publishedSeriesCount = 0;
  let publishedEpisodesCount = 0;
  let readySeriesCount = 0;       
  let notReadySeriesCount = 0;    

  if (seriesData) {
    seriesData.forEach(s => {
      const readyEpisodes = episodeCounts[s.id] || 0;
      const missingEpisodes = Math.max(0, (s.total_episodes || 0) - readyEpisodes);
      
      if (s.status === 'published') {
        publishedSeriesCount++;
        publishedEpisodesCount += readyEpisodes;
      } else {
        if (missingEpisodes <= 0) {
          readySeriesCount++;
        } else {
          notReadySeriesCount++;
        }
      }
    });
  }

  return (
    <div className="w-full pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3 text-white">
          <div className="relative w-9 h-9">
            <Image src="/dashboard.svg" alt="Dashboard" fill sizes="36px" style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="text-xl text-gray-300 font-semibold tracking-wide">ภาพรวม</h1>
        </div>
      </div>
      
      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1 */}
        <div className="bg-[#131024] border border-[#2d2252] rounded p-5 flex flex-col justify-between h-[130px] shadow-md">
          <div className="text-gray-300 font-light text-[15px] tracking-wide">ซีรีส์ที่เผยแพร่แล้ว</div>
          <div className="text-white text-[50px] font-medium text-right leading-[1]">{publishedSeriesCount}</div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#131024] border border-[#2d2252] rounded p-5 flex flex-col justify-between h-[130px] shadow-md">
          <div className="text-gray-300 font-light text-[15px] tracking-wide">ตอนที่เผยแพร่แล้ว</div>
          <div className="text-white text-[50px] font-medium text-right leading-[1]">{publishedEpisodesCount}</div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#131024] border border-[#2d2252] rounded p-5 flex flex-col justify-between h-[130px] shadow-md">
          <div className="text-gray-300 font-light text-[15px] tracking-wide">ซีรีส์ที่ยังไม่เผยแพร่</div>
          <div className="text-white text-[50px] font-medium text-right leading-[1]">{readySeriesCount}</div>
        </div>

        {/* Card 4 - Red */}
        <div className="bg-[#2c1010] border border-[#531c1c] rounded p-5 flex flex-col justify-between h-[130px] shadow-md">
          <div className="text-gray-300 font-light text-[15px] tracking-wide">ซีรีส์ที่ยังไม่พร้อม</div>
          <div className="text-white text-[50px] font-medium text-right leading-[1]">{notReadySeriesCount}</div>
        </div>
        
      </div>

      {/* Version Management Section */}
      <VersionManager />
    </div>
  );
}
