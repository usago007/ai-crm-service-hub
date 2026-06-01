export { inputCls } from '../../components/common/forms';

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
