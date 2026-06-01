import type {
  AICapability,
  Agent,
  AIOpsStage,
  ActivityLogItem,
  AnalyticsData,
  AuditLogRecord,
  BusinessRule,
  EvaluationRecord,
  FAQ,
  FeedbackLoopRecord,
  PermissionBoundary,
  PolicyDoc,
  ReplyTemplate,
  SettingsData,
  SettingsOperationLogSnapshot,
  SettingsPermissionSnapshot,
  TeamRolePermissionProfile,
} from '../../types';

function pad(prefix: string, value: number) {
  return `${prefix}-${String(value).padStart(3, '0')}`;
}

export const faqs: FAQ[] = Array.from({ length: 24 }, (_, index) => ({
  id: pad('FAQ', index + 1),
  question: `常见问题 ${index + 1}`,
  category: ['物流', '退款', '支付', '商品咨询'][index % 4],
  answerSummary: `可复用答案摘要 ${index + 1}`,
  language: ['EN', 'ZH', 'DE', 'FR', 'ES', 'JA'][index % 6],
  status: index % 6 === 0 ? 'Draft' : 'Published',
  usageCount: 80 + index * 17,
  matchAccuracy: 79 + (index % 5) * 4,
}));

export const replyTemplates: ReplyTemplate[] = Array.from({ length: 24 }, (_, index) => ({
  id: pad('TPL', index + 1),
  name: `回复模板 ${index + 1}`,
  scenario: ['物流', '退款', '投诉', '支付', 'VIP'][index % 5],
  language: ['EN', 'ZH', 'DE', 'FR', 'ES'][index % 5],
  tone: ['共情', '专业', '清晰'][index % 3],
  status: index % 7 === 0 ? 'Draft' : 'Active',
  usageCount: 20 + index * 8,
  content: `模板内容 ${index + 1}`,
}));

export const businessRules: BusinessRule[] = Array.from({ length: 20 }, (_, index) => ({
  id: pad('RUL', index + 1),
  name: ['签收后退款', '赔偿诉求', '地址截单', 'VIP 加急权益', '支付恢复梯度'][index % 5],
  scenario: ['退款', '投诉', '地址修改', 'VIP', '支付'][index % 5],
  trigger: ['订单已签收', '提到赔偿', '订单未发货', 'VIP 诉求', '支付失败'][index % 5],
  aiPermission: ['仅建议', '仅建议', '建议并核验', '建议并附 SLA 参考', '建议替代支付方法'][index % 5],
  manualReviewRequired: index % 4 === 0 ? 'Yes' : 'No',
  status: index % 6 === 0 ? 'Draft' : 'Active',
}));

export const policyDocs: PolicyDoc[] = Array.from({ length: 20 }, (_, index) => ({
  name: `${['物流延迟', '退款', '赔偿', 'VIP', '本地化'][index % 5]}政策 ${index + 1}`,
  description: ['物流商调查流程与承诺边界。', '证据要求与审核路径。', '升级路径与审批规则。', '优先支持权益与 SLA。', '本地化政策发布状态与回退规则。'][index % 5],
  version: `v${1 + (index % 3)}.${index % 10}`,
  updated: `2026-05-${String(1 + (index % 20)).padStart(2, '0')}`,
}));

export const aiCapabilities: AICapability[] = [
  { id: 'issue-classification', name: '问题分类', enabled: true, desc: '对流程阶段、风险级别和路由进行分类。' },
  { id: 'crm-policy-link', name: '客户策略联动', enabled: true, desc: '将客户分群、区域和风险注入检索过滤条件。' },
  { id: 'retrieval-debugger', name: '检索调试器', enabled: true, desc: '可重放检索并检查候选结果的丢弃原因。' },
  { id: 'review-gating', name: '复核闸门', enabled: true, desc: '对退款、投诉和高风险执行路径强制人工复核。' },
  { id: 'knowledge-gap-detection', name: '知识缺口检测', enabled: true, desc: '识别过期、冲突或缺失的本地化知识。' },
];

