import Header from '@/components/common/header/Header';
import PageTitle from '@/components/common/page-title/PageTitle';
import Button from '@/components/ui/button/Button';
import { Camera } from 'lucide-react';

export default function ScanPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header title="와인 스캔" showBackButton={false} />
      <main className="px-6 py-8 flex flex-col items-center text-center space-y-8">
        <PageTitle 
          title="와인 라벨 스캔" 
          description="와인 라벨을 촬영하면 인공지능이 정보를 분석해드려요." 
        />
        
        <div className="w-full aspect-[3/4] bg-white rounded-[2rem] border-2 border-dashed border-primary-100 flex flex-col items-center justify-center space-y-4">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-700">
            <Camera size={40} />
          </div>
          <p className="text-text-main/40 font-bold">카메라 권한이 필요합니다</p>
        </div>

        <Button variant="primary" size="full" className="shadow-lg">
          촬영하기
        </Button>
      </main>
    </div>
  );
}
