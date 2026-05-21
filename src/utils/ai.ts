import type { Ticket, Customer, AISuggestion } from '../types';

function cName(customers: Customer[], id: string | undefined | null): string {
  if (!id) return 'Unknown';
  const c = customers.find(c => c.id === id);
  return c ? c.name : 'Unknown';
}

const SUGGESTION_MAP: Record<string, (cName: string) => { content: string; confidence: number; sources: { name: string; match: string }[]; needsReview: boolean }> = {
  'Shipping Delay': (name) => ({
    content: `Hi ${name}, thank you for reaching out. I am sorry that your tracking has not updated for several days. I have checked your order and can see the package is currently in transit. We will contact the logistics provider and follow up with you within 24 hours. Thank you for your patience.`,
    confidence: 87,
    sources: [{ name: 'Shipping Delay Policy', match: '92%' }, { name: 'Logistics Tracking FAQ', match: '86%' }, { name: 'Order tracking status', match: '' }],
    needsReview: false,
  }),
  'Refund Request': (name) => ({
    content: `Hi ${name}, thank you for contacting us about a refund for your order. I understand your concern. I have noted your refund request and it has been forwarded to our review team for evaluation. We will process it within 3-5 business days and notify you once completed.`,
    confidence: 74,
    sources: [{ name: 'Refund Policy', match: '89%' }, { name: 'Refund After Delivery Rule', match: '95%' }],
    needsReview: true,
  }),
  'Product Inquiry': (name) => ({
    content: `Hi ${name}, thank you for your interest! Yes, the Wireless Bluetooth Earbuds Pro are fully compatible with iPhone 15. They support Bluetooth 5.3 and all iOS features including spatial audio. Let me know if you have other questions!`,
    confidence: 94,
    sources: [{ name: 'Product Specification', match: '96%' }, { name: 'FAQ - Compatibility', match: '91%' }],
    needsReview: false,
  }),
  'Coupon Issue': (name) => ({
    content: `Hi ${name}, I apologize for the trouble with the discount code. I have checked and the SUMMER20 code is still active. Please try clearing your browser cache or using an incognito window. If the issue persists, I will manually apply the discount to your order.`,
    confidence: 82,
    sources: [{ name: 'FAQ - Discount Code', match: '90%' }, { name: 'Promotion Policy', match: '85%' }],
    needsReview: false,
  }),
  'Payment Issue': (name) => ({
    content: `Hi ${name}, I am sorry you are having trouble with the payment. Your order was declined by the bank. You can: 1) Try a different card, 2) Use PayPal, 3) Contact your bank to authorize the transaction. Let me know which works for you.`,
    confidence: 79,
    sources: [{ name: 'FAQ - Payment Methods', match: '95%' }, { name: 'FAQ - Payment Declined', match: '87%' }],
    needsReview: false,
  }),
  'Payment Failed': (name) => ({
    content: `Hi ${name}, I am sorry your payment failed. Your order is still saved. You can try a different payment method or contact your bank. I can also help place a new order with alternative payment.`,
    confidence: 79,
    sources: [{ name: 'FAQ - Payment Methods', match: '95%' }, { name: 'FAQ - Payment Declined', match: '87%' }],
    needsReview: true,
  }),
  'Complaint': (name) => ({
    content: `Hi ${name}, I understand your frustration and I sincerely apologize for the delayed delivery. I have escalated this to our logistics team as a priority. Regarding compensation, I will discuss options with my supervisor and get back to you within 2 hours. Thank you for your patience.`,
    confidence: 68,
    sources: [{ name: 'Complaint Escalation Rule', match: '94%' }, { name: 'Standard Apology Template', match: '88%' }, { name: 'Lost Package Policy', match: '78%' }],
    needsReview: true,
  }),
  'Address Change': (name) => ({
    content: `Hi ${name}, I have updated your shipping address for your order to your new address. Please allow a few hours for the change to reflect. You will receive a confirmation email once complete.`,
    confidence: 91,
    sources: [{ name: 'Address Change Rule', match: '93%' }, { name: 'FAQ - Change Address', match: '91%' }],
    needsReview: false,
  }),
  'Return Request': (name) => ({
    content: `Hi ${name}, I am sorry to hear about the issue. I have initiated a return for your order. You will receive a prepaid return label within 24 hours. Refund will be processed 5-7 business days after we receive the item.`,
    confidence: 81,
    sources: [{ name: 'Return Policy', match: '89%' }, { name: 'Defective Product Template', match: '85%' }],
    needsReview: true,
  }),
  'VIP Support': (name) => ({
    content: `Hi ${name}, thank you for being a valued VIP customer! I have upgraded your shipping to express delivery at no charge. Your order will be delivered within 2-3 business days. Is there anything else I can help with?`,
    confidence: 93,
    sources: [{ name: 'VIP Priority Template', match: '90%' }, { name: 'Customer Tier - VIP', match: '88%' }],
    needsReview: false,
  }),
  'Order Cancellation': (name) => ({
    content: `Hi ${name}, your order has been cancelled successfully. The refund will be returned to your original payment method within 5-7 business days.`,
    confidence: 88,
    sources: [{ name: 'Order Cancellation FAQ', match: '88%' }],
    needsReview: false,
  }),
  'Reorder Request': (name) => ({
    content: `Hi ${name}, I can help you place a new order with expedited shipping! I will set up express delivery (3-5 business days). Would you like to proceed with the same items?`,
    confidence: 85,
    sources: [{ name: 'FAQ - Shipping Options', match: '92%' }, { name: 'Reorder History', match: '80%' }],
    needsReview: false,
  }),
};

