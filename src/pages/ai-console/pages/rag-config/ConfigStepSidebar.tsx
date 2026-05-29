import { RAG_CONFIG_STEPS, type RagConfigStep } from './configSteps';

interface ConfigStepSidebarProps {
  activeStep: RagConfigStep;
  onStepChange: (step: RagConfigStep) => void;
  collapsed?: boolean;
}

export function ConfigStepSidebar({ activeStep, onStepChange, collapsed = false }: ConfigStepSidebarProps) {
  return (
    <nav className={`${collapsed ? 'w-[56px]' : 'w-[240px]'} flex-shrink-0 border-r border-[var(--color-border-light)] p-2 flex flex-col gap-0.5 transition-[width] duration-200`}>
      {RAG_CONFIG_STEPS.map((step, index) => {
        const isActive = activeStep === step.key;
        const Icon = step.icon;
        return (
          <button
            key={step.key}
            type="button"
            onClick={() => onStepChange(step.key)}
            title={collapsed ? step.label : undefined}
            className={`flex items-center gap-2 px-2 py-2 rounded-[12px] text-left transition-colors ${
              isActive
                ? 'bg-[rgba(179,92,32,0.04)] border-l-[2px] border-[var(--color-primary)] pl-[6px]'
                : 'hover:bg-[rgba(15,23,42,0.03)] border-l-[2px] border-transparent pl-[6px]'
            }`}
          >
            <span className="text-[10px] text-[var(--color-text-light)] font-mono w-[18px] text-right shrink-0">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className={`w-6 h-6 rounded-[8px] flex items-center justify-center shrink-0 ${isActive ? 'bg-[rgba(179,92,32,0.12)] text-[var(--color-primary)]' : 'bg-[rgba(15,23,42,0.05)] text-[var(--color-text-secondary)]'}`}>
              <Icon size={16} />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-[var(--color-text)] whitespace-nowrap">{step.label}</div>
              </div>
            )}
          </button>
        );
      })}
    </nav>
  );
}