export const permissionBoundaries: PermissionBoundary[] = [
  { scenario: '商品咨询', aiSuggest: 'Yes', aiSend: 'No', manualReview: 'No' },
  { scenario: '物流延迟', aiSuggest: 'Yes', aiSend: 'No', manualReview: 'Conditional' },
  { scenario: '退款 / 退货', aiSuggest: 'Yes', aiSend: 'No', manualReview: 'Yes' },
  { scenario: '投诉 / 赔偿', aiSuggest: 'Yes', aiSend: 'No', manualReview: 'Yes' },
];

export const guardrails = [
  '所有草稿在发送前都必须展示引用和禁止声明。',
  '过期或冲突知识不能作为主证据使用。',
  '客户语言与区域信号必须参与检索和升级路由。',
  '高风险执行动作必须保留人工控制。',
  'AI 不能发送客户消息、批准退款、承诺赔偿、关闭投诉或编造物流事实。',
];

export const aiOpsStages: AIOpsStage[] = [
  {
    id: 'OPS-001',
    stage: '上传与解析',
    owner: '知识运营',
    status: 'healthy',
    throughput: '28 份文档 / 天',
    detail: 'PDF、DOCX、HTML 和 XLSX 文档会统一标准化，并校验来源元数据、语言区域和生效日期。',
    controlPoint: '在切片前拦截元数据异常文档。',
  },
  {
    id: 'OPS-002',
    stage: '切片与向量化',
    owner: '模型平台',
    status: 'watch',
    throughput: '成功率 94%',
    detail: '投诉和本地化文档的切片失败率最高，因为区域附录的标题结构经常不一致。',
    controlPoint: '在索引发布前标记低覆盖文档。',
  },
  {
    id: 'OPS-003',
    stage: '索引与检索',
    owner: '搜索基础设施',
    status: 'healthy',
    throughput: 'P95 420 毫秒',
    detail: '区域、语言、场景、版本和发布状态会作为一级检索过滤条件使用。',
    controlPoint: '把过期和冲突版本从主证据中剔除。',
  },
  {
    id: 'OPS-004',
    stage: '提示词组装与护栏',
    owner: 'AI 辅助运行时',
    status: 'healthy',
    throughput: '通过率 99.2%',
    detail: '客户 360、订单上下文、策略约束和禁止声明会组装成可审计的草稿包。',
    controlPoint: '若缺少引用或触发禁止声明则中断生成。',
  },
  {
    id: 'OPS-005',
    stage: '人工复核与反馈',
    owner: '客服负责人',
    status: 'risk',
    throughput: '人工复核率 41%',
    detail: '退款、投诉和赔偿相关工单仍然构成演示队列中最大的复核积压。',
    controlPoint: '任何运营动作执行前都必须获得主管确认。',
  },
];

export const agents: Agent[] = [
  { name: '你', role: '高级客服' },
  { name: '陈艾琳', role: '客服专员' },
  { name: '吴柏霖', role: '客服专员' },
  { name: '戴珂岚', role: '团队负责人' },
  { name: '知识运营', role: '知识运营' },
];

function buildRolePermissionProfiles(): TeamRolePermissionProfile[] {
  return [
    {
      role: '客服专员',
      scopeSummary: '处理标准客服会话，可使用 AI 建议并由人工发送。',
      aiSuggest: '允许',
      humanSend: '允许',
      manualReviewOverride: '不可绕过，命中高风险场景必须复核',
      knowledgeAccess: '查看已发布知识与引用来源',
      settingsAccess: '仅查看系统设置',
      auditAccess: '查看本人相关审计留痕',
    },
    {
      role: '高级客服',
      scopeSummary: '负责复杂会话和升级前分诊，拥有更高的审计与排障可见性。',
      aiSuggest: '允许',
      humanSend: '允许',
      manualReviewOverride: '可发起复核，但不可跳过高风险复核',
      knowledgeAccess: '查看知识命中、引用和 RAG 异常',
      settingsAccess: '查看运行配置与权限边界',
      auditAccess: '查看团队级审计与异常记录',
    },
    {
      role: '团队负责人',
      scopeSummary: '负责复核、升级处理和权限边界监督。',
      aiSuggest: '允许',
      humanSend: '允许',
      manualReviewOverride: '可执行人工复核与升级判定',
      knowledgeAccess: '查看全部知识状态与发布风险',
      settingsAccess: '查看权限管理、通知和渠道策略',
      auditAccess: '查看全部审计、反馈与阻止事件',
    },
    {
      role: '知识运营',
      scopeSummary: '维护知识资产、文档接入和规则覆盖，不直接承担客服发送动作。',
      aiSuggest: '按知识链路提供支持',
      humanSend: '不承担客服发送权限',
      manualReviewOverride: '不可处理客服复核结论',
      knowledgeAccess: '维护知识库、文档接入和规则来源',
      settingsAccess: '查看知识与 AI 相关设置',
      auditAccess: '查看知识事件与接入异常',
    },
  ];
}

