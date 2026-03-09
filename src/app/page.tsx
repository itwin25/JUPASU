'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/initial');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="relative h-48 w-48 animate-in fade-in zoom-in duration-1000">
        <Image
          src="/logo.png"
          alt="JUPASU Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
