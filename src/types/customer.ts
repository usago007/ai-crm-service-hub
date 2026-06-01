export interface Customer {
id: string;
  name: string;
  email: string;
  country: string;
  language: string;
  type: string;
  totalOrders: number;
  lifetimeValue: number;
  lastContact: string;
  tags: string[];
  avatarColor: string;
  riskFlags: string[];
}

export interface CustomerTimelineEvent {
  id: string;
  type: 'order' | 'ticket' | 'review' | 'action' | 'followup' | 'rag';
  title: string;
  detail: string;
  at: string;
}

export interface CustomerProfile extends Customer {
  segment: string;
  owner: string;
  preferredLanguage: string;
  regionStrategy: string;
  complaintHistory: number;
  refundHistory: number;
  promiseFulfillment: string;
  recentServiceTimeline: CustomerTimelineEvent[];
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  date: string;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  carrier: string;
  tracking: string;
  latestEvent: string;
  daysSinceUpdate: number;
  riskAlert: string;
  items: OrderItem[];
}

export interface CustomerFilters {
  segment?: string;
  country?: string;
  language?: string;
  riskFlag?: string;
}

export interface OrderFilters {
  fulfillmentStatus?: string;
  paymentStatus?: string;
  country?: string;
  risk?: string;
}
