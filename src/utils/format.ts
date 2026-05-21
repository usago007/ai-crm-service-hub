import type { TicketStatus, Priority } from '../types';

export function fmtDate(d: string | undefined | null): string {
  if (!d) return '';
  const dt = new Date(d);
  const now = new Date();
  const diff = now.getTime() - dt.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (m < 1) return 'Just now';
  if (m < 60) return m + 'm ago';
  if (h < 24) return h + 'h ago';
  if (day < 7) return day + 'd ago';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function fmtTime(d: string | undefined | null): string {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_CLASSES: Record<string, string> = {
  'New': 'badge-blue',
  'In Progress': 'badge-purple',
  'Pending Review': 'badge-orange',
  'Waiting Customer': 'badge-yellow',
  'Closed': 'badge-green',
  'Escalated': 'badge-red',
  'Active': 'badge-green',
  'Inactive': 'badge-gray',
  'Published': 'badge-green',
  'Draft': 'badge-gray',
};

export function statCls(s: string): string {
  return STATUS_CLASSES[s] || 'badge-gray';
}

const PRIORITY_CLASSES: Record<string, string> = {
  'High': 'badge-orange',
  'Urgent': 'badge-red',
  'Normal': 'badge-blue',
  'Low': 'badge-gray',
};

export function prioCls(p: Priority | string): string {
  return PRIORITY_CLASSES[p] || 'badge-gray';
}

export function chIcon(ch: string): string {
  const map: Record<string, string> = { 'Email': '📧', 'Live Chat': '💬', 'Ticket': '🎫' };
  return map[ch] || '📨';
}

export function slaSt(sla: string | undefined | null): 'critical' | 'warning' | 'normal' {
  if (!sla) return 'normal';
  const diff = new Date(sla).getTime() - Date.now();
  const hrs = diff / 3600000;
  if (hrs < 4) return 'critical';
  if (hrs < 12) return 'warning';
  return 'normal';
}

export function slaLbl(sla: string | undefined | null): string {
  if (!sla) return '—';
  const diff = new Date(sla).getTime() - Date.now();
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hrs < 0) return 'Overdue';
  if (hrs < 1) return mins + 'min';
  if (hrs < 24) return hrs + 'h ' + mins + 'm';
  const d = Math.floor(hrs / 24);
  return d + 'd ' + (hrs % 24) + 'h';
}

export function cName(customers: { id: string; name: string }[], id: string | undefined | null): string {
  if (!id) return 'Unknown';
  const c = customers.find(c => c.id === id);
  return c ? c.name : 'Unknown';
}