export function getAISug(tickets: Ticket[], customers: Customer[], tid: string | undefined | null): AISuggestion[] {
  if (!tid) return [];
  const t = tickets.find(t => t.id === tid);
  if (!t) return [];
  const fn = SUGGESTION_MAP[t.issueType];
  if (!fn) return [];
  const name = cName(customers, t.customerId);
  return [fn(name)];
}

const SUMMARY_MAP: Record<string, (cName: string) => string> = {
  'Shipping Delay': (name) => `${name} is asking why order tracking has not updated for several days. The order was shipped 8 days ago, but tracking has not changed for 5 days. ${name} has already followed up twice. Recommend acknowledging the delay, checking with logistics, and setting a 24-hour follow-up task.`,
  'Refund Request': (name) => `${name} received their order but reports the item is not working as described. ${name} is requesting a full refund. This is a refund-after-delivery scenario which requires manual review per policy.`,
  'Product Inquiry': (name) => `${name} is asking about product compatibility with iPhone 15. This is a pre-sale inquiry that can be answered directly.`,
  'Coupon Issue': (name) => `${name} is unable to apply discount code SUMMER20 at checkout. The promotion is still active. Recommend troubleshooting and offering manual discount as fallback.`,
  'Payment Issue': (name) => `${name}'s payment was declined. Customer is requesting alternative payment method. No refund or compensation involved.`,
  'Payment Failed': (name) => `${name}'s payment failed 4 days ago. Customer wants to retry. Requires manual review before payment retry.`,
  'Complaint': (name) => `${name}'s order is delayed due to weather. Package stuck for 4 days. Customer is frustrated and requesting compensation. Requires manual review.`,
  'Address Change': (name) => `${name} wants to update shipping address before dispatch. Order is still processing. Can be handled directly.`,
  'Return Request': (name) => `${name} reports defective headphones. Requesting return and refund. Manual review recommended for return eligibility.`,
  'VIP Support': (name) => `${name}, a VIP customer, is requesting priority shipping. Offer express upgrade as VIP perk.`,
  'Order Cancellation': (name) => `${name} requested order cancellation. Already processed.`,
  'Reorder Request': (name) => `${name} wants to reorder with expedited shipping.`,
};

export function getAICtx(tickets: Ticket[], customers: Customer[], tid: string | undefined | null): string {
  if (!tid) return '';
  const t = tickets.find(t => t.id === tid);
  if (!t) return '';
  const c = customers.find(c => c.id === t.customerId);
  if (!c) return '';
  const fn = SUMMARY_MAP[t.issueType];
  if (fn) return fn(c.name);
  return `${c.name} has submitted a ticket regarding ${t.issueType}. AI analysis complete.`;
}
