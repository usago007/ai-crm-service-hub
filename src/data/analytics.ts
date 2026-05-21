import type { AnalyticsData, ActivityLogItem } from '../types';

export const ANALYTICS_DATA: AnalyticsData = {
  metrics: [
    { label: 'Avg First Response Time', value: '2.4h', trend: '-52%', direction: 'down', subtitle: 'from 4.8h before AI', color: '' },
    { label: 'AI Suggestion Adoption', value: '72%', trend: '+12%', direction: 'up', subtitle: 'Last week: 60%', color: 'var(--color-primary)' },
    { label: 'FAQ Match Accuracy', value: '86%', trend: '+8%', direction: 'up', subtitle: 'AI model v2.1 deployed', color: '' },
    { label: 'Manual Review Rate', value: '15%', trend: '-5%', direction: 'down', subtitle: 'Target: <20%', color: '' },
    { label: 'CSAT Score', value: '4.2/5.0', trend: '+0.3', direction: 'up', subtitle: 'Last month: 3.9', color: '' },
    { label: 'Repeated Contact Rate', value: '8.3%', trend: '-6%', direction: 'down', subtitle: 'Down from 14.3%', color: '' },
    { label: 'SLA Resolution Rate', value: '92%', trend: '+7%', direction: 'up', subtitle: 'Target: 95%', color: '' },
    { label: 'Escalation Rate', value: '5.2%', trend: '-3%', direction: 'down', subtitle: 'Industry avg: 12%', color: '' },
  ],
  ticketVolume: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [42, 38, 51, 45, 56, 32, 28] },
  channelDist: [
    { label: 'Live Chat', value: 45, color: '#6C5CE7' },
    { label: 'Email', value: 30, color: '#3B82F6' },
    { label: 'Ticket', value: 25, color: '#10B981' },
  ],
  issueDist: [
    { label: 'Shipping', value: 28, color: '#6C5CE7' },
    { label: 'Refund', value: 22, color: '#F59E0B' },
    { label: 'Product Inquiry', value: 18, color: '#3B82F6' },
    { label: 'Payment', value: 15, color: '#EF4444' },
    { label: 'Other', value: 17, color: '#10B981' },
  ],
  aiAdoptionTrend: [
    { label: 'W1', value: 45 },
    { label: 'W2', value: 52 },
    { label: 'W3', value: 61 },
    { label: 'W4', value: 68 },
    { label: 'W5', value: 72 },
  ],
  topFAQ: [
    { label: 'Shipping Duration', count: 342 },
    { label: 'Contact Support', count: 312 },
    { label: 'Return Policy', count: 287 },
    { label: 'Intl Shipping', count: 267 },
    { label: 'Payment Methods', count: 234 },
  ],
  manualReviewBreakdown: [
    { label: 'Refund Requests', pct: 42 },
    { label: 'Compensation', pct: 23 },
    { label: 'Complaint', pct: 18 },
    { label: 'Chargeback', pct: 10 },
    { label: 'Payment Retry', pct: 7 },
  ],
};

export const ACTIVITY_LOG: ActivityLogItem[] = [
  { id: 'ACT-001', action: 'Ticket created', user: 'John Smith', time: '2 min ago', detail: 'Shipping Delay - TKT-001' },
  { id: 'ACT-002', action: 'AI suggestion adopted', user: 'You', time: '5 min ago', detail: 'Reply inserted for TKT-009' },
  { id: 'ACT-003', action: 'Task completed', user: 'You', time: '12 min ago', detail: 'Follow-up logistics - TSK-001' },
  { id: 'ACT-004', action: 'Ticket escalated', user: 'You', time: '18 min ago', detail: 'Complaint escalated to supervisor' },
  { id: 'ACT-005', action: 'AI generated summary', user: 'System', time: '25 min ago', detail: 'TKT-006 context summary ready' },
  { id: 'ACT-006', action: 'New customer registered', user: 'System', time: '30 min ago', detail: `Olivia Martinez - Spain` },
  { id: 'ACT-007', action: 'Refund processed', user: 'Finance Team', time: '1 hour ago', detail: 'Order #100221 refund initiated' },
  { id: 'ACT-008', action: 'SLA warning triggered', user: 'System', time: '1.2 hours ago', detail: 'TKT-006 approaching SLA deadline' },
  { id: 'ACT-009', action: 'Knowledge base updated', user: 'Admin', time: '2 hours ago', detail: 'FAQ #003 - Updated tracking info' },
  { id: 'ACT-010', action: 'AI model retrained', user: 'System', time: '3 hours ago', detail: 'New FAQ matching model v2.1 deployed' },
];