function buildMemberPermissionAssignments(agentsList: Agent[], roleProfiles: TeamRolePermissionProfile[]) {
  return agentsList.map(agent => {
    const profile = roleProfiles.find(item => item.role === agent.role);
    return {
      memberName: agent.name,
      role: agent.role,
      inheritsFromRole: true,
      overrideSummary: '无单独覆盖',
      effectivePermissions: profile
        ? `${profile.aiSuggest} AI 建议 / ${profile.humanSend}人工发送 / ${profile.auditAccess}`
        : '沿用默认角色权限',
    };
  });
}

export const settingsPermissions: SettingsPermissionSnapshot = {
  roleProfiles: buildRolePermissionProfiles(),
  memberAssignments: buildMemberPermissionAssignments(agents, buildRolePermissionProfiles()),
};

export const settings: SettingsData = {
  general: { language: '简体中文', timezone: 'UTC+8（中国）', notifications: '邮件 + 应用内' },
  team: agents,
  permissions: settingsPermissions,
  operationLogs: { entries: [] },
  channels: { liveChat: true, email: true, ticket: true, whatsapp: true, messenger: false },
  notifications: { newTicket: true, slaWarning: true, aiAlert: true, taskReminder: true, reviewRequired: true },
};

export const analytics: AnalyticsData = {
  metrics: [
    { label: '处理中工单', value: '96', trend: '+11%', direction: 'up', subtitle: '本周客服工作负载', color: '' },
    { label: '引用覆盖率', value: '86%', trend: '+4%', direction: 'up', subtitle: '覆盖全部检索运行', color: 'var(--color-success)' },
    { label: '人工复核压力', value: '41%', trend: '+7%', direction: 'up', subtitle: '高复核压力队列', color: 'var(--color-warning)' },
    { label: '知识事件', value: '8', trend: '+2', direction: 'up', subtitle: '过期或冲突资产', color: 'var(--color-danger)' },
  ],
  ticketVolume: { labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], values: [68, 74, 71, 89, 84, 63, 58] },
  channelDist: [
    { label: '邮件', value: 34, color: '#6C5CE7' },
    { label: '在线聊天', value: 43, color: '#3B82F6' },
    { label: '工单', value: 23, color: '#10B981' },
  ],
  issueDist: [
    { label: '物流', value: 28, color: '#6C5CE7' },
    { label: '退款', value: 18, color: '#F59E0B' },
    { label: '投诉', value: 12, color: '#EF4444' },
    { label: '支付', value: 11, color: '#3B82F6' },
    { label: '地址/VIP/售前', value: 31, color: '#10B981' },
  ],
  aiAdoptionTrend: [
    { label: '周一', value: 64 },
    { label: '周二', value: 67 },
    { label: '周三', value: 69 },
    { label: '周四', value: 72 },
    { label: '周五', value: 74 },
  ],
  topFAQ: [
    { label: '物流更新', count: 342 },
    { label: '退款证据', count: 287 },
    { label: '支付重试', count: 231 },
    { label: '地址截单', count: 184 },
  ],
  manualReviewBreakdown: [
    { label: '签收后退款', pct: 31 },
    { label: '投诉赔偿', pct: 27 },
    { label: '退货审批', pct: 18 },
    { label: '支付恢复', pct: 12 },
    { label: '本地化缺口', pct: 12 },
  ],
};

