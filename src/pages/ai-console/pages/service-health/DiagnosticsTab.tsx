import { useState } from 'react';
import { Badge } from '../../../../components/common/Badge';
import { Button } from '../../../../components/common/Button';
import { inputCls } from '../../sharedUtils';
import { DependencyNode, healthBadgeVariant, healthStatusLabel } from './helpers';
import type { LLMStatus, EmbeddingServiceStatus, VectorDbStatus, DocumentIngestionQueueStatus, FunctionalModelStatus, ScenarioModelStatus, ServiceHealthStatus } from '../../../../types';

interface HealthHistoryItem {
  checkedAt: string;
  status: ServiceHealthStatus;
  summary: string;
  findings: number;
}

interface DiagnosticsTabProps {
  history: HealthHistoryItem[];
  llmStatus: LLMStatus;
  embeddingStatus: EmbeddingServiceStatus;
  vectorDbStatus: VectorDbStatus;
  ingestionQueue: DocumentIngestionQueueStatus;
  functionalModelStatuses: FunctionalModelStatus[];
  scenarioModelStatuses: ScenarioModelStatus[];
  failedConnectorCount: number;
  llmErrorRate: number;
  llmAvgLatency: number;
  llmRateLimitUsage: number;
}

interface ThresholdState {
  errorRate: number;
  latencyMs: number;
  rateLimit: number;
  citationCoverage: number;
  emptyRetrieval: number;
}

const DEFAULT_THRESHOLDS: ThresholdState = {
  errorRate: 5,
  latencyMs: 3000,
  rateLimit: 80,
  citationCoverage: 80,
  emptyRetrieval: 5,
};

function loadThresholds(): ThresholdState {
  try {
    const saved = sessionStorage.getItem('health-alert-thresholds');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_THRESHOLDS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_THRESHOLDS };
}

function persistThresholds(t: ThresholdState) {
  sessionStorage.setItem('health-alert-thresholds', JSON.stringify(t));
}

