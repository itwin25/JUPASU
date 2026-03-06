import Header from '@/components/common/header/Header';
import SectionTitle from '@/components/common/section-title/SectionTitle';
import Card from '@/components/ui/card/Card';
import BottomNav from '@/components/common/bottom-nav/BottomNav';
import { User, Settings, ChevronRight } from 'lucide-react';

export default function MyPage() {
  const menus = [
    { title: '내 정보 수정', icon: User, path: '/mypage/profile' },
    { title: '취향 정보 수정', icon: Settings, path: '/mypage/taste' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="마이페이지" showBackButton={false} />
      <main className="px-4 py-6 space-y-6">
        <Card className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xl">
            주
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-text-main">주파수님</h2>
            <p className="text-sm text-text-main/40">나만의 와인을 찾아가는 중</p>
          </div>
        </Card>

        <section className="space-y-3">
          <SectionTitle title="설정" />
          <div className="space-y-2">
            {menus.map((menu) => (
              <Card key={menu.title} padding="sm" className="flex items-center justify-between active:bg-gray-50">
                <div className="flex items-center gap-3">
                  <menu.icon size={20} className="text-text-main/60" />
                  <span className="font-bold text-text-main/80">{menu.title}</span>
                </div>
                <ChevronRight size={18} className="text-text-main/20" />
              </Card>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
