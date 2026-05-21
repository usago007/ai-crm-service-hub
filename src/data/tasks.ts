import type { FollowUpTask } from '../types';

export const TASKS: FollowUpTask[] = [
  { id: 'TSK-001', description: 'Follow up with YunExpress for tracking update on order #100238', customerId: 'CUST-001', ticketId: 'TKT-001', due: '2026-05-21T09:00:00', priority: 'High', triggeredBy: 'AI Risk Detection', status: 'Pending', owner: 'You' },
  { id: 'TSK-002', description: 'Review refund eligibility for order #100221', customerId: 'CUST-002', ticketId: 'TKT-002', due: '2026-05-20T18:00:00', priority: 'Urgent', triggeredBy: 'Refund Request', status: 'In Progress', owner: 'You' },
  { id: 'TSK-003', description: 'Respond to product inquiry about iPhone 15 compatibility', customerId: 'CUST-003', ticketId: 'TKT-003', due: '2026-05-21T08:00:00', priority: 'Normal', triggeredBy: 'New Ticket', status: 'Pending', owner: 'You' },
  { id: 'TSK-004', description: 'Check coupon code SUMMER20 validity', customerId: 'CUST-004', ticketId: 'TKT-004', due: '2026-05-20T16:45:00', priority: 'Normal', triggeredBy: 'Coupon Issue', status: 'Pending', owner: 'You' },
  { id: 'TSK-005', description: 'Process alternative payment method for order #100301', customerId: 'CUST-005', ticketId: 'TKT-005', due: '2026-05-21T07:30:00', priority: 'High', triggeredBy: 'Payment Issue', status: 'Pending', owner: 'You' },
  { id: 'TSK-006', description: 'Review payment retry for order #100278', customerId: 'CUST-006', ticketId: 'TKT-006', due: '2026-05-20T14:00:00', priority: 'Urgent', triggeredBy: 'Payment Failed', status: 'In Progress', owner: 'You' },
  { id: 'TSK-007', description: 'Update shipping address for order #100267', customerId: 'CUST-007', ticketId: 'TKT-008', due: '2026-05-21T06:00:00', priority: 'Normal', triggeredBy: 'Address Change', status: 'Pending', owner: 'Unassigned' },
  { id: 'TSK-008', description: 'Escalate compensation request for order #100298', customerId: 'CUST-008', ticketId: 'TKT-009', due: '2026-05-20T16:00:00', priority: 'Urgent', triggeredBy: 'Complaint + Compensation', status: 'In Progress', owner: 'You' },
  { id: 'TSK-009', description: 'Initiate return for defective headphones order #100301', customerId: 'CUST-005', ticketId: 'TKT-010', due: '2026-05-22T09:00:00', priority: 'High', triggeredBy: 'Return Request', status: 'Pending', owner: 'You' },
  { id: 'TSK-010', description: 'Process express shipping upgrade for VIP customer', customerId: 'CUST-004', ticketId: 'TKT-007', due: '2026-05-21T10:00:00', priority: 'Low', triggeredBy: 'VIP Request', status: 'Pending', owner: 'Unassigned' },
  { id: 'TSK-011', description: 'Set up bulk reorder with expedited shipping', customerId: 'CUST-009', ticketId: 'TKT-011', due: '2026-05-22T15:00:00', priority: 'Normal', triggeredBy: 'Wholesale Request', status: 'Pending', owner: 'Unassigned' },
  { id: 'TSK-012', description: 'Send product spec sheet for earbuds inquiry', customerId: 'CUST-010', ticketId: 'TKT-012', due: '2026-05-21T11:00:00', priority: 'Low', triggeredBy: 'New Ticket', status: 'Pending', owner: 'Unassigned' },
];