export const activityLog: ActivityLogItem[] = [
  { id: 'LOG-001', action: 'RAG 发布已提升', user: '知识运营', time: '18 分钟前', detail: '已将欧区投诉处理的稳定检索配置提升为正式版本。' },
  { id: 'LOG-002', action: '知识冲突已标记', user: '系统', time: '27 分钟前', detail: '投诉处理指引 v1.6 草稿与已审批的 v1.5 元数据冲突。' },
  { id: 'LOG-003', action: '工单执行已阻止', user: '戴珂岚', time: '39 分钟前', detail: '在本地化政策发布前，赔偿相关动作保持阻止状态。' },
  { id: 'LOG-004', action: '系统设置已更新', user: '超级管理员', time: '52 分钟前', detail: '更新了通知偏好并同步团队默认提醒策略。' },
  { id: 'LOG-005', action: '知识版本已归档', user: '知识运营', time: '1 小时前', detail: '将旧版退款 SOP 归档，避免继续参与检索。' },
  { id: 'LOG-006', action: 'RAG 阈值已调整', user: '系统', time: '1 小时前', detail: '将欧区投诉场景的相似度阈值从 0.86 下调到 0.82。' },
];

export const evaluations: EvaluationRecord[] = Array.from({ length: 32 }, (_, index) => ({
  id: pad('EVAL', index + 1),
  target: ['AI 回复', '知识库召回', '工单处理', '客服会话'][index % 4],
  refId: `TKT-${String(100 + index).padStart(3, '0')}`,
  scenario: ['物流延迟', '退款申请', '投诉', '地址修改', 'VIP 支持', '支付失败', '商品咨询', '退货申请'][index % 8],
  metric: ['回复准确性', '召回命中率', '口径一致性', '人工改写率', '引用覆盖率'][index % 5],
  score: `${68 + (index % 8) * 4}%`,
  issue: index % 9 === 0 ? '引用覆盖不足，AI 回复缺少政策依据链接。' : index % 4 === 0 ? '部分回复口径与最新政策存在偏差。' : '',
  suggestion: '建议补充相关场景知识片段，提升回复引用率。',
  conclusion: index % 9 === 0 ? 'high_risk' : index % 4 === 0 ? 'optimize' : 'pass',
  createdAt: `2026-05-${String(22 - (index % 7)).padStart(2, '0')} 0${8 + (index % 4)}:0${String(index % 6).padStart(2, '0')}`,
}));

