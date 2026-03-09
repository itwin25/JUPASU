import Header from '@/components/common/header/Header';
import PageTitle from '@/components/common/page-title/PageTitle';
import EmptyState from '@/components/common/empty-state/EmptyState';
import { MessageCircle } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header title="AI 챗봇" showBackButton={false} />
      <main className="px-6 py-8">
        <PageTitle title="주파수 AI" description="당신의 취향에 맞는 와인을 물어보세요." />
        <EmptyState 
          icon={<MessageCircle size={48} className="text-primary-100" />}
          title="대화를 시작해보세요"
          description="어떤 와인을 찾고 계신가요? 상황이나 맛을 설명해주시면 추천해드릴게요."
        />
      </main>
    </div>
  );
}
