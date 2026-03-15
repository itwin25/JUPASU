import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/lib/providers';
import Script from 'next/script';

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
      <head>
        {/* 🚀 에루다(Eruda) 및 모니터링 플러그인 로드 */}
        <Script
          src="https://cdn.jsdelivr.net/npm/eruda"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/eruda-monitor"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
        
        <Script id="eruda-init" strategy="afterInteractive">
          {`
            if (typeof window !== 'undefined') {
              eruda.init();
              // 🚀 성능 모니터링 플러그인 등록
              eruda.add(erudaMonitor);
              eruda.position({ x: 10, y: 10 });
              
              // 모니터 탭을 기본으로 열고 싶다면 아래 실행 (선택사항)
              // eruda.show('monitor'); 
              
              console.log('✅ Performance Monitor Active');
            }
          `}
        </Script>
      </body>
    </html>
  );
}
