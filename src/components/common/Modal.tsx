import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/40 z-[1000] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[var(--bg-card)] rounded-[var(--radius-lg)] p-6 w-[460px] max-w-[90vw] max-h-[80vh] overflow-y-auto shadow-[var(--shadow-lg)]">
        {title && <div className="text-base font-semibold mb-4">{title}</div>}
        {children}
      </div>
    </div>
  );
}
