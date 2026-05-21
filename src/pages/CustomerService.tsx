import { useMemo } from 'react';
import type { Ticket, Customer, Order, Message, FollowUpTask, AISuggestion } from '../types';
import { ConversationList } from '../components/service/ConversationList';
import { ConversationPanel } from '../components/service/ConversationPanel';
import { CustomerContextPanel } from '../components/service/CustomerContextPanel';
import { getAISug, getAICtx } from '../utils/ai';
import { getOrdersByC } from '../utils/ticket';

interface CustomerServiceProps {
  tickets: Ticket[];
  customers: Customer[];
  orders: Order[];
  messages: Message[];
  tasks: FollowUpTask[];
  selectedTicketId: string | null;
  replyText: string;
  channelFilter: string;
  searchQuery: string;
  onSelectTicket: (id: string) => void;
  onReplyTextChange: (val: string) => void;
  onInsertAI: () => void;
  onSendReply: () => void;
  onSaveDraft: () => void;
  onEscalate: () => void;
  onCloseTicket: () => void;
}

export function CustomerService({
  tickets, customers, orders, messages, tasks,
  selectedTicketId, replyText, channelFilter, searchQuery,
  onSelectTicket, onReplyTextChange, onInsertAI, onSendReply, onSaveDraft, onEscalate, onCloseTicket,
}: CustomerServiceProps) {
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (channelFilter !== 'all' && t.channel !== channelFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const c = customers.find(cu => cu.id === t.customerId);
        if (!c || (!c.name.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q) && !t.summary.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [tickets, channelFilter, searchQuery, customers]);

  const effectiveSelected = selectedTicketId && filteredTickets.find(t => t.id === selectedTicketId)
    ? selectedTicketId
    : filteredTickets.length > 0 ? filteredTickets[0].id : null;

  const selT = effectiveSelected ? tickets.find(t => t.id === effectiveSelected) ?? null : null;
  const selC = selT ? customers.find(c => c.id === selT.customerId) ?? null : null;
  const msgs = selT ? messages.filter(m => m.ticketId === selT.id) : [];
  const aiSugs = selT ? getAISug(tickets, customers, selT.id) : [];
  const aiSug = aiSugs.length > 0 ? aiSugs[0] : null;
  const aiSum = selT ? getAICtx(tickets, customers, selT.id) : '';
  const custOrders = selT ? getOrdersByC(orders, selT.customerId) : [];

  return (
    <div className="flex gap-4 h-[calc(100vh-96px)] overflow-hidden -mx-6 px-6 py-5">
      <ConversationList
        tickets={filteredTickets}
        customers={customers}
        selectedTicketId={effectiveSelected}
        onSelectTicket={onSelectTicket}
        searchQuery={searchQuery}
      />
      <ConversationPanel
        ticket={selT}
        customer={selC}
        messages={msgs}
        replyText={replyText}
        onReplyTextChange={onReplyTextChange}
        onInsertAI={onInsertAI}
        onSendReply={onSendReply}
        onSaveDraft={onSaveDraft}
        onEscalate={onEscalate}
        onCloseTicket={onCloseTicket}
      />
      {selT && (
        <CustomerContextPanel
          ticket={selT}
          customer={selC}
          aiSummary={aiSum}
          aiSug={aiSug}
          aiSugs={aiSugs}
          orders={custOrders}
          onInsertSuggestion={onInsertAI}
          onRegenerate={() => {}}
        />
      )}
    </div>
  );
}
