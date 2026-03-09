import Header from '@/components/common/header/Header';
import PageTitle from '@/components/common/page-title/PageTitle';

export default function PasswordResetPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header showBackButton title="비밀번호 찾기" />
      <main className="px-6 py-8">
        <PageTitle 
          title="비밀번호 찾기" 
          description="가입하신 이메일을 입력해주시면 임시 비밀번호를 보내드려요." 
        />
        {/* TODO: 비밀번호 재설정 폼 구현 */}
      </main>
    </div>
  );
}
