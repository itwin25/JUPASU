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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-5">
      <div
        className="animate-in fade-in absolute inset-0 bg-black/28 backdrop-blur-[3px] duration-300"
        onClick={onClose}
      />

      <div
        className={cn(
          'bg-background animate-in fade-in zoom-in border-primary-100/70 relative w-full max-w-sm rounded-[1.9rem] border px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-[0_18px_46px_rgba(51,34,17,0.14)] duration-300 sm:px-6 sm:pt-6 sm:pb-6',
          className,
        )}
      >
        {(title || !hideCloseButton) && (
          <div
            className={cn(
              'mb-5 flex items-center',
              centerTitle ? 'justify-center' : 'justify-between',
            )}
          >
            {title && (
              <h2
                className={cn(
                  'text-text-main text-[1.15rem] font-extrabold tracking-tight',
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
                  '-mr-1.5 border-none bg-transparent shadow-none',
                  centerTitle && 'absolute top-5 right-5 sm:top-6 sm:right-6',
                )}
              >
                <X size={22} className="text-text-main/42" />
              </Button>
            )}
          </div>
        )}

        <div className="text-text-main/78 mb-6 text-[15px] leading-relaxed sm:mb-7">{children}</div>

        {footer ? (
          <div className="flex flex-col gap-2.5">{footer}</div>
        ) : !hideDefaultFooter ? (
          <Button variant="primary" size="full" onClick={onClose}>
            ?類ㅼ뵥
          </Button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
