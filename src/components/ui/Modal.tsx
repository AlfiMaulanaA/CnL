'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalProps = {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  /** Hide the ✕ button (forced decisions). */
  hideClose?: boolean;
  maxWidth?: string;
};

export function Modal({ open, onClose, title, children, hideClose = false, maxWidth = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`card relative w-full ${maxWidth} animate-pop-in p-5 sm:p-6`}
      >
        {!hideClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {title && <h2 className="mb-3 pr-8 text-xl font-bold text-slate-800">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
