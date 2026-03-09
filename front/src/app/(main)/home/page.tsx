'use client';

import Image from 'next/image';
import { Wine } from 'lucide-react';
import Chip from '@/components/ui/chip/Chip';

const GALLERY_WINES = [
  { id: 1, name: 'CHATEAU MARGAUX', category: 'HEAVY & DRY BORDEDEAUX', match: 95, desc: '스테이크와 찰떡궁합!', body: 5, sweet: 2, acid: 3 },
  { id: 2, name: 'CLOUD BAY', category: 'FRESH & CRISP SAU', match: 95, desc: '해산물 요리에 딱', body: 3, sweet: 3, acid: 4 },
];

const RECOMMENDED_WINES = [
  { id: 1, name: '19 Crimes Red', desc: '하루의 피로를 녹여줄 한 잔', price: '25,000' },
  { id: 2, name: 'Goreb Chandon', desc: '가볍게 즐기는 혼술 와인', price: '52,000' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col bg-background pb-24">
      {/* Header */}
      <div className="flex justify-center py-4 bg-background sticky top-0 z-10">
        <div className="relative h-10 w-10">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" />
        </div>
      </div>

      {/* Vibe Gallery Section */}
      <section className="px-6 py-4">
        <h2 className="text-xl font-black text-text-main mb-6 tracking-tight italic">VIBE GALLERY</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {GALLERY_WINES.map((wine) => (
            <div key={wine.id} className="min-w-[280px] bg-white rounded-[40px] p-6 shadow-sm border border-primary-100 relative">
              <div className="absolute top-4 left-4 bg-[#B36262] text-white text-[10px] font-bold px-3 py-1.5 rounded-full">
                {wine.match}% MATCH
              </div>
              <div className="w-full aspect-[4/5] bg-gray-100 rounded-[32px] mb-6" />
              <div className="space-y-1 mb-4">
                <p className="text-[10px] font-bold text-[#B36262] uppercase tracking-wider">{wine.category}</p>
                <h3 className="text-xl font-black text-text-main leading-tight">{wine.name}</h3>
                <p className="text-sm font-bold text-[#FF8A00]">{wine.desc}</p>
              </div>
              <div className="space-y-1.5 pt-2">
                {['BODY', 'SWEET', 'ACID'].map((label) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-text-main/40">{label}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((d) => (
                        <div key={d} className={`w-2 h-2 rotate-45 ${d <= (wine as any)[label.toLowerCase()] ? 'bg-[#B36262]' : 'bg-primary-100'}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Editor's Pick Section */}
      <section className="px-6 py-4">
        <h2 className="text-xl font-bold text-text-main mb-4 italic">AI’s pick!</h2>
        <div className="flex gap-2 overflow-x-auto mb-6 no-scrollbar">
          {['혼술', '기념일', '피자', '파티'].map((cat, i) => (
            <Chip key={cat} active={i === 0} variant={i === 0 ? 'primary' : 'secondary'} className="px-6">
              {cat}
            </Chip>
          ))}
        </div>

        <div className="space-y-4">
          {RECOMMENDED_WINES.map((wine) => (
            <div key={wine.id} className="flex items-center gap-4 bg-white p-4 rounded-[32px] border border-primary-100 shadow-sm">
              <div className="w-16 h-16 bg-[#FFE5E5] rounded-2xl flex items-center justify-center shrink-0">
                <div className="w-1.5 h-10 bg-black rounded-full" />
              </div>
              <div className="flex-1 space-y-0.5">
                <h4 className="font-bold text-lg text-text-main">{wine.name}</h4>
                <p className="text-xs text-text-main/40 font-medium">{wine.desc}</p>
                <p className="text-lg font-black text-[#B36262]">₩{wine.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
