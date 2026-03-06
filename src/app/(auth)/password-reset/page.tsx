import Header from '@/components/common/header/Header';
import PageTitle from '@/components/common/page-title/PageTitle';
import PasswordResetForm from '@/features/auth/components/PasswordResetForm';

export default function PasswordResetPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header showBackButton title="비밀번호 찾기" />
      <main className="px-6 py-8">
        <PageTitle 
          title="비밀번호 찾기" 
          description="이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다." 
        />
        <PasswordResetForm />
      </main>
    </div>
  );
}
