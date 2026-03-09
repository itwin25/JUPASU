'use client';

import { useState } from 'react';
import { X, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const FRIENDS = [
  { id: 1, name: '와인러버민지', avatar: 'cat1.svg', count: 28, isFriend: true },
  { id: 2, name: '와인러버민지', avatar: 'tiger1.svg', count: 28, isFriend: false },
  { id: 3, name: '민지야술그만마셔라', avatar: 'whale1.svg', count: 28, isFriend: false },
];

export default function FriendsPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      <header className="flex items-center justify-between px-6 py-6">
        <Link href="/mypage" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary-100">
          <X size={24} className="text-text-main rotate-45" /> {/* Using X as back arrow placeholder */}
        </Link>
        <h1 className="text-xl font-black text-text-main">친구 목록</h1>
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary-100"
        >
          <Search size={20} className="text-[#B36262]" />
        </button>
      </header>

      <main className="px-6 space-y-6">
         {FRIENDS.map((friend) => (
           <div key={friend.id} className="bg-white rounded-[32px] p-5 flex items-center justify-between border border-primary-100 shadow-sm">
              <div className="flex items-center gap-4">
                 <div className="relative w-14 h-14 rounded-full overflow-hidden bg-primary-100 border-2 border-primary-100">
                    <Image src={`/${friend.avatar}`} alt={friend.name} fill className="object-cover" />
                 </div>
                 <div className="flex flex-col">
                    <span className="font-black text-text-main leading-tight">{friend.name}</span>
                    <span className="text-xs font-bold text-text-main/30">{friend.count}종 시음</span>
                 </div>
              </div>
              <button className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                friend.isFriend 
                  ? "bg-gray-500 text-white" 
                  : "bg-[#FFF5F5] text-[#B36262] border border-[#B36262]/20"
              }`}>
                {friend.isFriend ? '친구' : '친구 요청'}
              </button>
           </div>
         ))}
      </main>

      {/* Friend Search Modal Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex flex-col justify-end animate-in fade-in duration-300">
           <div className="absolute inset-0" onClick={() => setIsSearchOpen(false)} />
           <div className="relative bg-white rounded-t-[40px] p-8 space-y-8 animate-in slide-in-from-bottom-full duration-300 min-h-[70vh]">
              <div className="flex items-center justify-between">
                 <h2 className="text-2xl font-black text-text-main">친구 검색</h2>
                 <button onClick={() => setIsSearchOpen(false)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <X size={24} className="text-text-main" />
                 </button>
              </div>

              <div className="relative">
                 <input 
                   className="w-full bg-white border-2 border-primary-100 rounded-3xl py-4 pl-6 pr-14 text-sm font-bold focus:outline-none focus:border-primary-500"
                   placeholder="친구 ID 입력..."
                 />
                 <button className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#B36262] rounded-full flex items-center justify-center text-white">
                    <Search size={20} />
                 </button>
              </div>

              <div className="space-y-4">
                 {FRIENDS.map((f) => (
                    <div key={f.id} className="bg-white rounded-[32px] p-5 flex items-center justify-between border border-primary-100 shadow-sm">
                       <div className="flex items-center gap-4">
                          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-primary-100 border-2 border-primary-100">
                             <Image src={`/${f.avatar}`} alt={f.name} fill className="object-cover" />
                          </div>
                          <div className="flex flex-col">
                             <span className="font-black text-text-main leading-tight">{f.name}</span>
                             <span className="text-xs font-bold text-text-main/30">{f.count}종 시음</span>
                          </div>
                       </div>
                       <button className={`px-5 py-2.5 rounded-2xl text-xs font-black ${
                         f.isFriend ? "bg-gray-500 text-white" : "bg-[#FFF5F5] text-[#B36262]"
                       }`}>
                          {f.isFriend ? '친구' : '친구 요청'}
                       </button>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
