'use client';

import { TASTE_LABELS } from '../constants/onboarding.constants';

export default function TasteSliderGroup() {
  return (
    <div className="space-y-6">
      {Object.entries(TASTE_LABELS).map(([key, label]) => (
        <div key={key} className="space-y-2">
          <div className="flex justify-between text-sm font-medium text-text-main">
            <span>{label}</span>
            <span className="text-primary-900">3 / 5</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="5" 
            step="1"
            className="w-full h-2 bg-primary-100 rounded-lg appearance-none cursor-pointer accent-primary-900" 
          />
        </div>
      ))}
    </div>
  );
}
