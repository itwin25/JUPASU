'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import Link from 'next/link';

export default function SignupCompletePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative">
      <div className="flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="relative h-40 w-40">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-text-main">환영합니다!</h1>
          <p className="text-lg text-text-main/60 font-medium">와인의 세계에 오신 것을 환영합니다!</p>
        </div>
      </div>

      {/* Bottom Toast-style Banner */}
      <div className="absolute bottom-10 left-6 right-6">
        <div className="bg-white rounded-3xl p-5 flex items-center justify-between shadow-xl border border-primary-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍞</span>
            <Link href="/login" className="font-bold text-text-main hover:text-primary-700 transition-colors">
              로그인 페이지로 이동합니다.
            </Link>
          </div>
          <button className="text-text-main/30">
            <X size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
