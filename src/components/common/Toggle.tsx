interface ToggleProps {
  on: boolean;
  onClick: () => void;
  label?: string;
  description?: string;
}

export function Toggle({ on, onClick, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-light)] text-[13px] last:border-b-0 gap-3">
      <div className="min-w-0">
        {label ? <div className="font-medium text-[var(--color-text)]">{label}</div> : null}
        {description ? <div className="text-xs text-[var(--color-text-secondary)] mt-1 leading-5">{description}</div> : null}
      </div>
      <button
        type="button"
        aria-pressed={on}
        className={`w-11 h-6 rounded-full cursor-pointer relative transition-all duration-[var(--transition)] flex-shrink-0 border ${
          on
            ? 'bg-[var(--color-primary)] border-[rgba(179,92,32,0.18)] shadow-[0_10px_22px_-14px_rgba(179,92,32,0.7)]'
            : 'bg-[rgba(30,38,47,0.12)] border-[rgba(30,38,47,0.08)]'
        }`}
        onClick={onClick}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full absolute top-[1px] transition-all duration-[var(--transition)] shadow-[0_4px_12px_rgba(0,0,0,0.16)] ${on ? 'left-[22px]' : 'left-[1px]'}`}
        />
      </button>
    </div>
  );
}
