import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  width?: string;
  children: ReactNode;
  title?: string;
}

export function Drawer({ open, onClose, width = '420px', children, title }: DrawerProps) {
  if (!open) return null;
  return (
    <div
      className="shell-card sticky top-4 max-h-[calc(100vh-120px)] overflow-y-auto rounded-[28px]"
      style={{ width, flexShrink: 0 }}
    >
      <div className="relative">
        <div className="sticky top-0 z-10 px-5 py-4 border-b border-[var(--color-border-light)] bg-[rgba(255,255,255,0.7)] backdrop-blur-xl flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">{title ?? 'Details'}</div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer">
            <X size={16} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