export function DiagnosticsTab({
  history,
  llmStatus,
  embeddingStatus,
  vectorDbStatus,
  ingestionQueue,
  functionalModelStatuses,
  scenarioModelStatuses,
  failedConnectorCount,
  llmErrorRate,
  llmAvgLatency,
  llmRateLimitUsage,
}: DiagnosticsTabProps) {
  const [depGraphOpen, setDepGraphOpen] = useState(false);
  const [alertRulesOpen, setAlertRulesOpen] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [thresholds, setThresholds] = useState<ThresholdState>(loadThresholds);
  const [dirty, setDirty] = useState(false);

  const toggleHistory = (checkedAt: string) => {
    setExpandedHistory(prev => {
      const next = new Set(prev);
      if (next.has(checkedAt)) next.delete(checkedAt); else next.add(checkedAt);
      return next;
    });
  };

  const functionalAbnormal = functionalModelStatuses.filter(f => f.status !== 'healthy').length;
  const scenarioAbnormal = scenarioModelStatuses.filter(s => s.status !== 'healthy').length;

  return (
    <div className="space-y-5">
      {/* 诊断历史 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--color-text)]">诊断历史</div>
          <span className="text-[11px] text-[var(--color-text-light)]">最近 {history.length} 次</span>
        </div>

        <div className="shell-card rounded-[24px] divide-y divide-[var(--color-border-light)]">
          {history.map(item => {
            const isExpanded = expandedHistory.has(item.checkedAt);
            return (
              <div key={item.checkedAt}>
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[rgba(30,38,47,0.02)] transition-colors"
                  onClick={() => toggleHistory(item.checkedAt)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-sm font-medium whitespace-nowrap">{item.checkedAt}</div>
                    <Badge variant={healthBadgeVariant(item.status)} className="rounded-[8px] px-2 py-0.5 text-[10px]">
                      {healthStatusLabel(item.status)}
                    </Badge>
                    {item.findings > 0 && (
                      <span className="text-[11px] text-[var(--color-text-light)]">{item.findings} 项发现</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-[var(--color-text-secondary)] hidden sm:inline truncate max-w-[240px]">{item.summary}</span>
                    <span className={`text-[11px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 space-y-2">
                    <div className="text-xs text-[var(--color-text-secondary)]">{item.summary}</div>
                    <div className="text-xs text-[var(--color-text-light)]">
                      检查到 {item.findings} 项发现，建议根据严重程度逐项排查。
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 依赖链路（可折叠） */}
      <div className="space-y-4">
        <button
          className="w-full flex items-center justify-between shell-card rounded-[24px] p-5 text-left hover:opacity-80 transition-opacity"
          onClick={() => setDepGraphOpen(prev => !prev)}
        >
          <div className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--color-text)]">依赖链路</div>
          <div className={`transform transition-transform text-[var(--color-text-light)] ${depGraphOpen ? 'rotate-180' : ''}`}>▼</div>
        </button>

        {depGraphOpen && (
          <div className="shell-card rounded-[24px] p-5">
            <div className="text-xs text-[var(--color-text-secondary)] mb-4">用于排查模型、向量库、连接器与索引发布之间的依赖关系</div>
            <div className="space-y-4">
              <div className="rounded-[22px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-5">
                <div className="flex items-center gap-4 flex-wrap max-[900px]:flex-col max-[900px]:items-start">
                  <DependencyNode label="LLM API" status={llmStatus.status} />
                  <div className="text-[var(--color-text-light)] text-lg max-[900px]:rotate-90">&rarr;</div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <DependencyNode label={`职能模型 (${functionalModelStatuses.length})`} status={functionalAbnormal > 0 ? 'degraded' : 'healthy'} size="sm" />
                      <div className="text-[var(--color-text-light)] text-sm">&rarr;</div>
                      <DependencyNode label={`场景模型 (${scenarioModelStatuses.length})`} status={scenarioAbnormal > 0 ? 'degraded' : 'healthy'} size="sm" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">
                <div className="rounded-[22px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-4">
                  <div className="flex items-center gap-3">
                    <DependencyNode label="Embedding" status={embeddingStatus.status} size="sm" />
                    <div className="text-[var(--color-text-light)]">&rarr;</div>
                    <DependencyNode label="Vector DB" status={vectorDbStatus.indexStatus === 'ready' ? 'healthy' : vectorDbStatus.indexStatus === 'building' ? 'degraded' : 'down'} size="sm" />
                  </div>
                  <div className="mt-3 text-xs text-[var(--color-text-secondary)]">向量化与检索链路</div>
                </div>
                <div className="rounded-[22px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <DependencyNode label="Connectors" status={failedConnectorCount > 0 ? 'degraded' : 'healthy'} size="sm" />
                    <div className="text-[var(--color-text-light)]">&rarr;</div>
                    <DependencyNode label="Knowledge DB" status={ingestionQueue.queueStatus} size="sm" />
                  </div>
                  <div className="mt-3 text-xs text-[var(--color-text-secondary)]">数据接入与知识资产</div>
                </div>
                <div className="rounded-[22px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <DependencyNode label="Ingestion Queue" status={ingestionQueue.queueStatus} size="sm" />
                    <div className="text-[var(--color-text-light)]">&rarr;</div>
                    <DependencyNode label="Index Pipeline" status={vectorDbStatus.indexStatus === 'ready' ? 'healthy' : vectorDbStatus.indexStatus === 'building' ? 'degraded' : 'down'} size="sm" />
                  </div>
                  <div className="mt-3 text-xs text-[var(--color-text-secondary)]">文档接入与索引发布</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 告警阈值（可折叠） */}
      <div className="space-y-4">
        <button
          className="w-full flex items-center justify-between shell-card rounded-[24px] p-5 text-left hover:opacity-80 transition-opacity"
          onClick={() => setAlertRulesOpen(prev => !prev)}
        >
          <div className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--color-text)]">告警阈值</div>
          <div className={`transform transition-transform text-[var(--color-text-light)] ${alertRulesOpen ? 'rotate-180' : ''}`}>▼</div>
        </button>

        {alertRulesOpen && (
          <div className="shell-card rounded-[24px] p-5 space-y-4">
            <div className="text-xs text-[var(--color-text-secondary)]">调整后点击保存生效，当前仅作用于本地会话。</div>
            <div className="space-y-4 max-w-[520px]">
              <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.72)] p-4">
                <div className="flex items-baseline justify-between mb-3">
                  <div className="text-[13px] font-medium text-[var(--color-text)]">错误率阈值</div>
                  <span className="text-[11px] text-[var(--color-text-light)]">当前：{llmErrorRate}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" className={inputCls} value={thresholds.errorRate} onChange={e => { setThresholds({ ...thresholds, errorRate: Number(e.target.value) }); setDirty(true); }} />
                  <span className="text-xs text-[var(--color-text-secondary)]">%</span>
                </div>
              </div>
              <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.72)] p-4">
                <div className="flex items-baseline justify-between mb-3">
                  <div className="text-[13px] font-medium text-[var(--color-text)]">平均延迟阈值</div>
                  <span className="text-[11px] text-[var(--color-text-light)]">当前：{llmAvgLatency} ms</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" className={inputCls} value={thresholds.latencyMs} onChange={e => { setThresholds({ ...thresholds, latencyMs: Number(e.target.value) }); setDirty(true); }} />
                  <span className="text-xs text-[var(--color-text-secondary)]">ms</span>
                </div>
              </div>
              <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.72)] p-4">
                <div className="flex items-baseline justify-between mb-3">
                  <div className="text-[13px] font-medium text-[var(--color-text)]">限流使用率阈值</div>
                  <span className="text-[11px] text-[var(--color-text-light)]">当前：{llmRateLimitUsage}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" className={inputCls} value={thresholds.rateLimit} onChange={e => { setThresholds({ ...thresholds, rateLimit: Number(e.target.value) }); setDirty(true); }} />
                  <span className="text-xs text-[var(--color-text-secondary)]">%</span>
                </div>
              </div>
              <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.72)] p-4">
                <div className="flex items-baseline justify-between mb-3">
                  <div className="text-[13px] font-medium text-[var(--color-text)]">引用覆盖率阈值</div>
                  <span className="text-[11px] text-[var(--color-text-light)]">当前：—</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" className={inputCls} value={thresholds.citationCoverage} onChange={e => { setThresholds({ ...thresholds, citationCoverage: Number(e.target.value) }); setDirty(true); }} />
                  <span className="text-xs text-[var(--color-text-secondary)]">%</span>
                </div>
              </div>
              <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.72)] p-4">
                <div className="flex items-baseline justify-between mb-3">
                  <div className="text-[13px] font-medium text-[var(--color-text)]">检索空结果阈值</div>
                  <span className="text-[11px] text-[var(--color-text-light)]">当前：—</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" className={inputCls} value={thresholds.emptyRetrieval} onChange={e => { setThresholds({ ...thresholds, emptyRetrieval: Number(e.target.value) }); setDirty(true); }} />
                  <span className="text-xs text-[var(--color-text-secondary)]">次/小时</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setThresholds({ ...DEFAULT_THRESHOLDS }); setDirty(false); }}>重置</Button>
              <Button size="sm" disabled={!dirty} onClick={() => { setDirty(false); persistThresholds(thresholds); }}>保存设置</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
