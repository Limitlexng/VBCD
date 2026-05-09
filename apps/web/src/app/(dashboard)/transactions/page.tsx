'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, getTransactionStatusColor, getTransactionIcon, cn } from '@/lib/utils';
import { ITransaction, TransactionStatus, TransactionType } from '@berry-x/types';

const STATUS_FILTERS = ['All', 'Success', 'Pending', 'Failed', 'Reversed'];

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', 'all', activeFilter],
    queryFn: async () => {
      const status = activeFilter === 'All' ? '' : `&status=${activeFilter.toLowerCase()}`;
      const { data } = await api.get(`/transactions?limit=50${status}`);
      return data.data?.transactions || [];
    },
  });

  const filtered = (data || []).filter((tx: ITransaction) =>
    search ? tx.description.toLowerCase().includes(search.toLowerCase()) || tx.reference.includes(search) : true,
  );

  return (
    <div className="px-4 py-4">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold mb-4">
        Transactions
      </motion.h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="berry-input pl-10"
          placeholder="Search transactions..."
        />
      </div>

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
              activeFilter === filter
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-medium">No transactions found</p>
          <p className="text-muted-foreground text-sm mt-1">Try a different filter or search term</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((tx: ITransaction, i: number) => {
            const isCredit = ['wallet_funding', 'reversal', 'referral_bonus'].includes(tx.type);
            return (
              <motion.div key={tx.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <div className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border">
                  <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-xl">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)} · Ref: {tx.reference}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-bold', isCredit ? 'text-green-600 dark:text-green-400' : 'text-foreground')}>
                      {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <span className={cn('text-[10px] uppercase font-medium px-1.5 py-0.5 rounded-full', getTransactionStatusColor(tx.status))}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
