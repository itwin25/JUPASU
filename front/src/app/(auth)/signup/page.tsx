'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Step1Form from '@/features/onboarding/components/Step1Form';
import Step2Taste from '@/features/onboarding/components/Step2Taste';
import Step3WineReview from '@/features/onboarding/components/Step3WineReview';

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  // Step 1 Data
  const [step1Data, setStep1Data] = useState({
    nickname: '',
    email: '',
    authCode: '',
    password: '',
    confirmPassword: '',
    isAgeChecked: false,
    currentSubStep: 1,
  });

  // Step 2 Data
  const [step2Data, setStep2Data] = useState({
    tastes: { sweet: 3, acid: 3, body: 3, tannin: 3, aroma: 3 },
    selectedSituations: [] as string[],
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else router.push('/signup/complete');
  };

  const handleBack = () => {
    if (step === 1) {
      router.push('/login');
    } else {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-10">
      {/* Header Area */}
      <header className="relative w-full mb-8 flex flex-col items-center max-w-md mx-auto">
        <button 
          onClick={handleBack}
          className="absolute left-0 top-0 p-2 -ml-2 text-text-main/60 hover:text-text-main transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
        
        <div className="flex flex-col items-center space-y-4 pt-2">
          <div className="relative h-16 w-16">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-text-main tracking-tight">Join JUPASU</h1>
            <p className="text-xs text-text-main/40 mt-1 font-bold">와인의 세계에 오신 것을 환영합니다!</p>
          </div>
        </div>
      </header>

      {/* Stepper Indicator */}
      <div className="flex gap-2 mb-10 max-w-md mx-auto w-full">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              s <= step ? 'bg-primary-700 w-full' : 'bg-primary-100'
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <main className="flex-1 max-w-md mx-auto w-full">
        {step === 1 && (
          <Step1Form 
            data={step1Data} 
            setData={setStep1Data} 
            onNext={handleNext} 
          />
        )}
        {step === 2 && (
          <Step2Taste 
            data={step2Data}
            setData={setStep2Data}
            onNext={handleNext} 
            onPrev={handleBack} 
          />
        )}
        {step === 3 && (
          <Step3WineReview 
            onNext={handleNext} 
            onPrev={handleBack} 
          />
        )}
      </main>
    </div>
  );
}
