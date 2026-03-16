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
  hideDefaultFooter?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
  hideDefaultFooter = false,
}: ModalProps) {
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
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div
        className={cn(
          'relative w-full max-w-sm rounded-[2rem] bg-background p-8 shadow-2xl animate-in fade-in zoom-in duration-300',
          className,
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-text-main">{title}</h2>
          <Button
            variant="icon"
            onClick={onClose}
            className="-mr-2 border-none bg-transparent shadow-none"
          >
            <X size={24} className="text-text-main/40" />
          </Button>
        </div>

        <div className="mb-8 text-base leading-relaxed text-text-main/80">{children}</div>

        {footer ? (
          <div className="flex flex-col gap-3">{footer}</div>
        ) : !hideDefaultFooter ? (
          <Button variant="primary" size="full" onClick={onClose} className="rounded-2xl">
            확인
          </Button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
