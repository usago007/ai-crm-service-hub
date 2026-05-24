export const inputCls =
  'h-11 border border-[var(--color-border-strong)] rounded-[16px] px-3.5 text-[13px] bg-[rgba(255,255,255,0.84)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none focus:border-[rgba(179,92,32,0.34)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(179,92,32,0.10)] w-full transition-all duration-200 text-[var(--color-text)]';

export function displayStageStatus(status: string) {
  const labels: Record<string, string> = {
    pending: '待处理',
    uploaded: '已上传',
    parsing: '解析中',
    parsed: '已解析',
    chunking: '切片中',
    embedded: '已向量化',
    indexed: '已索引',
    failed: '失败',
    published: '已发布',
    disabled: '已禁用',
    expired: '已过期',
    version_conflict: '版本冲突',
  };
  return labels[status] ?? status;
}

export function stageVariant(status: string): 'gray' | 'yellow' | 'blue' | 'green' | 'red' {
  if (status === 'published' || status === 'indexed') return 'green';
  if (status === 'parsed' || status === 'embedded' || status === 'chunking') return 'blue';
  if (status === 'parsing') return 'yellow';
  if (status === 'failed' || status === 'disabled' || status === 'expired' || status === 'version_conflict') return 'red';
  return 'gray';
}
