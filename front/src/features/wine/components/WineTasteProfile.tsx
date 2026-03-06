import { Wine } from '../types/wine.types';
import { TASTE_LABELS } from '@/features/onboarding/constants/onboarding.constants';

interface WineTasteProfileProps {
  taste: Wine['taste'];
}

export default function WineTasteProfile({ taste }: WineTasteProfileProps) {
  return (
    <div className="grid grid-cols-2 gap-4 bg-primary-100/50 p-4 rounded-xl">
      {Object.entries(taste).map(([key, value]) => (
        <div key={key} className="flex flex-col gap-1">
          <span className="text-xs text-text-main/60">{TASTE_LABELS[key as keyof typeof TASTE_LABELS]}</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((step) => (
              <div 
                key={step} 
                className={`h-1.5 flex-1 rounded-full ${step <= value ? 'bg-primary-900' : 'bg-white'}`} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
