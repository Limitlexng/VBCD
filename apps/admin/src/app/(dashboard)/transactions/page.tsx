'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownLeft, ArrowUpRight, RefreshCw, Search,
  ChevronLeft, ChevronRight, Eye, Clock, CheckCircle2, XCircle,
} from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { ITransaction, TransactionStatus, TransactionType } from '@berry-x/types';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001/api/v1' });

const STATUS_STYLES: Record<TransactionStatus, string> = {
  [TransactionStatus.PENDING]: 'bg-yellow-100 text-yellow-700',
  [TransactionStatus.PROCESSING]: 'bg-blue-100 text-blue-700',
  [TransactionStatus.SUCCESS]: 'bg-green-100 text-green-700',
  [TransactionStatus.FAILED]: 'bg-red-100 text-red-700',
  [TransactionStatus.REVERSED]: 'bg-orange-100 text-orange-700',
  [TransactionStatus.REFUNDED]: 'bg-purple-100 text-purple-700',
  [TransactionStatus.CANCELLED]: 'bg-gray-100 text-gray-600',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  [TransactionStatus.PENDING]: <Clock size={10} />,
  [TransactionStatus.PROCESSING]: <RefreshCw size={10} className="animate-spin" />,
  [TransactionStatus.SUCCESS]: <CheckCircle2 size={10} />,
  [TransactionStatus.FAILED]: <XCircle size={10} />,
};

function formatNGN(kobo: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(kobo / 100);
}

const STATUSES = ['ALL', ...Object.values(TransactionStatus)];
const TYPES = ['ALL', ...Object.values(TransactionType)];

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [selected, setSelected] = useState<ITransaction | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-transactions', page, search, status, type],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (status !== 'ALL') params.status = status;
      if (type !== 'ALL') params.type = type;
      const { data } = await api.get('/admin/transactions', { params });
      return data.data;
    },
  });

  const transactions: ITransaction[] = data?.items || [];
  const total: number = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total.toLocaleString()} total transactions</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search reference, user..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Reference</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td>
                  ))}
                </tr>
              ))
              : transactions.map((tx, i) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.reference}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{(tx as any).user?.firstName} {(tx as any).user?.lastName}</span>
                    <p className="text-xs text-muted-foreground">{(tx as any).user?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {tx.type.includes('credit') || tx.type === 'wallet_funding' || tx.type === 'virtual_account_credit'
                        ? <ArrowDownLeft size={12} className="text-green-600" />
                        : <ArrowUpRight size={12} className="text-red-500" />
                      }
                      <span className="capitalize">{tx.type.replace(/_/g, ' ')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatNGN(tx.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', STATUS_STYLES[tx.status])}>
                      {STATUS_ICONS[tx.status]}
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(tx)} className="p-1.5 hover:bg-muted rounded transition-colors">
                      <Eye size={14} className="text-muted-foreground" />
                    </button>
                  </td>
                </motion.tr>
              ))}
          </tbody>
        </table>

        {transactions.length === 0 && !isLoading && (
          <div className="py-16 text-center text-muted-foreground text-sm">No transactions found</div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 py-1 bg-card border border-border rounded text-sm">{page} / {totalPages || 1}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4">Transaction Detail</h2>
            <dl className="space-y-3">
              {[
                ['Reference', selected.reference],
                ['Amount', formatNGN(selected.amount)],
                ['Fee', formatNGN(selected.fee || 0)],
                ['Type', selected.type.replace(/_/g, ' ')],
                ['Status', selected.status],
                ['Provider', (selected as any).provider || '—'],
                ['Provider Ref', (selected as any).providerReference || '—'],
                ['Description', selected.description || '—'],
                ['Created', new Date(selected.createdAt).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between gap-4">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="text-sm font-medium text-right break-all">{value}</dd>
                </div>
              ))}
            </dl>
            <button
              onClick={() => setSelected(null)}
              className="mt-5 w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
