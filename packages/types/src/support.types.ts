export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  AWAITING_USER = 'awaiting_user',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TicketCategory {
  TRANSACTION = 'transaction',
  ACCOUNT = 'account',
  KYC = 'kyc',
  CRYPTO = 'crypto',
  BILLING = 'billing',
  TECHNICAL = 'technical',
  FRAUD = 'fraud',
  OTHER = 'other',
}

export interface ISupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  assignedTo?: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  subject: string;
  description: string;
  relatedTransactionId?: string;
  attachments?: string[];
  tags?: string[];
  resolvedAt?: Date;
  closedAt?: Date;
  firstResponseAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: 'user' | 'support' | 'system';
  message: string;
  attachments?: string[];
  isInternal: boolean;
  createdAt: Date;
}
