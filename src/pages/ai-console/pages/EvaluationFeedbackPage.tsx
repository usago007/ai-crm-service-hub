import { Badge } from '../../../components/common/Badge';
import type { AIConsoleProps } from '../types';
import { DataTable, PageHeader, SectionCard, StatCard } from '../shared';
import { displayFeedbackStatus, displayRuntimeStatus } from '../../../utils/display';

type Props = Pick<AIConsoleProps, 'evaluations' | 'feedbackLoop'>;

export function EvaluationFeedbackPage({ evaluations, feedbackLoop }: Props) {
  const riskCount = evaluations.filter(item => item.status === 'risk').length;
  const shippedCount = feedbackLoop.filter(item => item.status === 'shipped').length;

  return (
    <div className="space-y-4">
      <PageHeader title="评测与反馈" description="跟踪评测结果、反馈闭环与后续优化规则，不再与其他页面混排。" />
      <div className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-1">
        <StatCard label="评测项" value={String(evaluations.length)} detail="按场景与指标持续跟踪当前客服 AI 表现。" />
        <StatCard label="风险项" value={String(riskCount)} detail="低于目标或存在明显偏差，必须进入优化路径。" tone="danger" />
        <StatCard label="已落地反馈" value={String(shippedCount)} detail="已转化为规则、知识或提示词调整的反馈条目。" tone="success" />
      </div>
      <div className="grid grid-cols-[1fr_0.9fr] gap-4 max-[1200px]:grid-cols-1">
        <DataTable
          columns={[
            { key: 'scenario', label: '场景', width: '26%' },
            { key: 'metric', label: '指标' },
            { key: 'score', label: '得分' },
            { key: 'baseline', label: '基线' },
            { key: 'status', label: '状态' },
          ]}
          emptyMessage="还没有评测数据。"
        >
            {evaluations.map(item => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-[13px] border-b border-[var(--color-border-light)]">{item.scenario}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.metric}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] tabular-nums">{item.score}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] tabular-nums">{item.baseline}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={item.status === 'good' ? 'green' : item.status === 'watch' ? 'yellow' : 'red'}>{displayRuntimeStatus(item.status)}</Badge></td>
              </tr>
            ))}
        </DataTable>

        <div className="space-y-4">
          <SectionCard title="反馈闭环">
            <div className="space-y-2">
              {feedbackLoop.map(item => (
                <div key={item.id} className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-3.5 text-xs">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="font-medium">{item.source} · {item.scenario}</div>
                    <Badge variant={item.status === 'shipped' ? 'green' : item.status === 'triaged' ? 'yellow' : 'gray'}>{displayFeedbackStatus(item.status)}</Badge>
                  </div>
                  <div className="text-[var(--color-text-secondary)] leading-5">{item.signal}</div>
                  <div className="mt-2"><strong>动作：</strong> {item.action}</div>
                  <div className="mt-1 text-[11px] text-[var(--color-text-light)]">{item.owner} · {item.updatedAt}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="优化规则">
            <div className="space-y-2 text-xs">
              <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-3.5">评测风险项优先进入提示词、知识台账和审核规则三条优化路径。</div>
              <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-3.5">客服编辑行为会反哺回复模板、场景路由和知识缺口补齐。</div>
              <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-3.5">审计日志用于证明 AI 辅助没有越权执行，也用于定位误检索和护栏命中。</div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
