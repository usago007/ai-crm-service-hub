import type { AICapability, PermissionBoundary } from '../types';
import { DataTable } from '../components/common/DataTable';
import { Toggle } from '../components/common/Toggle';
import { Badge } from '../components/common/Badge';
import { PanelCard, StatCard, SummaryHeader } from '../components/common/PageChrome';

interface AIAssistantProps {
  aiCapabilities: AICapability[];
  permissionBoundaries: PermissionBoundary[];
  guardrails: string[];
  onToggleCapability: (id: string) => void;
}

export function AIAssistant({ aiCapabilities, permissionBoundaries, guardrails, onToggleCapability }: AIAssistantProps) {
  const enabledCount = aiCapabilities.filter(item => item.enabled).length;
  const manualReviewCount = permissionBoundaries.filter(item => item.manualReview !== 'No').length;
  const blockedSendCount = permissionBoundaries.filter(item => item.aiSend !== 'No').length;

  return (
    <div className="space-y-4">
      <SummaryHeader
        aside={
          <div className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-1">
            <StatCard label="启用能力" value={String(enabledCount)} detail="当前允许 AI 参与的能力节点数量。" />
            <StatCard label="强制复核场景" value={String(manualReviewCount)} detail="命中这些场景时，AI 只能辅助，不能独立闭环。" tone="warning" />
            <StatCard label="禁止 AI 发送" value={String(blockedSendCount)} detail="涉及敏感动作或承诺时，发送权始终保留给人工。" tone="danger" />
          </div>
        }
      />

      <div className="grid grid-cols-[0.88fr_1.12fr] gap-5 max-[1200px]:grid-cols-1">
        <PanelCard title="AI 能力开关" description="这里只决定 AI 是否能参与某个环节，不授予执行权。">
          <div className="rounded-[20px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.52)] p-4">
            {aiCapabilities.map(capability => (
              <Toggle key={capability.id} label={capability.name} description={capability.desc} on={capability.enabled} onClick={() => onToggleCapability(capability.id)} />
            ))}
          </div>
        </PanelCard>

        <PanelCard title="权限边界" description="统一查看 AI 建议权、发送权和人工复核要求，避免每个页面单独解释。">
          <DataTable
            columns={[
              { key: 'scenario', label: '场景', width: '32%' },
              { key: 'suggest', label: 'AI 建议' },
              { key: 'send', label: 'AI 发送' },
              { key: 'review', label: '人工复核' },
            ]}
            emptyMessage="当前没有权限边界规则。"
            className="rounded-[20px]"
          >
                {permissionBoundaries.map(boundary => (
                  <tr key={boundary.scenario}>
                    <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{boundary.scenario}</td>
                    <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant="green">{boundary.aiSuggest}</Badge></td>
                    <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant="red">{boundary.aiSend}</Badge></td>
                    <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={boundary.manualReview === 'No' ? 'green' : 'yellow'}>{boundary.manualReview}</Badge></td>
                  </tr>
                ))}
          </DataTable>
        </PanelCard>

        <PanelCard title="护栏规则" description="这些规则用来约束草稿、引用、赔付承诺和越权执行。" className="col-span-2 max-[1200px]:col-span-1">
          <div className="grid grid-cols-2 gap-3 max-[1200px]:grid-cols-1">
            {guardrails.map(item => (
              <div key={item} className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.68)] px-4 py-3 text-xs leading-6 shadow-[inset_3px_0_0_var(--color-primary)]">
                {item}
              </div>
            ))}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
