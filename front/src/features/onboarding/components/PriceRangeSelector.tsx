'use client';

import Chip from '@/components/ui/chip/Chip';

export default function PriceRangeSelector() {
  const priceRanges = [
    '1만원 이하',
    '1~3만원',
    '3~5만원',
    '5~10만원',
    '10만원 이상'
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {priceRanges.map((range) => (
        <Chip key={range} active={range === '3~5만원'}>
          {range}
        </Chip>
      ))}
    </div>
  );
}
