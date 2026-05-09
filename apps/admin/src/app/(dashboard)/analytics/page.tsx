'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Users, ArrowUpRight, DollarSign, Activity } from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001/api/v1' });

function formatNGN(kobo: number) {
  if (kobo >= 100_000_000_00) return `₦${(kobo / 100_000_000_00).toFixed(1)}B`;
  if (kobo >= 100_000_00) return `₦${(kobo / 100_000_00).toFixed(1)}M`;
  if (kobo >= 100_000) return `₦${(kobo / 100_000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(kobo / 100);
}

const RANGES = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '3M', value: '3m' },
  { label: '1Y', value: '1y' },
];

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsPage() {
  const [range, setRange] = useState('30d');

  const { data: overview } = useQuery({
    queryKey: ['analytics-overview', range],
    queryFn: async () => {
      const { data } = await api.get('/admin/analytics/overview', { params: { range } });
      return data.data;
    },
  });

  const { data: volumeChart } = useQuery({
    queryKey: ['analytics-volume', range],
    queryFn: async () => {
      const { data } = await api.get('/admin/analytics/volume', { params: { range } });
      return data.data;
    },
  });

  const { data: txByType } = useQuery({
    queryKey: ['analytics-by-type', range],
    queryFn: async () => {
      const { data } = await api.get('/admin/analytics/by-type', { params: { range } });
      return data.data;
    },
  });

  const { data: userGrowth } = useQuery({
    queryKey: ['analytics-users', range],
    queryFn: async () => {
      const { data } = await api.get('/admin/analytics/user-growth', { params: { range } });
      return data.data;
    },
  });

  const statCards = [
    {
      label: 'Total Volume',
      value: overview ? formatNGN(overview.totalVolume) : '—',
      change: overview?.volumeChange,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Transactions',
      value: overview ? overview.totalTransactions.toLocaleString() : '—',
      change: overview?.txChange,
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'New Users',
      value: overview ? overview.newUsers.toLocaleString() : '—',
      change: overview?.userChange,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      label: 'Revenue (Fees)',
      value: overview ? formatNGN(overview.totalFees) : '—',
      change: overview?.feeChange,
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Platform performance and growth metrics</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                range === r.value ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', card.bg)}>
                <card.icon size={15} className={card.color} />
              </div>
            </div>
            <p className="text-2xl font-bold tabular-nums">{card.value}</p>
            {card.change !== undefined && (
              <div className={cn('flex items-center gap-1 mt-1.5 text-xs font-medium', card.change >= 0 ? 'text-green-600' : 'text-red-500')}>
                {card.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {Math.abs(card.change).toFixed(1)}% vs previous period
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Volume Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4">Transaction Volume</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={volumeChart || []}>
            <defs>
              <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <YAxis tickFormatter={(v) => formatNGN(v)} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: number) => [formatNGN(value), 'Volume']}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
            />
            <Area type="monotone" dataKey="volume" stroke="#22c55e" fill="url(#volGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Growth */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={userGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
              />
              <Bar dataKey="newUsers" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Transactions by Type */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Volume by Type</h3>
          {txByType?.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={txByType} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="volume" nameKey="type" paddingAngle={2}>
                    {txByType.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatNGN(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {txByType.slice(0, 6).map((item: any, i: number) => (
                  <div key={item.type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="capitalize text-muted-foreground">{item.type.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="font-medium">{formatNGN(item.volume)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              No data for this period
            </div>
          )}
        </div>
      </div>

      {/* Top Users by Volume */}
      {overview?.topUsers?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Top Users by Volume</h3>
          <div className="space-y-2">
            {overview.topUsers.map((user: any, i: number) => (
              <div key={user.id} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatNGN(user.totalVolume)}</p>
                  <p className="text-xs text-muted-foreground">{user.txCount} transactions</p>
                </div>
                <ArrowUpRight size={14} className="text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
