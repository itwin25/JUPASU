import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 최신 Next.js 버전 및 과도기적 버전을 모두 지원하기 위해 
  // 두 위치에 모두 bodySizeLimit 설정을 추가합니다.
  serverActions: {
    bodySizeLimit: '20mb',
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
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
