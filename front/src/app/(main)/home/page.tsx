'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Chip from '@/components/ui/chip/Chip';

const GALLERY_WINES = [
  {
    id: 1,
    name: 'CHATEAU MARGAUX',
    category: 'HEAVY & DRY',
    match: 95,
    desc: '스테이크와 찰떡궁합!',
    body: 5,
    sweet: 2,
    acid: 3,
  },
  {
    id: 2,
    name: 'CLOUDY BAY',
    category: 'FRESH & CRISP',
    match: 95,
    desc: '해산물 요리에 산뜻한 한 잔',
    body: 3,
    sweet: 2,
    acid: 4,
  },
  {
    id: 3,
    name: 'OPUS ONE 2019',
    category: 'RICH & BOLD',
    match: 92,
    desc: '특별한 날을 위한 진한 레드',
    body: 5,
    sweet: 1,
    acid: 4,
  },
];

const RECOMMENDATIONS_BY_SITUATION: Record<
  string,
  Array<{ id: number; name: string; desc: string; price: number }>
> = {
  혼술: [
    { id: 4, name: '19 Crimes Red', desc: '하루의 피로를 녹여줄 한 잔', price: 25000 },
    { id: 5, name: 'Goreb Chandon', desc: '가볍게 즐기는 혼술 와인', price: 52000 },
  ],
  기념일: [
    { id: 6, name: 'Dom Perignon', desc: '기념일 디너에 어울리는 샴페인', price: 320000 },
    { id: 7, name: 'Krug Grande Cuvee', desc: '풍성한 버블과 긴 여운의 한 잔', price: 450000 },
  ],
  피자: [
    { id: 8, name: 'Chianti Classico', desc: '토마토 소스와 좋은 밸런스', price: 38000 },
    { id: 9, name: 'Primitivo', desc: '짙은 과실향으로 피자와 잘 어울려요', price: 29000 },
  ],
  파티: [
    { id: 10, name: 'Moet & Chandon', desc: '가벼운 파티를 위한 밝은 샴페인', price: 75000 },
    { id: 11, name: 'Veuve Clicquot', desc: '경쾌한 무드에 어울리는 스파클링', price: 89000 },
  ],
};

const SITUATIONS = ['혼술', '기념일', '피자', '파티'];

export default function HomePage() {
  const [activeSituation, setActiveSituation] = useState('혼술');

  return (
    <div className="bg-background min-h-screen pb-28">
      <div className="bg-background/88 sticky top-0 z-30 px-6 pt-4 pb-3 backdrop-blur-xl">
        <div className="flex justify-center">
          <div className="relative h-14 w-14">
            <Image src="/logo.png" alt="JUPASU" fill className="object-contain" />
          </div>
        </div>
      </div>

      <section className="px-6 pt-4 pb-6">
        <h2 className="text-text-main mb-4 text-xl font-black tracking-tight uppercase italic">
          VIBE GALLERY
        </h2>

        <div className="no-scrollbar flex gap-4 overflow-x-auto px-1 pb-4">
          {GALLERY_WINES.map((wine) => (
            <Link key={wine.id} href={`/wines/${wine.id}`} className="shrink-0">
              <article className="border-primary-100 relative min-w-[232px] overflow-hidden rounded-[22px] border bg-white shadow-[0_12px_26px_rgba(51,34,17,0.06)] transition-all active:scale-[0.985]">
                <div className="absolute top-4 left-4 z-10 rounded-full bg-[#B36262] px-3.5 py-1.5 text-[11px] font-black text-white shadow-sm">
                  {wine.match}% MATCH
                </div>

                <div className="flex aspect-[0.92] items-center justify-center bg-[#FCFBF8]">
                  <span className="text-6xl">🍷</span>
                </div>

                <div className="space-y-3 p-5">
                  <div className="space-y-2">
                    <p className="text-[11px] font-black tracking-[0.18em] text-[#B36262] uppercase">
                      {wine.category}
                    </p>
                    <h3 className="text-text-main truncate text-[1.05rem] leading-none font-black">
                      {wine.name}
                    </h3>
                    <p className="truncate text-xs font-bold text-[#FF8A00]">{wine.desc}</p>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {[
                      ['BODY', wine.body],
                      ['SWEET', wine.sweet],
                      ['ACID', wine.acid],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-text-main/40 text-[12px] font-black tracking-tighter">
                          {label}
                        </span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((diamond) => (
                            <div
                              key={diamond}
                              className={`h-2 w-2 rotate-45 ${
                                diamond <= Number(value) ? 'bg-[#B36262]' : 'bg-primary-100'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-6 py-3">
        <h2 className="text-text-main mb-4 text-xl font-black tracking-tight italic">
          형선&apos;S PICK!
        </h2>

        <div className="no-scrollbar mb-4 flex gap-3 overflow-x-auto pb-1">
          {SITUATIONS.map((category) => (
            <Chip
              key={category}
              active={activeSituation === category}
              variant={activeSituation === category ? 'primary' : 'secondary'}
              className="px-6 py-2 text-xs font-black transition-all"
              onClick={() => setActiveSituation(category)}
            >
              {category}
            </Chip>
          ))}
        </div>

        <div className="space-y-2">
          {RECOMMENDATIONS_BY_SITUATION[activeSituation].map((wine) => (
            <Link key={wine.id} href={`/wines/${wine.id}`} className="block">
              <article className="border-primary-100 flex min-h-[5.8rem] items-center gap-3 rounded-[22px] border bg-white px-3.5 py-2.5 shadow-[0_10px_24px_rgba(51,34,17,0.05)] transition-all active:scale-[0.985]">
                <div className="flex h-[4.15rem] w-[4.15rem] shrink-0 items-center justify-center rounded-[1.1rem] bg-[#FCE7E7]">
                  <span className="text-[1.65rem]">🍷</span>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-text-main truncate text-[0.9rem] leading-tight font-black">
                    {wine.name}
                  </h3>
                  <p className="text-text-main/42 mt-0.5 truncate text-[0.78rem] leading-tight font-medium">
                    {wine.desc}
                  </p>
                  <p className="mt-1.5 text-[0.9rem] leading-none font-black text-[#B36262]">
                    ₩{wine.price.toLocaleString()}
                  </p>
                </div>

                <ChevronRightIcon className="text-primary-100 shrink-0" size={18} />
              </article>
            </Link>
          ))}
        </div>
      </section>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

function ChevronRightIcon({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
