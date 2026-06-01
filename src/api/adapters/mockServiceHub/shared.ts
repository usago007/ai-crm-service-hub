import type { GlobalOperationLogEntry, ListQuery, PagedResult, ServiceHubSnapshot } from '../../../types';
import { deriveServiceHealthSnapshot } from '../../../mocks/fixtures/serviceHub';

export function cloneSnapshot(snapshot: ServiceHubSnapshot): ServiceHubSnapshot {
  return structuredClone(snapshot);
}

export function nowIso() {
  return new Date().toISOString();
}

export function nowUiStamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function prependAudit(snapshot: ServiceHubSnapshot, eventType: string, detail: string, riskLevel: 'Low' | 'Medium' | 'High' = 'Low') {
  snapshot.auditLogs = [{
    id: `AUD-${String(snapshot.auditLogs.length + 1).padStart(3, '0')}`,
    ticketId: 'SYSTEM',
    eventType,
    actor: '系统',
    outcome: '配置变更已生效。',
    riskLevel,
    timestamp: nowUiStamp(),
    detail,
  }, ...snapshot.auditLogs];
}

export function withServiceHealth(snapshot: ServiceHubSnapshot) {
  snapshot.serviceHealth = deriveServiceHealthSnapshot(snapshot);
  return snapshot;
}

export function paginate<T>(items: T[], query: Pick<ListQuery<object>, 'page' | 'pageSize'>): PagedResult<T> {
  const pageSize = query.pageSize;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export function applySearch<T>(items: T[], search: string | undefined, extractor: (item: T) => string): T[] {
  if (!search?.trim()) return items;
  const keyword = search.trim().toLowerCase();
  return items.filter(item => extractor(item).toLowerCase().includes(keyword));
}

export function sortByKey<T>(items: T[], key: string, order: 'asc' | 'desc') {
  return [...items].sort((left, right) => {
    const leftValue = String((left as Record<string, unknown>)[key] ?? '');
    const rightValue = String((right as Record<string, unknown>)[key] ?? '');
    return order === 'asc' ? leftValue.localeCompare(rightValue) : rightValue.localeCompare(leftValue);
  });
}

function parseOperationLogTimestamp(value: string) {
  const relativeMatch = value.match(/^(\d+)\s*分钟前$/);
  if (relativeMatch) {
    const minutes = Number(relativeMatch[1]);
    return Date.now() - minutes * 60_000;
  }
  const hourMatch = value.match(/^(\d+)\s*小时前$/);
  if (hourMatch) {
    const hours = Number(hourMatch[1]);
    return Date.now() - hours * 3_600_000;
  }
  const direct = Date.parse(value.replace(' ', 'T'));
  return Number.isNaN(direct) ? 0 : direct;
}

export function sortOperationLogs(items: GlobalOperationLogEntry[], query: Pick<ListQuery<object>, 'sortBy' | 'sortOrder'>) {
  if (query.sortBy !== 'timestampLabel') {
    return sortByKey(items, query.sortBy, query.sortOrder);
  }
  return [...items].sort((left, right) => {
    const leftValue = parseOperationLogTimestamp(left.timestampLabel);
    const rightValue = parseOperationLogTimestamp(right.timestampLabel);
    return query.sortOrder === 'asc' ? leftValue - rightValue : rightValue - leftValue;
  });
}
