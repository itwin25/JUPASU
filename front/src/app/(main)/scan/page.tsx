'use client';

import Header from '@/components/common/header/Header';
import PageTitle from '@/components/common/page-title/PageTitle';
import Scanner from '@/features/scan/components/Scanner';
import Script from 'next/script';

export default function ScanPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ONNX Runtime 엔진 로드 (WASM, WebGL, WebGPU 통합 버전) */}
      <Script src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/ort.all.min.js" strategy="beforeInteractive" crossOrigin="anonymous" />
      {/* paddleocr 라이브러리 CDN 로드 (SSR 충돌 방지) */}
      <Script src="https://cdn.jsdelivr.net/npm/paddleocr@1.0.7/dist/index.js" strategy="beforeInteractive" crossOrigin="anonymous" />
      {/* 로컬 OpenCV.js 로드 (멀티코어 호환 및 빌드 에러 방지) */}
      <Script src="/opencv.js" strategy="beforeInteractive" />
      
      <Header title="와인 스캔" showBackButton={false} />
      <main className="px-6 py-8 flex flex-col items-center text-center space-y-8">
        <PageTitle 
          title="와인 라벨 스캔" 
          description="와인 라벨을 촬영하면 인공지능이 정보를 분석해드려요." 
        />
        
        <Scanner />
      </main>
    </div>
  );
}
