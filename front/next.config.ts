import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

// NextConfig 타입을 명시하여 ESLint 에러 해결
const nextConfig: NextConfig = {
  turbopack: {}, // Turbopack 빌드 충돌 방지용 빈 객체
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/images/:path*',
        destination: 'http://backend:8080/images/:path*', // Docker 내부망의 백엔드 주소로 프록시
      },
    ];
  },
};

export default withPWA(nextConfig);
