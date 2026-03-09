import Header from '@/components/common/header/Header';
import PageTitle from '@/components/common/page-title/PageTitle';
import Button from '@/components/ui/button/Button';
import { CheckCircle2 } from 'lucide-react';

export default function SignupCompletePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 px-6 py-20 flex flex-col items-center text-center space-y-8">
        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 animate-bounce">
          <CheckCircle2 size={56} />
        </div>
        <PageTitle 
          title="가입을 축하드려요!" 
          description="이제 주파수와 함께 와인의 세계로 떠나볼까요?" 
          className="items-center"
        />
        <Button variant="primary" size="full" className="max-w-xs">
          시작하기
        </Button>
      </main>
    </div>
  );
}
