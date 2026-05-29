import { GlobalStatusHero } from './GlobalStatusHero';
import { CriticalAnomalies } from './CriticalAnomalies';
import { KeyNumber } from './helpers';
import type { ServiceHealthStatus, ServiceHealthSeverity } from '../../../../types';

interface AnomalyItem {
  id: string;
  issue: string;
  severity: ServiceHealthSeverity;
  cause: string;
  suggestedAction: string;
  impact: string;
}

interface OverviewTabProps {
  overallStatus: ServiceHealthStatus;
  lastCheckedAt: string;
  failedJobs: number;
  failedConnectorCount: number;
  criticalDiagCount: number;
  affectedScenarioCount: number;
  topAnomalies: AnomalyItem[];
  onRunDiagnostic: () => void;
}

export function OverviewTab({
  overallStatus,
  lastCheckedAt,
  failedJobs,
  failedConnectorCount,
  criticalDiagCount,
  affectedScenarioCount,
  topAnomalies,
  onRunDiagnostic,
}: OverviewTabProps) {
  return (
    <div className="space-y-5">
      <GlobalStatusHero
        overallStatus={overallStatus}
        lastCheckedAt={lastCheckedAt}
        onRunDiagnostic={onRunDiagnostic}
      />
      <div className="grid grid-cols-4 gap-4 max-[1400px]:grid-cols-2 max-[720px]:grid-cols-1">
        <KeyNumber label="失败队列任务" value={String(failedJobs)} tone={failedJobs > 0 ? 'warning' : 'success'} />
        <KeyNumber label="连接器告警" value={String(failedConnectorCount)} tone={failedConnectorCount > 0 ? 'warning' : 'success'} />
        <KeyNumber label="严重项" value={String(criticalDiagCount)} tone={criticalDiagCount > 0 ? 'danger' : 'success'} />
        <KeyNumber label="受影响场景" value={String(affectedScenarioCount)} tone={affectedScenarioCount > 0 ? 'danger' : 'success'} />
      </div>
      <CriticalAnomalies anomalies={topAnomalies} maxItems={3} />
    </div>
  );
}
