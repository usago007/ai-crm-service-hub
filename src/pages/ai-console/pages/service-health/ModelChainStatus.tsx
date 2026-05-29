import { useState } from 'react';
import { Badge } from '../../../../components/common/Badge';
import { StatusPill, healthBadgeVariant, booleanLabel } from './helpers';
import { displayScenario } from '../../../../utils/display';
import type { FunctionalModelStatus, ScenarioModelStatus } from '../../../../types';

interface ModelChainStatusProps {
  functionalModelStatuses: FunctionalModelStatus[];
  scenarioModelStatuses: ScenarioModelStatus[];
}

type ModelTab = 'functional' | 'scenario';

function FunctionalModelCard({ item, expanded, onToggle }: { item: FunctionalModelStatus; expanded: boolean; onToggle: () => void }) {
  const isHealthy = item.status === 'healthy';
  return (
    <article className="rounded-[22px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              className="text-[15px] font-medium tracking-[-0.02em] hover:opacity-70 transition-opacity text-left"
              onClick={onToggle}
            >
              {item.nodeName}
            </button>
            {isHealthy && (
              <Badge variant="green" className="rounded-[8px] px-2 py-0.5 text-[10px]">健康</Badge>
            )}
          </div>
          <div className="mt-1 text-xs text-[var(--color-text-secondary)]">{item.primaryModel}</div>
        </div>
        {!isHealthy && <StatusPill status={item.status} />}
      </div>
      {expanded && !isHealthy && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-[14px] bg-[rgba(255,255,255,0.74)] px-3 py-2">
            <span className="text-[var(--color-text-light)]">延迟</span>
            <div className="mt-1 font-medium">{item.avgLatencyMs} 毫秒</div>
          </div>
          <div className="rounded-[14px] bg-[rgba(255,255,255,0.74)] px-3 py-2">
            <span className="text-[var(--color-text-light)]">错误率</span>
            <div className="mt-1 font-medium">{item.errorRate}%</div>
          </div>
          <div className="rounded-[14px] bg-[rgba(255,255,255,0.74)] px-3 py-2">
            <span className="text-[var(--color-text-light)]">超时</span>
            <div className="mt-1 font-medium">{item.timeoutMs} 毫秒</div>
          </div>
        </div>
      )}
      {expanded && isHealthy && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-[14px] bg-[rgba(255,255,255,0.74)] px-3 py-2">
            <span className="text-[var(--color-text-light)]">延迟</span>
            <div className="mt-1 font-medium">{item.avgLatencyMs} 毫秒</div>
          </div>
          <div className="rounded-[14px] bg-[rgba(255,255,255,0.74)] px-3 py-2">
            <span className="text-[var(--color-text-light)]">错误率</span>
            <div className="mt-1 font-medium">{item.errorRate}%</div>
          </div>
          <div className="rounded-[14px] bg-[rgba(255,255,255,0.74)] px-3 py-2">
            <span className="text-[var(--color-text-light)]">超时</span>
            <div className="mt-1 font-medium">{item.timeoutMs} 毫秒</div>
          </div>
        </div>
      )}
      <div className="mt-3 text-xs text-[var(--color-text-secondary)]">{item.usedBy}</div>
    </article>
  );
}

