import type { FAQ, ReplyTemplate, BusinessRule, PolicyDoc, AICapability, PermissionBoundary, Agent, SettingsData } from '../types';

export const FAQLIST: FAQ[] = [
  { id: 'FAQ-001', question: 'How long does standard shipping take?', category: 'Shipping', answerSummary: 'Standard: 7-14 business days. Express: 3-7 days.', language: 'EN', status: 'Published', usageCount: 342, matchAccuracy: 92 },
  { id: 'FAQ-002', question: 'What is your return policy?', category: 'Returns', answerSummary: '30-day return window. Refund within 5-7 business days.', language: 'EN', status: 'Published', usageCount: 287, matchAccuracy: 89 },
  { id: 'FAQ-003', question: 'How do I track my order?', category: 'Shipping', answerSummary: 'Tracking number sent via email after dispatch.', language: 'EN', status: 'Published', usageCount: 198, matchAccuracy: 94 },
  { id: 'FAQ-004', question: 'Can I change my shipping address?', category: 'Orders', answerSummary: 'If not yet dispatched, yes. Contact support immediately.', language: 'EN', status: 'Published', usageCount: 156, matchAccuracy: 91 },
  { id: 'FAQ-005', question: 'Do you ship to PO boxes?', category: 'Shipping', answerSummary: 'Some carriers do not deliver to PO boxes.', language: 'EN', status: 'Published', usageCount: 89, matchAccuracy: 86 },
  { id: 'FAQ-006', question: 'What payment methods do you accept?', category: 'Payment', answerSummary: 'Visa, Mastercard, PayPal, Apple Pay, Google Pay.', language: 'EN', status: 'Published', usageCount: 234, matchAccuracy: 95 },
  { id: 'FAQ-007', question: 'How do I apply a discount code?', category: 'Promotions', answerSummary: 'Enter code at checkout in Discount Code field.', language: 'EN', status: 'Published', usageCount: 178, matchAccuracy: 90 },
  { id: 'FAQ-008', question: 'Why was my payment declined?', category: 'Payment', answerSummary: 'Insufficient funds, bank block, or incorrect details.', language: 'EN', status: 'Published', usageCount: 145, matchAccuracy: 87 },
  { id: 'FAQ-009', question: 'Do you ship internationally?', category: 'Shipping', answerSummary: 'Yes, to 50+ countries. Duties/taxes may apply.', language: 'EN', status: 'Published', usageCount: 267, matchAccuracy: 93 },
  { id: 'FAQ-010', question: 'Can I cancel my order?', category: 'Orders', answerSummary: 'Within 24h if not processed. Contact support ASAP.', language: 'EN', status: 'Published', usageCount: 134, matchAccuracy: 88 },
  { id: 'FAQ-011', question: '¿Cómo rastrear mi pedido?', category: 'Shipping', answerSummary: 'Número de seguimiento enviado por correo electrónico.', language: 'ES', status: 'Published', usageCount: 45, matchAccuracy: 82 },
  { id: 'FAQ-012', question: 'Как отследить мой заказ?', category: 'Shipping', answerSummary: 'Трек-номер отправляется на email после отправки.', language: 'RU', status: 'Published', usageCount: 34, matchAccuracy: 78 },
];

