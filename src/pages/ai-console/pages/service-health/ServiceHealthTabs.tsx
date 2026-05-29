import { Badge } from '../../../../components/common/Badge';
import { Button } from '../../../../components/common/Button';

export type HealthTab = 'overview' | 'services' | 'queue' | 'diagnostics';

const TABS: Array<{ key: HealthTab; label: string; showBadge: boolean }> = [
  { key: 'overview', label: '运行总览', showBadge: false },
  { key: 'services', label: '服务状态', showBadge: true },
  { key: 'queue', label: '文档队列', showBadge: true },
  { key: 'diagnostics', label: '诊断记录', showBadge: false },
];

interface ServiceHealthTabsProps {
  activeTab: HealthTab;
  onTabChange: (tab: HealthTab) => void;
  anomalyCounts: Partial<Record<HealthTab, number>>;
}

export function ServiceHealthTabs({ activeTab, onTabChange, anomalyCounts }: ServiceHealthTabsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {TABS.map(tab => {
        const count = anomalyCounts[tab.key];
        return (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
            {tab.showBadge && count !== undefined && count > 0 && (
              <Badge variant="red" className="rounded-[10px] px-1.5 py-0.5 text-[10px]">
                {count}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}
