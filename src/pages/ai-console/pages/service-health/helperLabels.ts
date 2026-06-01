import type { ServiceHealthSeverity, ServiceHealthStatus } from '../../../../types';

export function healthBadgeVariant(status: ServiceHealthStatus) {
  if (status === 'healthy') return 'green';
  if (status === 'degraded') return 'orange';
  return 'red';
}

export function healthStatusLabel(status: ServiceHealthStatus) {
  if (status === 'healthy') return '正常';
  if (status === 'degraded') return '降级';
  return '异常';
}

export function deriveWatchStatus(
  overallStatus: ServiceHealthStatus,
  warningCount: number,
): 'healthy' | 'watch' | 'degraded' | 'down' {
  if (overallStatus === 'down') return 'down';
  if (overallStatus === 'degraded') return 'degraded';
  if (overallStatus === 'healthy' && warningCount > 0) return 'watch';
  return 'healthy';
}

export function watchBadgeVariant(status: 'healthy' | 'watch' | 'degraded' | 'down') {
  if (status === 'healthy') return 'green';
  if (status === 'watch') return 'yellow';
  if (status === 'degraded') return 'orange';
  return 'red';
}

export function watchStatusLabel(status: 'healthy' | 'watch' | 'degraded' | 'down') {
  if (status === 'healthy') return '正常';
  if (status === 'watch') return '观察';
  if (status === 'degraded') return '降级';
  return '异常';
}

export function severityBadgeVariant(severity: ServiceHealthSeverity) {
  if (severity === 'critical') return 'red';
  if (severity === 'warning') return 'yellow';
  return 'blue';
}

export function severityLabel(severity: ServiceHealthSeverity) {
  if (severity === 'critical') return '严重';
  if (severity === 'warning') return '预警';
  return '提示';
}

export function indexStatusLabel(status: 'ready' | 'building' | 'degraded' | 'failed') {
  if (status === 'ready') return '就绪';
  if (status === 'building') return '构建中';
  if (status === 'degraded') return '降级';
  return '失败';
}

export function rebuildStatusLabel(status: 'idle' | 'running' | 'failed') {
  if (status === 'idle') return '空闲';
  if (status === 'running') return '执行中';
  return '失败';
}

export function queueTaskStatusLabel(status: 'pending' | 'running' | 'failed' | 'completed' | 'retrying') {
  if (status === 'pending') return '待处理';
  if (status === 'running') return '运行中';
  if (status === 'failed') return '失败';
  if (status === 'completed') return '已完成';
  return '重试中';
}

export function commonValueLabel(value: string) {
  if (value === 'none') return '无';
  if (value === 'real-time') return '实时';
  if (value === 'Every 15 minutes') return '每 15 分钟';
  return value;
}

export function booleanLabel(value: boolean, yes = '是', no = '否') {
  return value ? yes : no;
}