export const REPLY_TEMPLATES: ReplyTemplate[] = [
  { id: 'TPL-001', name: 'Shipping Delay Apology', scenario: 'Shipping', language: 'EN', tone: 'Apologetic', status: 'Active', usageCount: 89, content: 'Hi {customer}, sorry your tracking has not updated. We will contact the logistics provider and follow up within 24 hours.' },
  { id: 'TPL-002', name: 'Refund Request Received', scenario: 'Refund', language: 'EN', tone: 'Professional', status: 'Active', usageCount: 67, content: 'Hi {customer}, your refund request for order {order_id} has been submitted to our review team.' },
  { id: 'TPL-003', name: 'Product Inquiry Response', scenario: 'Inquiry', language: 'EN', tone: 'Helpful', status: 'Active', usageCount: 45, content: 'Hi {customer}, yes this product is compatible with {device}. Let me know if you have other questions!' },
  { id: 'TPL-004', name: 'Payment Issue Assistance', scenario: 'Payment', language: 'EN', tone: 'Supportive', status: 'Active', usageCount: 56, content: 'Hi {customer}, sorry about the payment issue. Try a different card, use PayPal, or contact your bank.' },
  { id: 'TPL-005', name: 'Complaint Acknowledgment', scenario: 'Complaint', language: 'EN', tone: 'Empathetic', status: 'Active', usageCount: 34, content: 'Hi {customer}, I sincerely apologize. I have escalated this and will personally follow up.' },
  { id: 'TPL-006', name: 'Address Change Confirmation', scenario: 'Address', language: 'EN', tone: 'Professional', status: 'Active', usageCount: 23, content: 'Hi {customer}, I have updated your shipping address. Please allow a few hours to reflect.' },
  { id: 'TPL-007', name: 'Defective Product Return', scenario: 'Return', language: 'EN', tone: 'Apologetic', status: 'Active', usageCount: 41, content: 'Hi {customer}, sorry about the defect. A prepaid return label will be sent to your email.' },
  { id: 'TPL-008', name: 'VIP Priority Handling', scenario: 'VIP', language: 'EN', tone: 'Appreciative', status: 'Active', usageCount: 12, content: 'Hi {customer}, thank you for being a VIP. I have upgraded your shipping to express at no charge.' },
];

export const BUSINESS_RULES: BusinessRule[] = [
  { id: 'RUL-001', name: 'Refund Request After Delivery', scenario: 'Refund', trigger: 'Customer requests refund after delivery', aiPermission: 'Suggest reply only', manualReviewRequired: 'Yes', status: 'Active' },
  { id: 'RUL-002', name: 'Shipping Delay Follow-up', scenario: 'Shipping Delay', trigger: 'Tracking not updated for 5+ days', aiPermission: 'Suggest reply + create task', manualReviewRequired: 'No', status: 'Active' },
  { id: 'RUL-003', name: 'Compensation Request', scenario: 'Compensation', trigger: 'Customer requests compensation', aiPermission: 'Suggest reply only', manualReviewRequired: 'Yes', status: 'Active' },
  { id: 'RUL-004', name: 'Chargeback Notification', scenario: 'Chargeback', trigger: 'Customer initiates chargeback', aiPermission: 'Notify only', manualReviewRequired: 'Yes', status: 'Active' },
  { id: 'RUL-005', name: 'Product Inquiry Pre-sale', scenario: 'Product Inquiry', trigger: 'Customer asks about product features', aiPermission: 'Suggest reply, can answer directly', manualReviewRequired: 'No', status: 'Active' },
  { id: 'RUL-006', name: 'Payment Retry Attempt', scenario: 'Payment Issue', trigger: 'Customer wants to retry payment', aiPermission: 'Suggest reply only', manualReviewRequired: 'Yes', status: 'Active' },
  { id: 'RUL-007', name: 'Address Change Request', scenario: 'Address Change', trigger: 'Customer requests address change', aiPermission: 'Suggest reply + verify', manualReviewRequired: 'No', status: 'Active' },
  { id: 'RUL-008', name: 'Complaint Escalation', scenario: 'Complaint', trigger: 'Customer files complaint', aiPermission: 'Suggest reply only', manualReviewRequired: 'Yes', status: 'Active' },
];

