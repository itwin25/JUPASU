'use client';

import { cn } from '@/lib/utils';

interface TasteSliderGroupProps {
  tastes: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

const TASTE_FACTORS = [
  {
    label: '당도',
    key: 'sweet',
    max: 5,
    descriptions: ['완전 드라이', '드라이', '약간 달콤', '달콤', '매우 달콤'],
  },
  {
    label: '산도',
    key: 'acid',
    max: 5,
    descriptions: ['거의 없음', '부드러움', '적당함', '상큼함', '매우 상큼'],
  },
  {
    label: '무게감',
    key: 'body',
    max: 5,
    descriptions: ['아주 가벼운', '가벼운', '중간', '묵직함', '매우 묵직'],
  },
  {
    label: '타닌',
    key: 'tannin',
    max: 5,
    descriptions: ['거의 없음', '매끄러움', '적당함', '조금 떫음', '많이 떫음'],
  },
  {
    label: '도수',
    key: 'abv',
    max: 5,
    descriptions: ['5%', '10%', '15%', '20%', '25%'],
  },
];

export default function TasteSliderGroup({ tastes, onChange }: TasteSliderGroupProps) {
  return (
    <div className="space-y-10">
      {TASTE_FACTORS.map((factor) => (
        <div key={factor.key} className="space-y-3">
          <div className="text-text-main/60 flex items-center justify-between text-sm font-bold">
            <span>{factor.label}</span>
          </div>

          <div className="group relative flex h-7 items-center">
            {/* Background Dots Layer */}
            <div className="pointer-events-none absolute inset-0 flex items-center px-1">
              <div className="bg-primary-100 absolute right-0 left-0 mx-1 h-[2px]" />
              <div className="flex w-full justify-between px-1">
                {Array.from({ length: factor.max }).map((_, index) => {
                  const s = index + 1;
                  return (
                    <div
                      key={s}
                      className={cn(
                        'h-2.5 w-2.5 rounded-full transition-colors duration-300',
                        tastes[factor.key] === s ? 'bg-transparent' : 'bg-primary-100',
                      )}
                    />
                  );
                })}
              </div>
            </div>

            {/* Range Input Layer */}
            <input
              type="range"
              min="1"
              max={factor.max}
              step="1"
              value={tastes[factor.key]}
              onChange={(e) => onChange(factor.key, Number(e.target.value))}
              className="absolute inset-0 z-20 h-full w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#B36262] [&::-moz-range-thumb]:shadow-lg [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#B36262] [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-125"
            />
          </div>

          <div className="relative mt-1.5 h-6">
            {factor.descriptions.map((desc, i) => {
              const isActive = tastes[factor.key] === i + 1;
              const left = `${i * 25}%`;
              return (
                <span
                  key={i}
                  className={cn(
                    'absolute top-0 text-[10px] font-bold whitespace-nowrap transition-all',
                    isActive ? 'scale-110 text-[#B36262]' : 'text-text-main/15',
                  )}
                  style={{
                    left,
                    transform:
                      i === 0 ? 'none' : i === 4 ? 'translateX(-100%)' : 'translateX(-50%)',
                  }}
                >
                  {desc}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
