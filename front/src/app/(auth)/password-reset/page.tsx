import Image from 'next/image';
import PasswordResetForm from '@/features/auth/components/PasswordResetForm';

export default function PasswordResetPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-6 pt-20">
      <div className="mb-12">
        <div className="relative h-32 w-32">
          <Image
            src="/logo.png"
            alt="JUPASU Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
      
      <main className="w-full max-w-md">
        <PasswordResetForm />
      </main>
    </div>
  );
}
