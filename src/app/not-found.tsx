import Link from 'next/link';
import { ROUTE_PATH } from '@/constants/route-path';

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center p-8 text-center">
      <h2 className="text-4xl font-bold text-rose-900">404</h2>
      <p className="mt-4 text-lg text-gray-600">페이지를 찾을 수 없습니다.</p>
      <Link
        href={ROUTE_PATH.HOME}
        className="mt-8 rounded-lg bg-rose-600 px-6 py-3 text-white transition-colors hover:bg-rose-700"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