function ScenarioModelCard({ item, expanded, onToggle }: { item: ScenarioModelStatus; expanded: boolean; onToggle: () => void }) {
  const isHealthy = item.status === 'healthy';
  return (
    <article className="rounded-[22px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              className="text-[15px] font-medium tracking-[-0.02em] hover:opacity-70 transition-opacity text-left"
              onClick={onToggle}
            >
              {displayScenario(item.scenario)}
            </button>
            {isHealthy && (
              <Badge variant="green" className="rounded-[8px] px-2 py-0.5 text-[10px]">健康</Badge>
            )}
          </div>
          <div className="mt-1 text-xs text-[var(--color-text-secondary)]">{item.strategyName}</div>
        </div>
        {!isHealthy && <StatusPill status={item.status} />}
      </div>
      {expanded && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-[14px] bg-[rgba(255,255,255,0.74)] px-3 py-2">
            <span className="text-[var(--color-text-light)]">延迟</span>
            <div className="mt-1 font-medium">{item.avgLatencyMs} 毫秒</div>
          </div>
          <div className="rounded-[14px] bg-[rgba(255,255,255,0.74)] px-3 py-2">
            <span className="text-[var(--color-text-light)]">错误率</span>
            <div className="mt-1 font-medium">{item.errorRate}%</div>
          </div>
          <div className="rounded-[14px] bg-[rgba(255,255,255,0.74)] px-3 py-2">
            <span className="text-[var(--color-text-light)]">人工复核</span>
            <div className="mt-1 font-medium">{booleanLabel(item.manualReviewRequired, '需要', '无需')}</div>
          </div>
          <div className="rounded-[14px] bg-[rgba(255,255,255,0.74)] px-3 py-2">
            <span className="text-[var(--color-text-light)]">人工发送</span>
            <div className="mt-1 font-medium">{booleanLabel(item.humanSendAllowed, '允许', '禁止')}</div>
          </div>
        </div>
      )}
    </article>
  );
}

export function ModelChainStatus({ functionalModelStatuses, scenarioModelStatuses }: ModelChainStatusProps) {
  const [tab, setTab] = useState<ModelTab>('functional');
  const [anomalyOnly, setAnomalyOnly] = useState(true);
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    setExpandedModels(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const functionalAbnormal = functionalModelStatuses.filter(f => f.status !== 'healthy');
  const scenarioAbnormal = scenarioModelStatuses.filter(s => s.status !== 'healthy');

  const functionalItems = anomalyOnly ? functionalAbnormal : functionalModelStatuses;
  const scenarioItems = anomalyOnly ? scenarioAbnormal : scenarioModelStatuses;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--color-text)]">模型链路状态</div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-xs text-[var(--color-text-secondary)]">仅显示异常</span>
          <button
            role="switch"
            aria-checked={anomalyOnly}
            onClick={() => setAnomalyOnly(prev => !prev)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${anomalyOnly ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border-strong)]'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${anomalyOnly ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
          </button>
        </label>
      </div>

      <div className="flex gap-1 bg-[rgba(30,38,47,0.04)] rounded-[16px] p-1 w-fit">
        <button
          className={`px-4 py-2 rounded-[13px] text-[13px] font-medium transition-colors ${
            tab === 'functional' ? 'bg-white text-[var(--color-text)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
          onClick={() => setTab('functional')}
        >
          按职能节点
          {functionalAbnormal.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#b46417] text-white text-[10px]">{functionalAbnormal.length}</span>
          )}
        </button>
        <button
          className={`px-4 py-2 rounded-[13px] text-[13px] font-medium transition-colors ${
            tab === 'scenario' ? 'bg-white text-[var(--color-text)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
          onClick={() => setTab('scenario')}
        >
          按业务场景
          {scenarioAbnormal.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#b46417] text-white text-[10px]">{scenarioAbnormal.length}</span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
        {tab === 'functional' && functionalItems.length > 0 && functionalItems.map(item => (
          <FunctionalModelCard
            key={item.nodeId}
            item={item}
            expanded={!item.status || expandedModels.has(item.nodeId)}
            onToggle={() => toggleExpand(item.nodeId)}
          />
        ))}
        {tab === 'functional' && functionalItems.length === 0 && (
          <div className="col-span-2 text-center text-sm text-[var(--color-text-secondary)] py-8">当前没有异常模型节点</div>
        )}
        {tab === 'scenario' && scenarioItems.length > 0 && scenarioItems.map(item => (
          <ScenarioModelCard
            key={item.scenario}
            item={item}
            expanded={expandedModels.has(item.scenario)}
            onToggle={() => toggleExpand(item.scenario)}
          />
        ))}
        {tab === 'scenario' && scenarioItems.length === 0 && (
          <div className="col-span-2 text-center text-sm text-[var(--color-text-secondary)] py-8">当前没有异常业务场景</div>
        )}
      </div>
    </div>
  );
}
