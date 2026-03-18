import Image from 'next/image';
import Link from 'next/link';
import PasswordResetForm from '@/features/auth/components/PasswordResetForm';

export default function PasswordResetPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center px-4 pt-30">
      <Link href="/" className="mb-12 transition-opacity hover:opacity-80">
        <div className="relative h-32 w-32">
          <Image src="/logo.png" alt="JUPASU Logo" fill className="object-contain" priority />
        </div>
      </Link>

      <main className="w-full max-w-md">
        <PasswordResetForm />
      </main>
    </div>
  );
}
