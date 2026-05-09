'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, ArrowLeftRight, TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign, Activity,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import axios from 'axios';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({ baseURL: API });

export default function DashboardPage() {
  const { data: summary } = useQuery({
    queryKey: ['admin-summary'],
    queryFn: async () => {
      const { data } = await api.get('/admin/dashboard');
      return data.data || data;
    },
  });

  const { data: revenueData } = useQuery({
    queryKey: ['revenue-analytics'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/transactions?days=14');
      return data.data || [];
    },
  });

  const { data: providers } = useQuery({
    queryKey: ['provider-health'],
    queryFn: async () => {
      const { data } = await api.get('/providers/health');
      return data.data || [];
    },
  });

  const stats = [
    { label: 'Total Users', value: formatNumber(summary?.totalUsers || 0), icon: Users, trend: '+12%', positive: true, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' },
    { label: 'Active 24h', value: formatNumber(summary?.activeUsers24h || 0), icon: Activity, trend: '+8%', positive: true, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' },
    { label: 'Revenue 24h', value: formatCurrency(summary?.totalRevenue24h || 0), icon: DollarSign, trend: '+22%', positive: true, color: 'bg-green-50 dark:bg-green-900/20 text-green-600' },
    { label: 'Failed Tx 24h', value: formatNumber(summary?.failedTransactions24h || 0), icon: AlertTriangle, trend: '-5%', positive: true, color: 'bg-red-50 dark:bg-red-900/20 text-red-600' },
    { label: 'Success Rate', value: `${summary?.successRate24h || 0}%`, icon: CheckCircle, trend: '+1.2%', positive: true, color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600' },
    { label: 'Volume 24h', value: formatCurrency(summary?.totalVolume24h || 0), icon: TrendingUp, trend: '+18%', positive: true, color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Operations Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time platform overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map(({ label, value, icon: Icon, trend, positive, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', color)}>
              <Icon size={16} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            <p className={cn('text-xs font-medium mt-1', positive ? 'text-green-600' : 'text-red-600')}>{trend}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Transaction Volume (14 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData || []}>
              <defs>
                <linearGradient id="volume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), 'Volume']} />
              <Area type="monotone" dataKey="volume" stroke="#16a34a" fill="url(#volume)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Provider health */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Provider Health</h3>
          <div className="space-y-3">
            {(providers || []).map((p: { provider: string; uptime: number; avgResponseTime: number; status: string }) => (
              <div key={p.provider} className="flex items-center gap-3">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', p.status === 'active' ? 'bg-green-500' : p.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500')} />
                <span className="text-sm font-medium capitalize flex-1">{p.provider}</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className={cn('font-medium', p.uptime > 95 ? 'text-green-600' : p.uptime > 80 ? 'text-yellow-600' : 'text-red-600')}>{p.uptime}%</span>
                  <span>{p.avgResponseTime}ms</span>
                </div>
              </div>
            ))}
            {(!providers || providers.length === 0) && (
              <p className="text-sm text-muted-foreground">Loading provider status...</p>
            )}
          </div>
        </div>
      </div>

      {/* Pending Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-yellow-500" />
            <h3 className="font-semibold">Pending KYC Reviews</h3>
            <span className="ml-auto bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">{summary?.pendingKyc || 0}</span>
          </div>
          <p className="text-sm text-muted-foreground">Review and approve KYC submissions</p>
          <a href="/kyc" className="inline-block mt-3 text-sm text-primary font-medium">Go to KYC →</a>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-orange-500" />
            <h3 className="font-semibold">Open Support Tickets</h3>
            <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full">{summary?.openTickets || 0}</span>
          </div>
          <p className="text-sm text-muted-foreground">Customer tickets awaiting response</p>
          <a href="/support" className="inline-block mt-3 text-sm text-primary font-medium">Go to Support →</a>
        </div>
      </div>
    </div>
  );
}