export const feedbackLoop: FeedbackLoopRecord[] = [
  {
    id: 'FDB-001',
    source: '客服工作台',
    refId: 'CHAT-023',
    scenario: '物流延迟',
    issueType: '知识缺失',
    severity: 'medium',
    description: '客服在欧区包裹场景下会持续补充预计时效免责声明。',
    action: '更新物流提示词模板，并补充欧区物流延迟检索片段。',
    createTodo: false,
    owner: '知识运营',
    status: 'shipped',
    updatedAt: '2026-05-22 09:10',
  },
  {
    id: 'FDB-002',
    source: '人工质检',
    refId: 'TKT-101',
    scenario: '投诉',
    issueType: '知识缺失',
    severity: 'high',
    description: '法国赔偿诉求缺少本地化投诉政策。',
    action: '发布法国投诉附录，并在上线前阻止赔偿相关草稿流转。',
    createTodo: true,
    owner: '知识运营',
    status: 'triaged',
    updatedAt: '2026-05-22 10:25',
  },
  {
    id: 'FDB-003',
    source: '工单审核',
    refId: 'TKT-202',
    scenario: '退款申请',
    issueType: '回复不准',
    severity: 'medium',
    description: '草稿过度强调道歉，但证据清单说明不足。',
    action: '调整退款提示词，强制包含订单状态、证据要求和审批路径。',
    createTodo: true,
    owner: 'AI 辅助运行时',
    status: 'new',
    updatedAt: '2026-05-22 11:05',
  },
  { id: 'FDB-004', source: '召回测试', refId: 'DOC-RAG-REF-042', scenario: '投诉', issueType: '召回错误', severity: 'high', description: '投诉场景中 AI 草稿试图承诺赔偿，护栏正确拦截。', action: '更新投诉场景 blockedClaims，强化赔偿承诺检测规则。', createTodo: true, owner: '风控', status: 'new', updatedAt: '2026-05-27 14:30' },
  { id: 'FDB-005', source: '人工质检', refId: 'TKT-305', scenario: '物流延迟', issueType: '知识缺失', severity: 'medium', description: '泰语物流模板未覆盖热带气候导致的运输延误场景。', action: '新增东南亚物流本地化知识文档，补充气候相关 FAQ。', createTodo: false, owner: '知识运营', status: 'triaged', updatedAt: '2026-05-26 09:15' },
  { id: 'FDB-006', source: '客服工作台', refId: 'CHAT-056', scenario: '退款申请', issueType: '口径冲突', severity: 'medium', description: '客服多次手动修改退款回复中的退款时效说明，与政策文档不一致。', action: '更新退款政策文档 v2.1，统一退款时效口径为 7-14 工作日。', createTodo: false, owner: '知识运营', status: 'shipped', updatedAt: '2026-05-25 16:40' },
  { id: 'FDB-007', source: '用户反馈', refId: 'TKT-410', scenario: '支付失败', issueType: '知识缺失', severity: 'high', description: '客户投诉支付失败后客服回复模板未包含替代支付方式建议。', action: '在支付异常处理流程中增加替代支付方案引导段落。', createTodo: true, owner: '产品支持', status: 'triaged', updatedAt: '2026-05-25 11:20' },
  { id: 'FDB-008', source: '人工质检', refId: 'CHAT-078', scenario: '商品咨询', issueType: '回复不准', severity: 'high', description: '德语商品规格回复中单位制式(公制/英制)混淆导致信息错误。', action: '在 Prompt 模板中增加区域与度量单位约束规则。', createTodo: true, owner: '商品团队', status: 'new', updatedAt: '2026-05-28 08:00' },
];

