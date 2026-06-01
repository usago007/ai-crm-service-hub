import type { CustomerProfile, IssueType, Order, Priority, TicketStatus, TicketWorkflowStage } from '../../types';
import { displayIssueType, displayLanguage } from '../../utils/display';

const people = [
  ['史约翰', '美国', '英语', 'EN', '美区'],
  ['卡特琳', '英国', '英语', 'EN', '英区'],
  ['布朗德', '德国', '德语', 'DE', '欧区'],
  ['苏菲亚', '法国', '法语', 'FR', '欧区'],
  ['陈语安', '中国台湾', '中文', 'ZH', '亚太区'],
  ['田中美亚', '日本', '日语', 'JA', '亚太区'],
  ['马丁卢卡', '加拿大', '英语', 'EN', '北美区'],
  ['加西亚', '西班牙', '西班牙语', 'ES', '欧区'],
  ['金诺亚', '韩国', '韩语', 'KO', '亚太区'],
  ['利亚姆', '澳大利亚', '英语', 'EN', '亚太区'],
];

export const issueTemplates: Array<{
  issueType: IssueType;
  intent: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  workflowStage: TicketWorkflowStage;
  status: TicketStatus;
  priority: Priority;
  segment: string;
  riskFlags: string[];
  policyDecision: string;
  requiredAction: string;
  summary: string;
  regionStrategy: string;
  publishGap?: string | null;
}> = [
  {
    issueType: 'Shipping Delay',
    intent: '物流延迟说明',
    riskLevel: 'Medium',
    workflowStage: 'review',
    status: 'In Progress',
    priority: 'High',
    segment: '留存观察',
    riskFlags: ['物流延迟'],
    policyDecision: '需要核查物流商状态，并避免任何金额承诺。',
    requiredAction: '跟进物流商并在 24 小时内回访',
    summary: '物流轨迹已多日未更新。',
    regionStrategy: '标准承诺',
    publishGap: null,
  },
  {
    issueType: 'Refund Request',
    intent: '退款资格核查',
    riskLevel: 'High',
    workflowStage: 'review',
    status: 'Pending Review',
    priority: 'Urgent',
    segment: '风险复核',
    riskFlags: ['退款风险'],
    policyDecision: '需补充证据并提交主管审批。',
    requiredAction: '主管审核证据',
    summary: '客户在签收后提出退款诉求。',
    regionStrategy: '退款护栏',
    publishGap: null,
  },
  {
    issueType: 'Complaint',
    intent: '服务补救诉求',
    riskLevel: 'High',
    workflowStage: 'execute',
    status: 'Escalated',
    priority: 'Urgent',
    segment: '升级监控',
    riskFlags: ['赔偿风险'],
    policyDecision: '因赔偿审批与本地化政策缺口，必须升级处理。',
    requiredAction: '主管决策 + 补齐知识',
    summary: '客户因物流延迟投诉并提出赔偿要求。',
    regionStrategy: '投诉补救',
    publishGap: 'localized_policy_missing',
  },
  {
    issueType: 'Payment Failed',
    intent: '支付恢复',
    riskLevel: 'Medium',
    workflowStage: 'triage',
    status: 'New',
    priority: 'High',
    segment: '结账挽回',
    riskFlags: ['支付风险'],
    policyDecision: '建议重试并提供替代支付方式。',
    requiredAction: '核验支付渠道并重新打开结账链路',
    summary: '支付失败，客户需要重试支持。',
    regionStrategy: '支付恢复',
    publishGap: null,
  },
  {
    issueType: 'Address Change',
    intent: '发货前地址修改',
    riskLevel: 'Low',
    workflowStage: 'draft',
    status: 'New',
    priority: 'Normal',
    segment: '标准服务',
    riskFlags: [],
    policyDecision: '确认地址前需检查物流商截单时间。',
    requiredAction: '核验发货阶段',
    summary: '客户在发货前申请修改地址。',
    regionStrategy: '履约控制',
    publishGap: 'expired_sop',
  },
  {
    issueType: 'VIP Support',
    intent: 'VIP 高优先服务',
    riskLevel: 'Low',
    workflowStage: 'draft',
    status: 'In Progress',
    priority: 'Normal',
    segment: 'VIP 专属服务',
    riskFlags: [],
    policyDecision: '允许升级加急服务并主动跟进。',
    requiredAction: '确认 VIP 权益与物流 SLA',
    summary: 'VIP 客户希望获得优先支持。',
    regionStrategy: 'VIP 快速通道',
    publishGap: null,
  },
  {
    issueType: 'Product Inquiry',
    intent: '售前兼容性答复',
    riskLevel: 'Low',
    workflowStage: 'draft',
    status: 'New',
    priority: 'Low',
    segment: '增长转化',
    riskFlags: [],
    policyDecision: '可直接引用规格文档进行答复。',
    requiredAction: '发送商品细节并引导下单',
    summary: '客户咨询商品兼容性问题。',
    regionStrategy: '售前转化',
    publishGap: null,
  },
  {
    issueType: 'Return Request',
    intent: '退货资格与物流',
    riskLevel: 'High',
    workflowStage: 'review',
    status: 'Pending Review',
    priority: 'High',
    segment: '品质补救',
    riskFlags: ['退货复核'],
    policyDecision: '需核验商品瑕疵证据与退货时效。',
    requiredAction: '人工审批退货',
    summary: '客户反馈商品有瑕疵并申请退货。',
    regionStrategy: '售后补救',
    publishGap: null,
  },
];


