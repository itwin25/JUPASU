'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Step1Form from '@/features/onboarding/components/Step1Form';
import Step2Taste from '@/features/onboarding/components/Step2Taste';
import Step3WineReview from '@/features/onboarding/components/Step3WineReview';

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else router.push('/signup/complete');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-10">
      {/* Header Area */}
      <div className="flex flex-col items-center space-y-4 mb-8">
        <div className="relative h-20 w-20">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-main">Join JUPASU</h1>
          <p className="text-sm text-text-main/50 mt-1">와인의 세계에 오신 것을 환영합니다!</p>
        </div>
      </div>

      {/* Stepper Indicator */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s <= step ? 'bg-primary-700' : 'bg-primary-100'
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <main className="flex-1 max-w-md mx-auto w-full">
        {step === 1 && <Step1Form onNext={handleNext} />}
        {step === 2 && <Step2Taste onNext={handleNext} onPrev={() => setStep(1)} />}
        {step === 3 && <Step3WineReview onNext={handleNext} onPrev={() => setStep(2)} />}
      </main>
    </div>
  );
}