export const auditLogs: AuditLogRecord[] = [
  {
    id: 'AUD-001',
    ticketId: 'TKT-003',
    eventType: 'Guardrail block',
    actor: '系统',
    outcome: '草稿中的赔偿承诺已在复核前移除。',
    riskLevel: 'High',
    timestamp: '2026-05-22 10:42',
    detail: '草稿提及赔偿，但没有引用已批准的本地化政策来源。',
  },
  {
    id: 'AUD-002',
    ticketId: 'TKT-014',
    eventType: 'Reviewer override',
    actor: '戴珂岚',
    outcome: '补充物流追踪编号后，草稿通过审批。',
    riskLevel: 'Medium',
    timestamp: '2026-05-22 10:58',
    detail: '人工复核在物流证据齐备后放行了该草稿。',
  },
  {
    id: 'AUD-003',
    ticketId: 'TKT-021',
    eventType: 'Knowledge incident',
    actor: '知识运营',
    outcome: '过期的地址修改 SOP 已从活动检索集中移除。',
    riskLevel: 'Low',
    timestamp: '2026-05-22 11:16',
    detail: '检测到生效日期不一致后，已排队等待重建索引。',
  },
  {
    id: 'AUD-004',
    ticketId: 'TKT-034',
    eventType: 'Action blocked',
    actor: '系统',
    outcome: '退款执行因等待主管审批而被阻止。',
    riskLevel: 'High',
    timestamp: '2026-05-22 11:39',
    detail: 'AI 辅助仅生成了检查清单，并未审批或执行退款。',
  },
  {
    id: 'AUD-005',
    ticketId: 'TKT-008',
    eventType: 'Manual send',
    actor: '陈艾琳',
    outcome: '客服已人工发送更新后的物流说明。',
    riskLevel: 'Low',
    timestamp: '2026-05-22 12:08',
    detail: '发送前已补齐追踪编号与预计送达窗口。',
  },
  {
    id: 'AUD-006',
    ticketId: 'TKT-012',
    eventType: 'Knowledge incident',
    actor: '知识运营',
    outcome: '法语退货指引因缺少引用来源被标记待修复。',
    riskLevel: 'Medium',
    timestamp: '2026-05-22 12:22',
    detail: '当前版本缺少最新法语条款引用，已暂停进入正式检索集。',
  },
  {
    id: 'AUD-007',
    ticketId: 'TKT-041',
    eventType: 'Reviewer override',
    actor: '团队负责人',
    outcome: '主管要求改写赔偿措辞后重新提交。',
    riskLevel: 'High',
    timestamp: '2026-05-22 12:31',
    detail: '原草稿承诺超出当前政策边界，已退回给客服重写。',
  },
  {
    id: 'AUD-008',
    ticketId: 'TKT-056',
    eventType: 'Guardrail block',
    actor: '系统',
    outcome: '未附引用的退款草稿已被自动拦截。',
    riskLevel: 'High',
    timestamp: '2026-05-22 12:44',
    detail: '当前草稿没有注入有效 retrieved chunks，发送链路被强制中断。',
  },
  { id: 'AUD-009', ticketId: 'SYSTEM', eventType: 'Config change', actor: '知识运营', outcome: '全局 RAG 检索配置已更新。', riskLevel: 'Low', timestamp: '2026-05-26 10:15', detail: 'Top K 从 5 调整为 7，重排序从关闭切换为开启，以提升高敏场景的检索精度。' },
  { id: 'AUD-010', ticketId: 'SYSTEM', eventType: 'Config change', actor: 'AI 辅助运行时', outcome: '物流场景策略已更新。', riskLevel: 'Low', timestamp: '2026-05-25 15:40', detail: '物流场景（SCN-001）主模型从 gpt-4o-mini 切换为 gpt-4.1-mini，temperature 从 0.3 降为 0.2。' },
  { id: 'AUD-011', ticketId: 'SYSTEM', eventType: 'Config change', actor: '知识运营', outcome: '知识库配置覆盖已保存。', riskLevel: 'Low', timestamp: '2026-05-24 09:30', detail: 'KB-OPS（履约与物流知识库）chunkSize 从全局默认 600 覆盖为 500。' },
  { id: 'AUD-012', ticketId: 'SYSTEM', eventType: 'KB created', actor: '知识运营', outcome: '新知识库已创建。', riskLevel: 'Low', timestamp: '2026-05-27 11:00', detail: '创建了「东南亚物流专项库」，覆盖场景：物流、退款，chunkSize=300，topK=8。' },
  { id: 'AUD-013', ticketId: 'SYSTEM', eventType: 'KB archived', actor: '知识运营', outcome: '知识库已归档。', riskLevel: 'Low', timestamp: '2026-05-28 09:00', detail: '「VIP 客户专属知识库」因内容已合并至主知识库，已被归档。' },
  { id: 'AUD-014', ticketId: 'SYSTEM', eventType: 'Scenario config change', actor: '风控', outcome: '投诉场景禁止声明已更新。', riskLevel: 'Medium', timestamp: '2026-05-26 16:20', detail: '投诉场景（SCN-005）blockedClaims 中新增「不得建议客户撤销信用卡争议(chargeback)」。' },
];

function mapActivityScope(action: string) {
  if (action.includes('RAG')) return 'RAG 配置';
  if (action.includes('知识')) return '知识运营';
  if (action.includes('工单')) return '工单执行';
  return '系统设置';
}

export function buildSettingsOperationLogs(activityItems: ActivityLogItem[], auditItems: AuditLogRecord[]): SettingsOperationLogSnapshot {
  const activityEntries = activityItems.map(item => ({
    id: item.id,
    timestampLabel: item.time,
    sourceType: 'system_activity' as const,
    actor: item.user,
    action: item.action,
    scope: mapActivityScope(item.action),
    result: '已记录',
    detail: item.detail,
  }));

  const auditEntries = [...auditItems]
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .map(item => ({
      id: item.id,
      timestampLabel: item.timestamp,
      sourceType: 'ai_audit' as const,
      actor: item.actor,
      action: item.eventType,
      scope: item.eventType === 'Knowledge incident' ? '知识事件' : 'AI 审计 / 工单链路',
      result: item.outcome,
      detail: item.detail,
      riskLevel: item.riskLevel,
    }));

  return {
    entries: [...activityEntries, ...auditEntries],
  };
}

settings.operationLogs = buildSettingsOperationLogs(activityLog, auditLogs);
