import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/lib/providers';
import ToastContainer from '@/components/ui/toast/Toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: '주(酒)파수 | 와인 추천 및 탐색 서비스',
  description: '나만의 와인 취향을 찾아가는 여정, 주(酒)파수',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
        <ToastContainer />
      </body>
    </html>
  );
}
