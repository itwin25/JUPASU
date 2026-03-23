'use client';

import Button from '@/components/ui/button/Button';
import TasteProfileForm, { TasteData } from '@/features/wine/components/TasteProfileForm';

interface Step2TasteProps {
  data: TasteData;
  setData: React.Dispatch<React.SetStateAction<TasteData>>;
  onNext: () => void;
  isPending?: boolean;
}

export default function Step2Taste({ data, setData, onNext, isPending }: Step2TasteProps) {
  const handleDataChange = (newData: Partial<TasteData>) => {
    setData((prev) => ({
      ...prev,
      ...newData,
    }));
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 w-full max-w-full space-y-8 overflow-x-hidden pb-10 duration-300">
      <h2 className="text-primary-700 text-sm font-black tracking-widest uppercase">
        Step 2 - 취향 정보
      </h2>

      <div className="space-y-10">
        <h3 className="text-xl font-bold">어떤 스타일을 좋아하시나요?</h3>

        <TasteProfileForm data={data} onChange={handleDataChange} />
      </div>

      <div className="space-y-4 pt-6">
        <Button onClick={onNext} size="full" className="text-lg shadow-lg" isLoading={isPending}>
          다음
        </Button>
        <button
          onClick={onNext}
          disabled={isPending}
          className="text-text-main/40 hover:text-text-main w-full text-sm font-medium transition-colors"
        >
          건너뛰기
        </button>
      </div>
    </div>
  );
}
