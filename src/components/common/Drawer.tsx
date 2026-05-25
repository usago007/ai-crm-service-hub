import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  width?: string;
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

export function Drawer({ open, onClose, width = '460px', children, title, actions }: DrawerProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeydown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = '';
    };
  }, [onClose, open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[4500]">
      <button
        type="button"
        aria-label="关闭详情抽屉"
        className="absolute inset-0 bg-[rgba(15,23,42,0.18)] backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside
        className="absolute right-0 top-0 h-full max-w-full border-l border-[var(--color-border-light)] bg-[rgba(255,255,255,0.96)] shadow-[-24px_0_48px_rgba(15,23,42,0.12)] backdrop-blur-xl"
        style={{ width }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-light)] px-5 py-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold">{title ?? '详情'}</div>
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer" className="size-9 rounded-[12px]">
                <X size={16} />
              </Button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
