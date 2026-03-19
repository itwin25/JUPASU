'use client';

import { useState } from 'react';
import Modal from '@/components/ui/modal/Modal';
import Button from '@/components/ui/button/Button';
import Input from '@/components/ui/input/Input';
import { useWithdraw } from '../hooks/useWithdraw';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 회원 탈퇴 확인 및 비밀번호 입력을 담당하는 모달 컴포넌트
 */
export default function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const [password, setPassword] = useState('');
  const { handleWithdraw, isLoading } = useWithdraw();

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  const onSubmit = async () => {
    if (!password.trim()) {
      return;
    }
    await handleWithdraw(password);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="계정 삭제"
      centerTitle
      hideCloseButton
      className="w-[calc(100vw-2rem)] max-w-[18.5rem] rounded-[1.55rem] bg-[#F7F5F1] px-3.5 py-4"
      footer={
        <div className="flex gap-2 px-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClose}
            className="flex-1 rounded-[1rem] py-2.5"
          >
            취소
          </Button>
          <Button
            size="sm"
            onClick={onSubmit}
            isLoading={isLoading}
            disabled={!password.trim() || isLoading}
            className="flex-1 rounded-[1rem] bg-[#D65F69] py-2.5 hover:bg-[#C44B56]"
          >
            확인
          </Button>
        </div>
      }
    >
      <div className="space-y-3 py-2">
        <div className="text-center">
          <p className="text-text-main/75 text-sm font-bold">계정을 삭제하시겠습니까?</p>
          <p className="text-text-main/50 mt-1 text-xs">삭제된 데이터는 복구되지 않습니다.</p>
        </div>
        <Input
          label="비밀번호 확인"
          type="password"
          placeholder="계정 삭제를 위해 비밀번호 입력"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-[1rem] px-4 py-3 text-sm"
        />
      </div>
    </Modal>
  );
}
