import type { Customer, Order, Ticket, FollowUpTask } from '../types';

export function getC(customers: Customer[], id: string | undefined | null): Customer | undefined {
  if (!id) return undefined;
  return customers.find(c => c.id === id);
}

export function getTicket(tickets: Ticket[], id: string | undefined | null): Ticket | undefined {
  if (!id) return undefined;
  return tickets.find(t => t.id === id);
}

export function getOrder(orders: Order[], id: string | undefined | null): Order | undefined {
  if (!id) return undefined;
  return orders.find(o => o.id === id);
}

export function getOrdersByC(orders: Order[], cid: string | undefined | null): Order[] {
  if (!cid) return [];
  return orders.filter(o => o.customerId === cid);
}

export function getTicketsByC(tickets: Ticket[], cid: string | undefined | null): Ticket[] {
  if (!cid) return [];
  return tickets.filter(t => t.customerId === cid);
}

export function getMsgs(messages: { ticketId: string }[], tid: string | undefined | null) {
  if (!tid) return [];
  return messages.filter(m => m.ticketId === tid);
}

export function getTasksByT(tasks: FollowUpTask[], tid: string | undefined | null): FollowUpTask[] {
  if (!tid) return [];
  return tasks.filter(t => t.ticketId === tid);
}

export function getTasksByC(tasks: FollowUpTask[], cid: string | undefined | null): FollowUpTask[] {
  if (!cid) return [];
  return tasks.filter(t => t.customerId === cid);
}
