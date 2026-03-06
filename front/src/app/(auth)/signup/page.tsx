import Header from '@/components/common/header/Header';
import PageTitle from '@/components/common/page-title/PageTitle';
import SignupForm from '@/features/auth/components/SignupForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header showBackButton title="회원가입" />
      <main className="px-6 py-8">
        <PageTitle 
          title="회원가입" 
          description="기본 정보를 입력하고 회원가입을 완료해주세요." 
        />
        <SignupForm />
      </main>
    </div>
  );
}
