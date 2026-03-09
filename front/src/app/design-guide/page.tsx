'use client';

import { useState } from 'react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/ui/input/Input';
import Card from '@/components/ui/card/Card';
import Chip from '@/components/ui/chip/Chip';
import Badge from '@/components/ui/badge/Badge';
import Modal from '@/components/ui/modal/Modal';
import Header from '@/components/common/header/Header';
import PageTitle from '@/components/common/page-title/PageTitle';
import SectionTitle from '@/components/common/section-title/SectionTitle';
import LoadingSpinner from '@/components/common/loading-spinner/LoadingSpinner';
import EmptyState from '@/components/common/empty-state/EmptyState';
import { Search, Heart, Share2, Bell } from 'lucide-react';

export default function DesignGuidePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChip, setSelectedChip] = useState('레드');

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header 
        title="디자인 가이드" 
        rightSlot={
          <div className="flex gap-1">
            <Button variant="icon" className="bg-transparent border-none shadow-none"><Search size={20}/></Button>
            <Button variant="icon" className="bg-transparent border-none shadow-none"><Bell size={20}/></Button>
          </div>
        }
      />
      
      <main className="px-6 py-8 space-y-12">
        {/* Typography */}
        <section className="space-y-4">
          <SectionTitle title="1. Typography & Titles" />
          <PageTitle 
            title="페이지 메인 타이틀" 
            description="여기는 보조 설명이 들어가는 자리입니다. 디자인 시스템 폰트가 잘 적용되었나요?" 
          />
        </section>

        {/* Buttons */}
        <section className="space-y-4">
          <SectionTitle title="2. Buttons" />
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
            <Button variant="icon"><Heart size={20} className="text-red-500 fill-red-500" /></Button>
            <Button variant="icon"><Share2 size={20} /></Button>
          </div>
          <Button variant="primary" size="full" isLoading>Loading State</Button>
        </section>

        {/* Badges & Chips */}
        <section className="space-y-4">
          <SectionTitle title="3. Badges & Chips" />
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">Primary Badge</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="soft">Soft Style</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {['레드', '화이트', '스파클링', '로제'].map(item => (
              <Chip 
                key={item} 
                active={selectedChip === item} 
                onClick={() => setSelectedChip(item)}
              >
                {item}
              </Chip>
            ))}
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-4">
          <SectionTitle title="4. Inputs" />
          <Input label="기본 입력창" placeholder="이름을 입력하세요" />
          <Input label="에러 상태" placeholder="잘못된 입력" error="올바른 형식이 아닙니다." />
          <Input label="비활성 상태" placeholder="수정 불가" disabled />
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <SectionTitle title="5. Cards" />
          <div className="grid gap-4">
            <Card variant="default">
              <h4 className="font-bold mb-1">Default Card</h4>
              <p className="text-sm text-text-main/50">가장 기본적인 흰색 카드 스타일입니다.</p>
            </Card>
            <Card variant="soft">
              <h4 className="font-bold mb-1">Soft Card</h4>
              <p className="text-sm text-text-main/50">배경색이 깔린 부드러운 카드입니다.</p>
            </Card>
            <Card variant="outlined" padding="sm">
              <h4 className="font-bold mb-1">Outlined Card</h4>
              <p className="text-sm text-text-main/50">테두리만 있는 카드입니다.</p>
            </Card>
          </div>
        </section>

        {/* Feedback & Status */}
        <section className="space-y-4">
          <SectionTitle title="6. Status" />
          <div className="space-y-8">
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-bold text-text-main/30">Loading Spinner</p>
              <LoadingSpinner />
            </div>
            <EmptyState 
              title="데이터가 없어요" 
              description="검색 결과가 없습니다. 다른 단어로 검색해보세요."
              action={<Button variant="outline" size="sm">다시 시도</Button>}
            />
          </div>
        </section>

        {/* Modal */}
        <section className="space-y-4">
          <SectionTitle title="7. Interactive" />
          <Button variant="primary" size="full" onClick={() => setIsModalOpen(true)}>
            모달 열기 테스트
          </Button>
          <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            title="모달 테스트"
          >
            <p>디자인 시스템 모달이 정상적으로 작동합니다. 부드러운 오버레이와 애니메이션을 확인하세요.</p>
          </Modal>
        </section>
      </main>
    </div>
  );
}
