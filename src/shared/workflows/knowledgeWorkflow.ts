import type { KnowledgeBaseRecord, KnowledgeWizardDraft, ServiceHubSnapshot } from '../../types';
import { formatUiTimestamp } from '../lib/time';

export function createKnowledgeWizardDraft(snapshot: ServiceHubSnapshot, knowledgeBaseId: string | null = null): KnowledgeWizardDraft {
  return {
    knowledgeBaseId,
    sourceType: 'file',
    fileName: '',
    fileSizeLabel: '',
    documentName: '',
    knowledgeType: 'Policy',
    scenario: 'Shipping',
    language: 'EN',
    owner: '知识运营',
    version: 'v1.0',
    effectiveDate: new Date().toISOString().slice(0, 10),
    parser: structuredClone(snapshot.ragConfig.parser),
    chunking: structuredClone(snapshot.ragConfig.chunking),
    retrieval: structuredClone(snapshot.ragConfig.retrieval),
  };
}

export function createSeedKnowledgeBases(snapshot: ServiceHubSnapshot): KnowledgeBaseRecord[] {
  const groups: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    owner: string;
    tags: string[];
    status: KnowledgeBaseRecord['status'];
    scenarios: string[];
    collections: Array<{ id: string; name: string; description: string; scenarioTags: string[] }>;
  }> = [
    {
      id: 'KB-OPS',
      name: '履约与物流知识库',
      description: '覆盖物流履约、配送时效和订单追踪类 SOP、政策与回复模板。',
      icon: 'OPS',
      owner: '知识运营',
      tags: ['物流', '履约', '订单追踪'],
      status: 'active',
      scenarios: ['Shipping'],
      collections: [
        { id: 'KBC-OPS-LOGISTICS', name: '物流知识集合', description: '物流履约、承运商处理和跨境配送基础规则。', scenarioTags: ['Shipping'] },
        { id: 'KBC-OPS-DELIVERY-SLA', name: '配送时效知识集合', description: '配送时效、延误判断和 SLA 解释口径。', scenarioTags: ['Shipping'] },
        { id: 'KBC-OPS-ORDER-TRACKING', name: '订单追踪知识集合', description: '订单追踪、轨迹异常和客户查询处理流程。', scenarioTags: ['Shipping'] },
      ],
    },
    {
      id: 'KB-AFTERSALES',
      name: '售后与退款知识库',
      description: '覆盖退款、退货、支付异常和赔付类售后政策与审批边界。',
      icon: 'AFTER',
      owner: '售后运营',
      tags: ['售后', '退款', '赔付'],
      status: 'active',
      scenarios: ['Refund', 'Payment', 'Compensation'],
      collections: [
        { id: 'KBC-AFTERSALES-REFUND', name: '退款知识集合', description: '退款条件、审批权限和客户沟通规则。', scenarioTags: ['Refund'] },
        { id: 'KBC-AFTERSALES-RETURN', name: '退货知识集合', description: '退货流程、凭证要求和售后处理 SOP。', scenarioTags: ['Refund'] },
        { id: 'KBC-AFTERSALES-PAYMENT-COMPENSATION', name: '支付与赔付知识集合', description: '支付异常、赔付边界和财务处理口径。', scenarioTags: ['Payment', 'Refund', 'Compensation'] },
      ],
    },
    {
      id: 'KB-ESC',
      name: '投诉与升级知识库',
      description: '聚焦投诉、赔偿、拒付场景，突出高风险规则、审批边界与升级指引。',
      icon: 'RISK',
      owner: '风险运营',
      tags: ['投诉', '赔偿', '拒付'],
      status: 'syncing',
      scenarios: ['Complaint', 'Compensation', 'Chargeback'],
      collections: [
        { id: 'KBC-ESC-COMPLAINT', name: '投诉处理知识集合', description: '投诉处理流程、记录要求和客户安抚口径。', scenarioTags: ['Complaint'] },
        { id: 'KBC-ESC-ESCALATION', name: '升级规范知识集合', description: '主管、法务和风控升级规则。', scenarioTags: ['Complaint', 'Compensation', 'Chargeback'] },
        { id: 'KBC-ESC-HIGH-RISK-SCRIPT', name: '高风险话术知识集合', description: '高风险场景可用话术、禁止承诺和审核边界。', scenarioTags: ['Complaint', 'Compensation', 'Chargeback'] },
      ],
    },
    {
      id: 'KB-PROD',
      name: '商品与服务知识库',
      description: '面向商品咨询、促销说明与客服话术，兼顾规格、FAQ 与模板复用。',
      icon: 'PROD',
      owner: '产品支持',
      tags: ['商品咨询', '促销', 'FAQ'],
      status: 'active',
      scenarios: ['Product Inquiry', 'Promotion'],
      collections: [
        { id: 'KBC-PROD-FAQ', name: '商品 FAQ 知识集合', description: '商品规格、常见问答和购买前说明。', scenarioTags: ['Product Inquiry'] },
        { id: 'KBC-PROD-SERVICE-POLICY', name: '服务政策知识集合', description: '服务范围、售前承诺和标准话术。', scenarioTags: ['Product Inquiry', 'Promotion'] },
      ],
    },
  ];

  return groups.map(group => {
    const docs = snapshot.knowledgeDocuments.filter(doc => group.scenarios.includes(doc.scenario));
    const collections = group.collections.map(collection => {
      const scenarioDocs = docs.filter(doc => collection.scenarioTags.includes(doc.scenario));
      return {
        id: collection.id,
        knowledgeBaseId: group.id,
        name: collection.name,
        description: collection.description,
        scenarioTags: collection.scenarioTags,
        documentIds: scenarioDocs.map(doc => doc.id),
        status: group.status,
      };
    });
    const referencedScenarios = snapshot.scenarioModelConfigs
      .filter(config => config.knowledgeBindings.some(binding => binding.enabled && binding.knowledgeBaseId === group.id))
      .map(config => config.id);
    const activeCount = snapshot.scenarioModelConfigs.filter(config => config.status === 'active' && referencedScenarios.includes(config.id)).length;
    const draftCount = snapshot.scenarioModelConfigs.filter(config => config.status === 'draft' && referencedScenarios.includes(config.id)).length;
    const latestSync = snapshot.ingestionDocuments
      .filter(item => docs.some(doc => doc.id === item.documentId))
      .map(item => item.lastSync)
      .sort()
      .at(-1);

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      icon: group.icon,
      tags: group.tags,
      documentCount: docs.length,
      updatedAt: latestSync ?? formatUiTimestamp(),
      owner: group.owner,
      source: 'service_api' as const,
      status: group.status,
      documentIds: docs.map(doc => doc.id),
      collections,
      referencedByScenarioIds: referencedScenarios,
      referenceStats: {
        activeCount,
        draftCount,
        avgLatestScore: docs.length > 0 ? Math.round(docs.reduce((sum, doc) => sum + doc.coverageScore, 0) / docs.length) : undefined,
      },
      ...(group.id === 'KB-OPS' ? { configOverrides: { chunking: { strategy: 'by heading', chunkSize: 500, chunkOverlap: 80 }, retrieval: { topK: 5, similarityThreshold: 0.78 } } } : {}),
    };
  });
}