export const POLICY_DOCS: PolicyDoc[] = [
  { name: 'Shipping Delay Policy', description: 'Covers procedures for handling shipping delays over 5 days. Includes carrier escalation process and customer communication templates.', version: 'v2.1', updated: '2026-05-01' },
  { name: 'Return & Refund Policy', description: '30-day return window with condition requirements. Refund processing timeline and exception handling for special cases.', version: 'v3.0', updated: '2026-04-15' },
  { name: 'Compensation Guidelines', description: 'Defines scenarios where compensation is applicable. Requires supervisor approval for all compensation amounts over $20.', version: 'v1.5', updated: '2026-04-28' },
  { name: 'VIP Customer Protocol', description: 'Priority handling procedures for VIP tier customers. Includes express shipping upgrades, dedicated support, and personalized service.', version: 'v2.0', updated: '2026-05-10' },
  { name: 'Complaint Escalation Process', description: 'Step-by-step escalation flow for customer complaints. Mandatory supervisor notification for escalation requests.', version: 'v1.8', updated: '2026-05-05' },
];

export const AI_CAPABILITIES: AICapability[] = [
  { id: 'issue-classification', name: 'Issue Classification', enabled: true, desc: 'Auto-categorize customer issues by type and priority' },
  { id: 'faq-matching', name: 'FAQ Matching', enabled: true, desc: 'Match customer questions to knowledge base articles' },
  { id: 'context-summary', name: 'Context Summary', enabled: true, desc: 'Generate concise context summary for each ticket' },
  { id: 'suggested-reply', name: 'Suggested Reply', enabled: true, desc: 'Generate reply suggestions based on context and policies' },
  { id: 'risk-detection', name: 'Risk Detection', enabled: true, desc: 'Identify refund, compensation, and compliance risks' },
  { id: 'followup-reminder', name: 'Follow-up Reminder', enabled: true, desc: 'Auto-create follow-up tasks for pending items' },
  { id: 'tag-suggestion', name: 'Customer Tag Suggestion', enabled: true, desc: 'Suggest customer tags based on behavior and history' },
];

export const PERMISSION_BOUNDARIES: PermissionBoundary[] = [
  { scenario: 'Product Inquiry', aiSuggest: 'Yes', aiSend: 'No', manualReview: 'No' },
  { scenario: 'Shipping Delay', aiSuggest: 'Yes', aiSend: 'No', manualReview: 'No' },
  { scenario: 'Address Change', aiSuggest: 'Yes', aiSend: 'No', manualReview: 'No' },
  { scenario: 'Refund Request', aiSuggest: 'Yes', aiSend: 'No', manualReview: 'Yes' },
  { scenario: 'Compensation', aiSuggest: 'Yes', aiSend: 'No', manualReview: 'Yes' },
  { scenario: 'Chargeback', aiSuggest: 'Yes', aiSend: 'No', manualReview: 'Yes' },
  { scenario: 'Complaint', aiSuggest: 'Yes', aiSend: 'No', manualReview: 'Yes' },
  { scenario: 'Payment Retry', aiSuggest: 'Yes', aiSend: 'No', manualReview: 'Yes' },
];

export const GUARDRAILS: string[] = [
  'Use verified order data only - never invent tracking information',
  'Do not promise refund or compensation amounts without supervisor approval',
  'Do not invent delivery dates or shipping promises',
  'Always cite matched policy or FAQ when providing information',
  'Escalate sensitive cases (refund, compensation, chargeback, complaint) to human review',
  'Never send message on behalf of agent - always require manual confirmation',
  'Do not share internal team notes or operational details with customer',
];

export const AGENTS: Agent[] = [
  { name: 'You', role: 'Senior Agent' },
  { name: 'Alice Chen', role: 'Customer Support' },
  { name: 'Bob Wilson', role: 'Customer Support' },
  { name: 'Carol Davis', role: 'Team Lead' },
];

export const SETTINGS_DATA: SettingsData = {
  general: { language: 'English', timezone: 'UTC-5 (Eastern Time)', notifications: 'Email + In-app' },
  team: AGENTS,
  channels: { liveChat: true, email: true, ticket: true, whatsapp: false, messenger: false },
  notifications: { newTicket: true, slaWarning: true, aiAlert: true, taskReminder: true, reviewRequired: true },
};
