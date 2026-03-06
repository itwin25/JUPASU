'use client';

import Header from '@/components/common/header/Header';
import Input from '@/components/ui/input/Input';
import WineList from '@/features/wine/components/WineList';
import BottomNav from '@/components/common/bottom-nav/BottomNav';
import { Search as SearchIcon } from 'lucide-react';

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="와인 검색" showBackButton={false} />
      <main className="px-4 py-4 space-y-6">
        <div className="relative">
          <Input 
            placeholder="와인 이름, 산지, 품종 검색" 
            className="pl-11"
          />
          <SearchIcon 
            size={18} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-main/30" 
          />
        </div>
        
        <section>
          <WineList wines={[]} />
          {/* 결과가 없을 때 EmptyState를 추후 추가 가능 */}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
