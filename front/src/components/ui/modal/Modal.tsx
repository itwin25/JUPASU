'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '../button/Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, footer, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-4">
      {/* Overlay - 부드러운 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Content - 큰 radius와 여백 */}
      <div 
        className={cn(
          "relative w-full max-w-sm rounded-[2rem] bg-background p-8 shadow-2xl animate-in fade-in zoom-in duration-300",
          className
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-main tracking-tight">{title}</h2>
          <Button variant="icon" onClick={onClose} className="border-none shadow-none -mr-2 bg-transparent">
            <X size={24} className="text-text-main/40" />
          </Button>
        </div>

        <div className="text-text-main/80 text-base leading-relaxed mb-8">
          {children}
        </div>

        {footer ? (
          <div className="flex flex-col gap-3">
            {footer}
          </div>
        ) : (
          <Button variant="primary" size="full" onClick={onClose} className="rounded-2xl">
            확인
          </Button>
        )}
      </div>
    </div>,
    document.body
  );
}
