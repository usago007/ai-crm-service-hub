import { Button } from '../../../../components/common/Button';
import { Badge } from '../../../../components/common/Badge';
import { healthBadgeVariant, healthStatusLabel } from './helpers';
import type { ServiceHealthStatus } from '../../../../types';

interface GlobalStatusHeroProps {
  overallStatus: ServiceHealthStatus;
  lastCheckedAt: string;
  onRunDiagnostic: () => void;
}

function heroTitle(status: ServiceHealthStatus) {
  if (status === 'healthy') return '所有能力运行正常';
  if (status === 'degraded') return '部分能力暂时受限';
  return '关键能力暂不可用';
}

function heroDescription(status: ServiceHealthStatus) {
  if (status === 'healthy') return '模型服务、知识库和文档接入队列运行正常。';
  if (status === 'degraded') return '文档入库和知识更新存在异常，AI 回复能力仍可使用。';
  return '文档入库或 AI 回复链路存在异常，请先查看诊断结果。';
}

export function GlobalStatusHero({
  overallStatus,
  lastCheckedAt,
  onRunDiagnostic,
}: GlobalStatusHeroProps) {
  return (
    <section className="rounded-[20px] border border-[rgba(15,23,42,0.06)] bg-[rgba(255,255,255,0.82)] shadow-[0_8px_24px_rgba(15,23,42,0.04)] px-6 py-[18px] min-h-[96px]">
      <div className="flex items-center gap-8 max-[1100px]:flex-col max-[1100px]:items-stretch">
        {/* 左侧：状态结论 */}
        <div className="min-w-0 flex-1">
          <Badge variant={healthBadgeVariant(overallStatus)} className="rounded-[10px] px-2.5 py-1 text-[12px]">
            {healthStatusLabel(overallStatus)}
          </Badge>
          <div className="mt-2 text-[24px] font-extrabold tracking-[-0.04em] text-[var(--color-text)] leading-tight">
            {heroTitle(overallStatus)}
          </div>
          <div className="mt-1.5 text-[14px] leading-6 text-[var(--color-text-secondary)]">
            {heroDescription(overallStatus)}
          </div>
        </div>

        {/* 右侧：检查时间 + 运行诊断 */}
        <div className="w-[200px] flex-shrink-0 flex flex-col items-end justify-center gap-2">
          <span className="text-[12px] text-[var(--color-text-light)]">最近检查</span>
          <span className="text-[13px] text-[var(--color-text)]">{lastCheckedAt}</span>
          <Button size="sm" variant="primary" onClick={() => { void onRunDiagnostic(); }}>
            运行诊断
          </Button>
        </div>
      </div>
    </section>
  );
}
