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
  centerTitle?: boolean;
  hideCloseButton?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
  hideDefaultFooter = false,
  centerTitle = false,
  hideCloseButton = false,
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
        className="animate-in fade-in absolute inset-0 bg-black/30 backdrop-blur-[2px] duration-300"
        onClick={onClose}
      />

      <div
        className={cn(
          'bg-background animate-in fade-in zoom-in relative w-full max-w-sm rounded-[2rem] p-8 shadow-2xl duration-300',
          className,
        )}
      >
        {(title || !hideCloseButton) && (
          <div
            className={cn(
              'mb-6 flex items-center',
              centerTitle ? 'justify-center' : 'justify-between',
            )}
          >
            {title && (
              <h2
                className={cn(
                  'text-text-main text-xl font-bold tracking-tight',
                  centerTitle && 'flex-1 text-center',
                )}
              >
                {title}
              </h2>
            )}
            {!hideCloseButton && (
              <Button
                variant="icon"
                onClick={onClose}
                className={cn(
                  '-mr-2 border-none bg-transparent shadow-none',
                  centerTitle && 'absolute top-8 right-8',
                )}
              >
                <X size={24} className="text-text-main/40" />
              </Button>
            )}
          </div>
        )}

        <div className="text-text-main/80 mb-8 text-base leading-relaxed">{children}</div>

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
