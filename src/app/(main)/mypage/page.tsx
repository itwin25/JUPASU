'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Settings, ChevronRight, User, Sparkles, LogOut, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

export default function MyPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex flex-col bg-background min-h-screen pb-24 relative">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-6 sticky top-0 bg-background/80 backdrop-blur-md z-30">
        <h1 className="text-2xl font-black text-text-main">My Page</h1>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-10 h-10 flex items-center justify-center text-text-main hover:bg-primary-100/30 rounded-full transition-colors"
        >
          {isMenuOpen ? <X size={28} /> : <Settings size={28} />}
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute top-16 right-6 w-56 bg-white rounded-[32px] shadow-2xl border border-primary-100 p-2 animate-in slide-in-from-top-2 duration-200 z-40">
            <div className="flex flex-col">
              <Link 
                href="/mypage/profile" 
                className="flex items-center gap-3 px-5 py-4 hover:bg-primary-100/30 rounded-[24px] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                  <User size={18} />
                </div>
                <span className="text-sm font-black text-text-main">나의 프로필 수정</span>
              </Link>
              
              <Link 
                href="/mypage/taste" 
                className="flex items-center gap-3 px-5 py-4 hover:bg-primary-100/30 rounded-[24px] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="w-8 h-8 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <span className="text-sm font-black text-text-main">나의 취향 수정</span>
              </Link>

              <div className="h-px bg-primary-100 mx-4 my-1" />

              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-5 py-4 hover:bg-red-50 rounded-[24px] transition-colors text-red-500"
              >
                <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center">
                  <LogOut size={18} />
                </div>
                <span className="text-sm font-black">로그아웃</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Menu Overlay (Click to close) */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* User Info Card */}
      <section className="px-6 mb-8 relative z-10">
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-primary-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-primary-100">
              <Image src="/dog1.svg" alt="Profile" fill className="object-cover" />
            </div>
            <h2 className="text-xl font-black text-text-main">와인수인</h2>
          </div>
          
          <div className="h-px bg-primary-100 w-full mb-6" />
          
          <div className="flex justify-around text-center">
            <Link href="/mypage/scraps" className="space-y-1">
              <p className="text-xl font-black text-[#B36262]">8</p>
              <p className="text-xs font-bold text-text-main/40 flex items-center gap-0.5">Wishlist <ChevronRight size={10} /></p>
            </Link>
            <div className="w-px h-10 bg-primary-100" />
            <Link href="/mypage/reviews" className="space-y-1">
              <p className="text-xl font-black text-[#B36262]">3</p>
              <p className="text-xs font-bold text-text-main/40 flex items-center gap-0.5">Reviews <ChevronRight size={10} /></p>
            </Link>
            <div className="w-px h-10 bg-primary-100" />
            <Link href="/mypage/friends" className="space-y-1">
              <p className="text-xl font-black text-[#B36262]">5</p>
              <p className="text-xs font-bold text-text-main/40 flex items-center gap-0.5">Friends <ChevronRight size={10} /></p>
            </Link>
          </div>
        </div>
      </section>

      {/* AI Report Section */}
      <section className="px-6 space-y-4 relative z-10">
        <h3 className="text-lg font-black text-text-main italic">AI 나의 취향 리포트</h3>
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-primary-100 space-y-8">
          <div className="text-center">
            <p className="text-sm font-bold text-text-main leading-relaxed">
              와인초보님은 <span className="text-[#B36262]">'상큼하고 가벼운' 화이트 와인 취향</span>이에요!
            </p>
          </div>

          <div className="relative aspect-square flex items-center justify-center">
             <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <div className="w-full h-full border border-text-main rotate-45" />
                <div className="w-2/3 h-2/3 border border-text-main rotate-45" />
                <div className="w-1/3 h-1/3 border border-text-main rotate-45" />
             </div>
             {['탄닌', '당도', '산미', '바디', '과일향', '아로마'].map((label, i) => {
               const angles = [0, 60, 120, 180, 240, 300];
               return (
                 <span key={label} className="absolute text-[10px] font-bold text-text-main/30" style={{
                   transform: `rotate(${angles[i]}deg) translateY(-110px) rotate(-${angles[i]}deg)`
                 }}>
                   {label}
                 </span>
               )
             })}
             <div className="w-32 h-32 bg-[#B36262]/20 border-2 border-[#B36262] rounded-full blur-xl animate-pulse" />
          </div>

          <div className="flex justify-center">
             <div className="bg-[#F9F7F2] px-6 py-2.5 rounded-full text-xs font-black text-[#B36262]">
               과일향 러버 타입
             </div>
          </div>

          <div className="flex gap-4 items-start">
             <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center shrink-0">👨‍🍳</div>
             <p className="text-sm font-bold text-text-main leading-relaxed">
                과일향이 풍부하고 당도가 적절한 와인을 산미가 살아있는 와인에 높은 점수를 주셨어요. 탄닌이 강하지 않은 미디엄 바디 스타일
             </p>
          </div>

          <div className="space-y-4">
             <div className="bg-[#FFF5F5] p-5 rounded-3xl border border-[#B36262]/10 space-y-2">
                <div className="flex items-center gap-2 text-[#B36262] font-black text-sm uppercase">
                   <span>▲</span> BEST
                </div>
                <p className="text-xs font-bold text-text-main/60 leading-relaxed">
                   피노 누아, 리슬링, 소비뇽 블랑 계열을 더 탐색해 보세요!
                </p>
             </div>
             <div className="bg-[#FFF5F5] p-5 rounded-3xl border border-[#B36262]/10 space-y-2">
                <div className="flex items-center gap-2 text-[#B36262] font-black text-sm uppercase">
                   <span>▲</span> WORST
                </div>
                <p className="text-xs font-bold text-text-main/60 leading-relaxed">
                   피노 누아, 리슬링, 소비뇽 블랑 계열을 더 탐색해 보세요!
                </p>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
