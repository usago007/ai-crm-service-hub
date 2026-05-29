import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function Modal({ open, onClose, title, children, actions }: ModalProps) {
  if (!open) return null;

  const modalNode = (
    <div
      className="fixed inset-0 bg-[rgba(20,24,29,0.42)] z-[5000] flex items-center justify-center p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="shell-card rounded-[30px] w-[520px] max-w-[92vw] max-h-[82vh] overflow-y-auto shadow-[var(--shadow-lg)]">
        {(title || actions) ? (
          <div className="px-6 py-4 border-b border-[var(--color-border-light)] flex items-center justify-between gap-3">
            {title ? <div className="text-base font-semibold">{title}</div> : <div />}
            {actions ? <div className="flex items-center gap-2">{actions}<Button variant="ghost" size="sm" onClick={onClose}>关闭</Button></div> : <Button variant="ghost" size="sm" onClick={onClose}>关闭</Button>}
          </div>
        ) : null}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return modalNode;
  return createPortal(modalNode, document.body);
}
