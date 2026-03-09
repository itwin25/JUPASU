import Image from 'next/image';
import LoginForm from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-12">
      <div className="flex flex-col items-center justify-center mt-12 mb-10 space-y-6">
        <div className="relative h-32 w-32">
          <Image
            src="/logo.png"
            alt="JUPASU Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-[28px] font-extrabold text-text-main">
            Welcome Back
          </h1>
          <p className="text-base text-text-main/60 font-medium">
            다시 만나서 반가워요!
          </p>
        </div>
      </div>
      
      <main className="w-full max-w-md mx-auto">
        <LoginForm />
      </main>
    </div>
  );
}
