import Header from '@/components/common/header/Header';
import PageTitle from '@/components/common/page-title/PageTitle';
import LoginForm from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header showBackButton title="로그인" />
      <main className="px-6 py-8">
        <PageTitle 
          title="반가워요!" 
          description="주(酒)파수와 함께 당신만의 와인 취향을 찾아보세요." 
        />
        <LoginForm />
      </main>
    </div>
  );
}
