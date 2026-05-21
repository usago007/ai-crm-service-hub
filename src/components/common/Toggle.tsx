interface ToggleProps {
  on: boolean;
  onClick: () => void;
  label?: string;
  description?: string;
}

export function Toggle({ on, onClick, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--color-border-light)] text-[13px] last:border-b-0">
      <div>
        {label && <strong>{label}</strong>}
        {description && <br />}
        {description && <span className="text-xs text-[var(--color-text-secondary)]">{description}</span>}
      </div>
      <div
        className={`w-10 h-[22px] rounded-[11px] cursor-pointer relative transition-all duration-[var(--transition)] flex-shrink-0 ${on ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
        onClick={onClick}
      >
        <div
          className={`w-[18px] h-[18px] bg-white rounded-full absolute top-[2px] transition-all duration-[var(--transition)] shadow-[0_1px_2px_rgba(0,0,0,0.1)] ${on ? 'left-5' : 'left-[2px]'}`}
        />
      </div>
    </div>
  );
}
