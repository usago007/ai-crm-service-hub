import type { Toast as ToastType } from '../../types';

interface ToastContainerProps {
  toasts: ToastType[];
}

const TYPE_STYLES: Record<string, string> = {
  success: 'border-l-4 border-l-[var(--color-success)]',
  error: 'border-l-4 border-l-[var(--color-danger)]',
  info: 'border-l-4 border-l-[var(--color-info)]',
  warning: 'border-l-4 border-l-[var(--color-warning)]',
};

export function ToastContainer({ toasts }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[2000] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-[var(--radius)] bg-[var(--bg-card)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] text-[13px] flex items-center gap-2.5 max-w-[360px] pointer-events-auto animate-[slideIn_0.3s_ease] ${TYPE_STYLES[t.type] || ''}`}
        >
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
