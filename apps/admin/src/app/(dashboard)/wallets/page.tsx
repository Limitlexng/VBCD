'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Wallet, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { IWallet, WalletCurrency } from '@berry-x/types';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001/api/v1' });

function formatAmount(amount: number, currency: WalletCurrency) {
  if (currency === WalletCurrency.NGN) {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount / 100);
  }
  return `${(amount / 1e8).toFixed(8)} ${currency}`;
}

const CURRENCY_COLORS: Record<WalletCurrency, string> = {
  [WalletCurrency.NGN]: 'bg-green-100 text-green-700',
  [WalletCurrency.USD]: 'bg-blue-100 text-blue-700',
  [WalletCurrency.BTC]: 'bg-orange-100 text-orange-700',
  [WalletCurrency.ETH]: 'bg-purple-100 text-purple-700',
  [WalletCurrency.USDT]: 'bg-teal-100 text-teal-700',
  [WalletCurrency.USDC]: 'bg-sky-100 text-sky-700',
};

export default function WalletsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [currency, setCurrency] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-wallets', page, search, currency],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (currency !== 'ALL') params.currency = currency;
      const { data } = await api.get('/admin/wallets', { params });
      return data.data;
    },
  });

  const wallets: (IWallet & { user?: { firstName: string; lastName: string; email: string } })[] = data?.items || [];
  const total: number = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const { data: statsData } = useQuery({
    queryKey: ['admin-wallet-stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/wallets/stats');
      return data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wallets</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Platform wallet overview and user balances</p>
      </div>

      {/* Aggregate stats */}
      {statsData && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.values(WalletCurrency).map((cur) => {
            const stat = statsData[cur];
            return (
              <div key={cur} className="bg-card border border-border rounded-xl p-4">
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', CURRENCY_COLORS[cur])}>{cur}</span>
                <p className="text-lg font-bold mt-2 tabular-nums">
                  {stat ? formatAmount(stat.totalBalance, cur) : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat?.count || 0} wallets</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search user, wallet ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={currency}
          onChange={(e) => { setCurrency(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ALL">All Currencies</option>
          {Object.values(WalletCurrency).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Currency</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Available</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Locked</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Virtual Account</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td>
                  ))}
                </tr>
              ))
              : wallets.map((wallet, i) => (
                <motion.tr
                  key={wallet.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wallet size={12} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{wallet.user?.firstName} {wallet.user?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{wallet.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', CURRENCY_COLORS[wallet.currency])}>
                      {wallet.currency}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatAmount(wallet.availableBalance, wallet.currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                    {wallet.lockedBalance > 0
                      ? <span className="text-yellow-600">{formatAmount(wallet.lockedBalance, wallet.currency)}</span>
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                    {(wallet as any).virtualAccountNumber || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {wallet.updatedAt ? new Date(wallet.updatedAt).toLocaleDateString('en-NG') : '—'}
                  </td>
                </motion.tr>
              ))}
          </tbody>
        </table>
        {wallets.length === 0 && !isLoading && (
          <div className="py-16 text-center text-muted-foreground text-sm">No wallets found</div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Page {page} of {totalPages || 1} · {total.toLocaleString()} wallets</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
