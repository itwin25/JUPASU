import { Wine } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-gray-900">
      <main className="flex max-w-lg flex-col items-center space-y-8 text-center">
        <div className="rounded-full bg-rose-100 p-4 text-rose-600">
          <Wine size={48} />
        </div>
        
        <div className="space-y-4">
          <h1 className={cn("text-4xl font-bold tracking-tight text-rose-900")}>
            주(酒)파수
          </h1>
          <p className="text-lg text-gray-600">
            나만의 와인 취향을 찾아가는 여정, 주(酒)파수에 오신 것을 환영합니다.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 font-semibold">와인 검색</h2>
            <p className="text-sm text-gray-500">다양한 와인을 탐색해보세요.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 font-semibold">AI 챗봇</h2>
            <p className="text-sm text-gray-500">당신에게 맞는 와인을 추천합니다.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