export function pad(prefix: string, value: number) {
  return `${prefix}-${String(value).padStart(3, '0')}`;
}

export function isoDay(day: number, hour: number) {
  return `2026-05-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00`;
}


export function buildCustomers(): CustomerProfile[] {
  return Array.from({ length: 42 }, (_, index) => {
    const person = people[index % people.length];
    const template = issueTemplates[index % issueTemplates.length];
    const orders = 1 + (index % 6);
    return {
      id: pad('CUST', index + 1),
      name: `${person[0]}${index >= people.length ? ` ${index + 1}` : ''}`.trim(),
      email: `customer${index + 1}@example.com`,
      country: person[1],
      language: person[2],
      preferredLanguage: person[3],
      type: orders > 4 ? 'VIP 客户' : orders > 2 ? '复购客户' : '新客户',
      totalOrders: orders,
      lifetimeValue: Number((120 + index * 23.5).toFixed(2)),
      lastContact: isoDay(10 + (index % 12), 8 + (index % 10)),
      tags: [template.segment, displayIssueType(template.issueType), person[4]],
      avatarColor: ['#6C5CE7', '#F59E0B', '#3B82F6', '#10B981', '#FF6B6B'][index % 5],
      riskFlags: template.riskFlags,
      segment: template.segment,
      owner: ['陈艾琳', '吴柏霖', '戴珂岚', '你'][index % 4],
      regionStrategy: `${person[4]} ${template.regionStrategy}`,
      complaintHistory: template.issueType === 'Complaint' ? 2 + (index % 3) : index % 2,
      refundHistory: template.issueType === 'Refund Request' || template.issueType === 'Return Request' ? 1 + (index % 2) : 0,
      promiseFulfillment: `${88 - (index % 6) * 4}%`,
      recentServiceTimeline: [
        { id: pad('EV', index * 3 + 1), type: 'ticket', title: `${displayIssueType(template.issueType)}工单已创建`, detail: template.summary, at: isoDay(12 + (index % 10), 9) },
        { id: pad('EV', index * 3 + 2), type: 'rag', title: 'RAG 运行已同步', detail: `已应用 ${person[4]} 区域过滤与 ${displayLanguage(person[3])} 语言偏好。`, at: isoDay(12 + (index % 10), 10) },
        { id: pad('EV', index * 3 + 3), type: 'followup', title: '服务跟进已排队', detail: template.requiredAction, at: isoDay(12 + (index % 10), 11) },
      ],
    };
  });
}

export function buildOrders(customers: CustomerProfile[]): Order[] {
  const carriers = ['YunExpress', 'DHL', 'Royal Mail', 'SF Express', 'UPS'];
  const statuses = ['Processing', 'Shipped', 'Delivered'] as const;
  const paymentStates = ['Paid', 'Pending', 'Failed'] as const;
  const orders: Order[] = [];
  customers.forEach((customer, customerIndex) => {
    const count = 2 + (customerIndex % 3);
    for (let offset = 0; offset < count; offset += 1) {
      const orderIndex = orders.length + 1;
      const status = statuses[(customerIndex + offset) % statuses.length];
      orders.push({
        id: pad('ORD', orderIndex),
        customerId: customer.id,
        date: isoDay(1 + ((customerIndex + offset) % 20), 9 + (offset % 5)),
        total: Number((79 + customerIndex * 11 + offset * 18).toFixed(2)),
        paymentStatus: paymentStates[(customerIndex + offset) % paymentStates.length],
        fulfillmentStatus: status,
        carrier: status === 'Processing' ? '' : carriers[(customerIndex + offset) % carriers.length],
        tracking: status === 'Processing' ? '' : `TRK${customerIndex + 1}${offset + 1}${1000 + orderIndex}`,
        latestEvent: status === 'Processing' ? '仓库拣货' : status === 'Shipped' ? '运输途中' : '已送达',
        daysSinceUpdate: status === 'Delivered' ? 0 : 1 + ((customerIndex + offset) % 5),
        riskAlert: customer.riskFlags[0] && status !== 'Delivered' ? `${customer.riskFlags[0]}，需要持续关注。` : '',
        items: [
          { name: `配件组合 ${offset + 1}`, qty: 1, price: Number((39 + offset * 9).toFixed(2)) },
          { name: `主推商品 ${customerIndex % 5 + 1}`, qty: 1, price: Number((40 + customerIndex * 3.5).toFixed(2)) },
        ],
      });
    }
  });
  return orders.slice(0, 144);
}
