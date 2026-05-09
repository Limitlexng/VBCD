'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Search, ChevronLeft, ChevronRight,
  AlertCircle, Clock, CheckCircle2, XCircle, Send, X,
} from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { ISupportTicket, TicketStatus, TicketPriority } from '@berry-x/types';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001/api/v1' });

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  [TicketPriority.LOW]: 'bg-gray-100 text-gray-600',
  [TicketPriority.MEDIUM]: 'bg-yellow-100 text-yellow-700',
  [TicketPriority.HIGH]: 'bg-orange-100 text-orange-700',
  [TicketPriority.URGENT]: 'bg-red-100 text-red-700',
};

const STATUS_STYLES: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]: 'bg-blue-100 text-blue-700',
  [TicketStatus.IN_PROGRESS]: 'bg-purple-100 text-purple-700',
  [TicketStatus.WAITING_USER]: 'bg-yellow-100 text-yellow-700',
  [TicketStatus.RESOLVED]: 'bg-green-100 text-green-700',
  [TicketStatus.CLOSED]: 'bg-gray-100 text-gray-600',
};

const STATUS_ICONS = {
  [TicketStatus.OPEN]: <AlertCircle size={10} />,
  [TicketStatus.IN_PROGRESS]: <Clock size={10} />,
  [TicketStatus.WAITING_USER]: <Clock size={10} />,
  [TicketStatus.RESOLVED]: <CheckCircle2 size={10} />,
  [TicketStatus.CLOSED]: <XCircle size={10} />,
};

export default function SupportPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [priority, setPriority] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState<ISupportTicket | null>(null);
  const [reply, setReply] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tickets', page, search, status, priority],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (status !== 'ALL') params.status = status;
      if (priority !== 'ALL') params.priority = priority;
      const { data } = await api.get('/admin/support/tickets', { params });
      return data.data;
    },
  });

  const { data: ticketDetail } = useQuery({
    queryKey: ['ticket-detail', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket) return null;
      const { data } = await api.get(`/admin/support/tickets/${selectedTicket.id}`);
      return data.data;
    },
    enabled: !!selectedTicket,
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      api.post(`/admin/support/tickets/${id}/reply`, { message }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket-detail', selectedTicket?.id] });
      qc.invalidateQueries({ queryKey: ['admin-tickets'] });
      setReply('');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      api.patch(`/admin/support/tickets/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tickets'] });
      qc.invalidateQueries({ queryKey: ['ticket-detail', selectedTicket?.id] });
    },
  });

  const tickets: ISupportTicket[] = data?.items || [];
  const total: number = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="flex gap-5 h-[calc(100vh-8rem)]">
      {/* Ticket List */}
      <div className="w-[420px] flex-shrink-0 flex flex-col space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Support</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} tickets</p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-2 py-1.5 text-xs bg-card border border-border rounded-lg focus:outline-none"
          >
            <option value="ALL">All Status</option>
            {Object.values(TicketStatus).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
            ))
            : tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={cn(
                  'w-full text-left p-3.5 rounded-xl border transition-all',
                  selectedTicket?.id === ticket.id
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-card border-border hover:bg-muted/40',
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-xs font-mono text-muted-foreground">{ticket.ticketNumber}</span>
                  <div className="flex gap-1">
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', PRIORITY_STYLES[ticket.priority])}>
                      {ticket.priority}
                    </span>
                    <span className={cn('inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium', STATUS_STYLES[ticket.status])}>
                      {STATUS_ICONS[ticket.status]} {ticket.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-medium line-clamp-1">{ticket.subject}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ticket.category}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(ticket.updatedAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                </p>
              </button>
            ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-1 rounded hover:bg-muted disabled:opacity-40">
            <ChevronLeft size={14} />
          </button>
          <span>Page {page} / {totalPages || 1}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="p-1 rounded hover:bg-muted disabled:opacity-40">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Ticket Detail */}
      <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
        {!selectedTicket ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Select a ticket to view</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{ticketDetail?.ticketNumber}</span>
                  <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', PRIORITY_STYLES[ticketDetail?.priority || TicketPriority.LOW])}>
                    {ticketDetail?.priority}
                  </span>
                </div>
                <h2 className="font-semibold">{ticketDetail?.subject}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ticketDetail?.user?.firstName} {ticketDetail?.user?.lastName} · {ticketDetail?.category}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={ticketDetail?.status}
                  onChange={(e) => updateStatusMutation.mutate({ id: selectedTicket.id, status: e.target.value as TicketStatus })}
                  className="text-xs px-2 py-1.5 bg-background border border-border rounded-lg"
                >
                  {Object.values(TicketStatus).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
                <button onClick={() => setSelectedTicket(null)} className="p-1.5 hover:bg-muted rounded-lg">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {ticketDetail?.messages?.map((msg: any, i: number) => (
                <motion.div
                  key={msg.id || i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex gap-3', msg.isAdminReply ? 'flex-row-reverse' : 'flex-row')}
                >
                  <div className={cn(
                    'w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold',
                    msg.isAdminReply ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}>
                    {msg.isAdminReply ? 'A' : (ticketDetail?.user?.firstName?.[0] || 'U')}
                  </div>
                  <div className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm',
                    msg.isAdminReply
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted rounded-tl-sm',
                  )}>
                    <p>{msg.message}</p>
                    <p className={cn('text-xs mt-1', msg.isAdminReply ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                      {new Date(msg.createdAt).toLocaleTimeString('en-NG', { timeStyle: 'short' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Reply Input */}
            <div className="px-5 py-4 border-t border-border flex gap-3">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && reply.trim()) {
                    replyMutation.mutate({ id: selectedTicket.id, message: reply.trim() });
                  }
                }}
                placeholder="Type your reply... (Ctrl+Enter to send)"
                rows={2}
                className="flex-1 resize-none text-sm bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={() => reply.trim() && replyMutation.mutate({ id: selectedTicket.id, message: reply.trim() })}
                disabled={!reply.trim() || replyMutation.isPending}
                className="self-end px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <Send size={13} />
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
