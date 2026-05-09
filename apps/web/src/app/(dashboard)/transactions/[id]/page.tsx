'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, getTransactionIcon, getTransactionStatusColor, cn } from '@/lib/utils';
import { ITransaction, TransactionStatus } from '@berry-x/types';
import toast from 'react-hot-toast';

const STATUS_ICON: Record<string, React.ReactNode> = {
  success: <CheckCircle size={20} className="text-green-500" />,
  failed: <XCircle size={20} className="text-red-500" />,
  pending: <Clock size={20} className="text-yellow-500" />,
  processing: <RefreshCw size={20} className="text-blue-500 animate-spin" />,
  reversed: <RefreshCw size={20} className="text-purple-500" />,
};

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: tx, isLoading } = useQuery<ITransaction>({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const { data } = await api.get(`/transactions/${id}`);
      return data.data;
    },
  });

  const copy = (val: string, label = 'Copied') => {
    navigator.clipboard.writeText(val);
    toast.success(`${label} copied!`);
  };

  if (isLoading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="h-6 w-24 bg-muted rounded animate-pulse" />
        <div className="h-32 bg-muted rounded-2xl animate-pulse" />
        {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (!tx) return null;

  const isCredit = ['wallet_funding', 'reversal', 'referral_bonus', 'cashback'].includes(tx.type);

  return (
    <div className="px-4 py-4 max-w-md">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground mb-5 hover:text-foreground transition-colors">
        <ArrowLeft size={16} /><span className="text-sm">Back</span>
      </button>

      {/* Amount Hero */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3 text-3xl">
          {getTransactionIcon(tx.type)}
        </div>
        <p className={cn('text-3xl font-bold', isCredit ? 'text-green-600 dark:text-green-400' : 'text-foreground')}>
          {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {STATUS_ICON[tx.status] || <Clock size={16} />}
          <span className={cn('text-sm font-medium capitalize', getTransactionStatusColor(tx.status))}>{tx.status}</span>
        </div>
      </motion.div>

      {/* Details */}
      <div className="berry-card space-y-3">
        {[
          { label: 'Description', value: tx.description },
          { label: 'Reference', value: tx.reference, copy: true },
          { label: 'Type', value: tx.type.replace(/_/g, ' ') },
          { label: 'Fee', value: formatCurrency(tx.fee || 0) },
          { label: 'Total', value: formatCurrency(tx.totalAmount || tx.amount) },
          { label: 'Channel', value: tx.channel },
          { label: 'Date', value: formatDate(tx.createdAt) },
          tx.completedAt ? { label: 'Completed', value: formatDate(tx.completedAt) } : null,
        ].filter(Boolean).map((item: any) => (
          <div key={item.label} className="flex items-center justify-between py-1 border-b border-border last:border-0">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium capitalize text-right max-w-[200px]">{item.value}</span>
              {item.copy && (
                <button onClick={() => copy(item.value, item.label)} className="text-muted-foreground hover:text-foreground">
                  <Copy size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {tx.providerReference && (
        <div className="berry-card mt-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Provider Info</p>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Provider Ref</span>
            <span className="text-sm font-mono font-medium">{tx.providerReference}</span>
          </div>
        </div>
      )}
    </div>
  );
}
