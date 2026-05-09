'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, UserX, UserCheck, Eye, Filter } from 'lucide-react';
import axios from 'axios';
import { formatDate, cn } from '@/lib/utils';
import { IUser, UserStatus, UserTier } from '@berry-x/types';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001/api/v1' });

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  pending_verification: 'bg-yellow-100 text-yellow-700',
  banned: 'bg-gray-100 text-gray-700',
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const { data } = await api.get(`/admin/users?${params}`);
      return data.data || data;
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/admin/users/${id}/suspend`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users: IUser[] = data?.users || [];
  const total: number = data?.total || 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground text-sm">{total.toLocaleString()} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search by name, email, phone..."
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All statuses</option>
          {Object.values(UserStatus).map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              {['User', 'Phone', 'Status', 'Tier', 'Joined', 'Actions'].map((col) => (
                <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
              ))
            ) : users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                      {user.firstName?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{user.phone}</td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', STATUS_COLORS[user.status] || 'bg-gray-100 text-gray-700')}>
                    {user.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">Tier {user.tier}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(user.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="View">
                      <Eye size={13} className="text-muted-foreground" />
                    </button>
                    {user.status === UserStatus.ACTIVE ? (
                      <button
                        onClick={() => suspendMutation.mutate({ id: user.id, reason: 'Admin action' })}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Suspend"
                      >
                        <UserX size={13} className="text-red-500" />
                      </button>
                    ) : (
                      <button className="p-1.5 rounded-lg hover:bg-green-50 transition-colors" title="Unsuspend">
                        <UserCheck size={13} className="text-green-500" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total.toLocaleString()}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-50">Previous</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total} className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
