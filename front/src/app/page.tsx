import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/button/Button';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background px-6 pb-12 pt-24">
      <div className="flex flex-1 flex-col items-center justify-center w-full max-w-md space-y-8">
        <div className="relative h-44 w-44">
          <Image
            src="/logo.png"
            alt="JUPASU Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        
        <div className="space-y-3 text-center">
          <h1 className="text-lg font-bold text-text-main">
            당신의 완벽한 와인을 찾아드려요
          </h1>
          <p className="text-sm text-text-main/50 font-medium">
            Find Your Perfect Bottle
          </p>
        </div>
      </div>

      <div className="w-full max-w-md space-y-4">
        <Link href="/login" className="block w-full">
          <Button size="full" className="w-full text-lg shadow-sm">
            로그인
          </Button>
        </Link>
        <Link href="/signup" className="block w-full">
          <Button 
            variant="secondary" 
            size="full" 
            className="w-full text-lg bg-white border border-primary-100 shadow-sm hover:bg-gray-50"
          >
            회원가입
          </Button>
        </Link>
      </div>
    </div>
  );
}
