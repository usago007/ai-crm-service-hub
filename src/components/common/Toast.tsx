import type { Toast as ToastType } from '../../types';

interface ToastContainerProps {
  toasts: ToastType[];
}

const TYPE_STYLES: Record<string, string> = {
  success: 'bg-[rgba(240,253,244,0.92)] border-[rgba(31,143,103,0.16)] text-[var(--color-success)]',
  error: 'bg-[rgba(255,241,239,0.92)] border-[rgba(200,85,76,0.18)] text-[var(--color-danger)]',
  info: 'bg-[rgba(239,246,255,0.92)] border-[rgba(47,110,167,0.16)] text-[var(--color-info)]',
  warning: 'bg-[rgba(255,247,237,0.92)] border-[rgba(187,106,31,0.18)] text-[var(--color-warning)]',
};

export function ToastContainer({ toasts }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[2000] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-[20px] border shadow-[0_22px_42px_-28px_rgba(15,23,42,0.45)] text-[13px] flex items-center gap-2.5 max-w-[360px] pointer-events-auto animate-[slideIn_0.3s_ease] backdrop-blur ${TYPE_STYLES[t.type] || ''}`}
        >
          <span className="inline-flex size-6 items-center justify-center rounded-[10px] bg-[rgba(255,255,255,0.72)] text-[11px] font-semibold">
            {t.type === 'success' ? '✓' : t.type === 'error' ? '!' : t.type === 'warning' ? '!' : 'i'}
          </span>
          <span className="text-[var(--color-text)]">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
