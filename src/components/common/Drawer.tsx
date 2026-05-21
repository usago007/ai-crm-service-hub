import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  width?: string;
  children: ReactNode;
}

export function Drawer({ open, onClose, width = '420px', children }: DrawerProps) {
  if (!open) return null;
  return (
    <div
      className="border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--bg-card)] overflow-y-auto sticky top-0 max-h-[calc(100vh-140px)]"
      style={{ width, flexShrink: 0 }}
    >
      <div style={{ position: 'relative' }}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-[var(--color-bg)] border-none rounded-full w-7 h-7 flex items-center justify-center cursor-pointer text-[var(--color-text-secondary)] hover:bg-[var(--color-border-light)]"
        >
          <X size={14} />
        </button>
        {children}
      </div>
    </div>
  );
}
