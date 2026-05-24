import type {
  AISuggestion,
  Customer,
  CustomerProfile,
  FollowUpTask,
  Message,
  Order,
  ServiceHubSnapshot,
  ServiceTicket,
  Ticket,
} from '../../types';

export function toLegacyCustomer(customer: CustomerProfile): Customer {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    country: customer.country,
    language: customer.language,
    type: customer.type,
    totalOrders: customer.totalOrders,
    lifetimeValue: customer.lifetimeValue,
    lastContact: customer.lastContact,
    tags: customer.tags,
    avatarColor: customer.avatarColor,
    riskFlags: customer.riskFlags,
  };
}

export function toLegacyTicket(ticket: ServiceTicket): Ticket {
  return {
    id: ticket.id,
    customerId: ticket.customerId,
    channel: ticket.channel,
    issueType: ticket.issueType,
    priority: ticket.priority,
    status: ticket.status,
    assignee: ticket.assignee,
    sla: ticket.sla,
    aiSummary: ticket.aiSummary,
    aiSuggested: ticket.aiSuggested,
    needsReview: ticket.needsReview,
    lastUpdated: ticket.lastUpdated,
    summary: ticket.summary,
  };
}

export function buildSuggestion(snapshot: ServiceHubSnapshot, ticketId: string): AISuggestion | null {
  const ticket = snapshot.tickets.find(item => item.id === ticketId);
  if (!ticket) return null;
  const draft = snapshot.replyDrafts.find(item => item.id === ticket.draftId);
  if (!draft) return null;
  return {
    content: draft.content,
    confidence: draft.confidence,
    sources: draft.citations.map(citation => ({ name: citation.source, match: citation.match })),
    needsReview: ticket.needsReview,
  };
}

export function buildTicketMessages(messages: Message[], ticketId: string): Message[] {
  return messages.filter(item => item.ticketId === ticketId);
}

export function buildCustomerOrders(orders: Order[], customerId: string): Order[] {
  return orders.filter(item => item.customerId === customerId);
}

export function buildCustomerTasks(tasks: FollowUpTask[], customerId: string): FollowUpTask[] {
  return tasks.filter(item => item.customerId === customerId);
}
