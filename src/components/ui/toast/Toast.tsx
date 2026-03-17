'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toast as ToastType, useToastStore } from '@/stores/toast.store';

const icons = {
  success: <CheckCircle className="text-green-500" size={20} />,
  error: <AlertCircle className="text-[#B36262]" size={20} />,
  info: <Info className="text-primary-600" size={20} />,
  warning: <AlertTriangle className="text-amber-500" size={20} />,
};

const borderColors = {
  success: 'border-green-100',
  error: 'border-red-100',
  info: 'border-primary-100',
  warning: 'border-amber-100',
};

export function Toast({ id, message, type, duration = 3000 }: ToastType) {
  const removeToast = useToastStore((state) => state.removeToast);
  const [isExiting, setIsExiting] = useState(false);

  // 3초 뒤 자동 제거 타이머
  useEffect(() => {
    if (duration > 0) {
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, duration - 300);

      const removeTimer = setTimeout(() => {
        removeToast(id);
      }, duration);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [id, duration, removeToast]);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => removeToast(id), 300);
  };

  return (
    <div
      className={cn(
        'animate-in slide-in-from-right-8 fade-in duration-300',
        isExiting && 'animate-out slide-out-to-right-8 fade-out',
      )}
    >
      <div
        className={cn(
          'flex w-fit max-w-[90vw] items-center gap-3 rounded-[2rem] border bg-white px-5 py-4 shadow-xl md:max-w-md',
          borderColors[type],
        )}
      >
        <div className="flex-shrink-0">{icons[type]}</div>
        <p className="text-text-main flex-1 text-sm font-bold break-keep">{message}</p>
        <button
          onClick={handleRemove}
          className="text-text-main/20 hover:text-text-main/40 ml-2 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-[100] flex flex-col gap-3">
      <div className="pointer-events-auto flex flex-col gap-3">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </div>
  );
}
