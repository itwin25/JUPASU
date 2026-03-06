'use client';

import { SITUATION_OPTIONS } from '../constants/onboarding.constants';
import Chip from '@/components/ui/chip/Chip';

export default function SituationSelector() {
  return (
    <div className="flex flex-wrap gap-2">
      {SITUATION_OPTIONS.map((option) => (
        <Chip key={option.id} variant="secondary">
          {option.label}
        </Chip>
      ))}
    </div>
  );
}
