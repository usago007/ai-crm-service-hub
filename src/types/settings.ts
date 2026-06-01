export interface AnalyticsMetric {
  label: string;
  value: string;
  trend: string;
  direction: 'up' | 'down';
  subtitle: string;
  color: string;
}

export interface AnalyticsData {
  metrics: AnalyticsMetric[];
  ticketVolume: { labels: string[]; values: number[] };
  channelDist: { label: string; value: number; color: string }[];
  issueDist: { label: string; value: number; color: string }[];
  aiAdoptionTrend: { label: string; value: number }[];
  topFAQ: { label: string; count: number }[];
  manualReviewBreakdown: { label: string; pct: number }[];
}

export interface ActivityLogItem {
  id: string;
  action: string;
  user: string;
  time: string;
  detail: string;
}

export interface Agent {
  name: string;
  role: string;
}

export interface TeamRolePermissionProfile {
  role: string;
  scopeSummary: string;
  aiSuggest: string;
  humanSend: string;
  manualReviewOverride: string;
  knowledgeAccess: string;
  settingsAccess: string;
  auditAccess: string;
}

export interface MemberPermissionAssignment {
  memberName: string;
  role: string;
  inheritsFromRole: boolean;
  overrideSummary: string;
  effectivePermissions: string;
}

export interface SettingsPermissionSnapshot {
  roleProfiles: TeamRolePermissionProfile[];
  memberAssignments: MemberPermissionAssignment[];
}

export interface GlobalOperationLogEntry {
  id: string;
  timestampLabel: string;
  sourceType: 'system_activity' | 'ai_audit';
  actor: string;
  action: string;
  scope: string;
  result: string;
  detail: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
}

export interface OperationLogFilters {
  sourceType?: GlobalOperationLogEntry['sourceType'];
  scope?: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
  actor?: string;
}

export interface SettingsOperationLogSnapshot {
  entries: GlobalOperationLogEntry[];
}

export interface SettingsData {
  general: { language: string; timezone: string; notifications: string };
  team: Agent[];
  permissions: SettingsPermissionSnapshot;
  operationLogs: SettingsOperationLogSnapshot;
  channels: Record<string, boolean>;
  notifications: Record<string, boolean>;
}

export interface AdminSnapshot {
  settings: SettingsData;
  agents: Agent[];
}

export interface InsightsSnapshot {
  analytics: AnalyticsData;
  activityLog: ActivityLogItem[];
}
