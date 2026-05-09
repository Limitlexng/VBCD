'use client';

import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { formatCurrency, formatRelativeTime, getTransactionStatusColor, getTransactionIcon, cn } from '@/lib/utils';
import { ITransaction } from '@berry-x/types';

interface Props {
  limit?: number;
  userId?: string;
}

export default function TransactionList({ limit = 20 }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions', limit],
    queryFn: async () => {
      const { data } = await api.get(`/transactions?limit=${limit}`);
      return data.data?.transactions || data.data || [];
    },
  });

  if (isLoading) return <TransactionListSkeleton />;
  if (error) return <p className="text-center text-muted-foreground text-sm py-4">Failed to load transactions</p>;
  if (!data?.length) return <EmptyTransactions />;

  return (
    <div className="space-y-1">
      <AnimatePresence>
        {data.map((tx: ITransaction, i: number) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <TransactionItem tx={tx} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function TransactionItem({ tx }: { tx: ITransaction }) {
  const isCredit = ['wallet_funding', 'reversal', 'referral_bonus', 'cashback'].includes(tx.type);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-lg">
        {getTransactionIcon(tx.type)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
        <p className="text-xs text-muted-foreground">{formatRelativeTime(tx.createdAt)}</p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className={cn('text-sm font-semibold', isCredit ? 'text-green-600 dark:text-green-400' : 'text-foreground')}>
          {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
        </p>
        <span className={cn('text-xs capitalize px-1.5 py-0.5 rounded-full', getTransactionStatusColor(tx.status))}>
          {tx.status}
        </span>
      </div>
    </div>
  );
}

function TransactionListSkeleton() {
  return (
    <div className="space-y-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
          <div className="w-10 h-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-muted rounded w-2/3" />
            <div className="h-2.5 bg-muted rounded w-1/3" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 bg-muted rounded w-16" />
            <div className="h-2.5 bg-muted rounded w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyTransactions() {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-3 text-2xl">💸</div>
      <p className="font-medium text-foreground">No transactions yet</p>
      <p className="text-sm text-muted-foreground mt-1">Fund your wallet to get started</p>
    </div>
  );
}
