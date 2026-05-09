'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, ChevronRight, Clock } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, formatApiError } from '@/lib/api';
import { formatRelativeTime, cn } from '@/lib/utils';
import { ITicket } from '@berry-x/types';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  in_progress: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
  resolved: 'bg-green-100 dark:bg-green-900/30 text-green-600',
  closed: 'bg-muted text-muted-foreground',
};

const CATEGORIES = ['Account', 'Transaction', 'Bills', 'KYC', 'Crypto', 'Technical', 'Other'];

export default function SupportPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');

  const { data: tickets, isLoading } = useQuery<ITicket[]>({
    queryKey: ['tickets'],
    queryFn: async () => {
      const { data } = await api.get('/support/tickets');
      return data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/support/tickets', { subject, category, message });
      return data.data;
    },
    onSuccess: () => {
      toast.success('Ticket created!');
      setShowForm(false);
      setSubject(''); setCategory(''); setMessage('');
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-5">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold">Support</motion.h1>
        <button onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary">
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="berry-card mb-5 space-y-3">
          <h3 className="font-semibold">Create Support Ticket</h3>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="berry-input">
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c} value={c.toLowerCase()}>{c}</option>)}
          </select>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="berry-input" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your issue..." rows={4} className="berry-input resize-none" />
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold">Cancel</button>
            <button onClick={() => createMutation.mutate()} disabled={!subject || !category || !message || createMutation.isPending} className="flex-1 berry-btn-primary">
              {createMutation.isPending ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : !tickets?.length ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-3 text-2xl">🎧</div>
          <p className="font-medium">No support tickets</p>
          <p className="text-sm text-muted-foreground mt-1">Create a ticket if you need help</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket: ITicket, i) => (
            <motion.div key={ticket.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="berry-card hover:shadow-sm transition-shadow cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={15} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{ticket.ticketNumber}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full capitalize', STATUS_COLORS[ticket.status] || STATUS_COLORS.open)}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock size={9} />{formatRelativeTime(ticket.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground mt-1" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
