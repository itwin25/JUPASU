'use client';

import { cn } from '@/lib/utils';

interface TasteSliderGroupProps {
  tastes: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

const TASTE_FACTORS = [
  { label: '당도', key: 'sweet' },
  { label: '상큼함', key: 'acid' },
  { label: '무게감', key: 'body' },
  { label: '타닌', key: 'tannin' },
  { label: '향', key: 'aroma' },
];

export default function TasteSliderGroup({ tastes, onChange }: TasteSliderGroupProps) {
  return (
    <div className="space-y-10">
      {TASTE_FACTORS.map((factor) => (
        <div key={factor.key} className="space-y-3">
          <div className="flex justify-between items-center text-sm text-text-main/60 font-bold">
            <span>{factor.label}</span>
          </div>
          
          <div className="relative h-7 flex items-center group">
            {/* Background Dots Layer */}
            <div className="absolute inset-0 flex items-center px-1 pointer-events-none">
              <div className="absolute left-0 right-0 h-[2px] bg-primary-100 mx-1" />
              <div className="flex justify-between w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                  <div 
                    key={s} 
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-colors duration-300",
                      tastes[factor.key] === s ? "bg-transparent" : "bg-primary-100"
                    )} 
                  />
                ))}
              </div>
            </div>

            {/* Range Input Layer */}
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={tastes[factor.key]}
              onChange={(e) => onChange(factor.key, Number(e.target.value))}
              className="absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer z-20
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-6
                [&::-webkit-slider-thumb]:h-6
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-[#B36262]
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:border-3
                [&::-webkit-slider-thumb]:border-white
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:active:scale-125
                
                [&::-moz-range-thumb]:w-7
                [&::-moz-range-thumb]:h-7
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-[#B36262]
                [&::-moz-range-thumb]:border-4
                [&::-moz-range-thumb]:border-white
                [&::-moz-range-thumb]:shadow-lg
              "
            />
          </div>
          
          <div className="flex justify-between text-[10px] text-text-main/30 font-black px-1 uppercase tracking-tighter">
            <span>낮음</span>
            <span className="text-[#B36262] font-black scale-110 tracking-normal">LEVEL {tastes[factor.key]}</span>
            <span>높음</span>
          </div>
        </div>
      ))}
    </div>
  );
}
