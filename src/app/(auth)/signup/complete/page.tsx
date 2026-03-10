'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupCompletePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="relative h-40 w-40">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
        </div>
        <div className="text-center space-y-3">
          <h1 className="text-[32px] font-extrabold text-text-main tracking-tight">
            환영합니다!
          </h1>
          <p className="text-base text-text-main/60 font-medium">
            와인의 세계에 오신 것을 환영합니다!
          </p>
        </div>
      </div>

      {/* Bottom Toast-style Banner */}
      <div className="absolute bottom-6 left-6 right-6 animate-in slide-in-from-bottom-8 duration-1000 delay-300">
        <div className="bg-white rounded-[32px] p-3 flex items-center justify-between shadow-xl border border-primary-100">
          <div className="flex items-center gap-5">
            <span className="text-2xl">🍞</span>
            <div className="flex flex-col">
              <span className="font-black text-text-main text-sm">잠시 후 로그인 페이지로 이동합니다.</span>
              <Link href="/login" className="text-xs font-bold text-[#B36262] hover:underline">
                직접 이동하기
              </Link>
            </div>
          </div>
          <button onClick={() => router.push('/login')} className="text-text-main/30">
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
