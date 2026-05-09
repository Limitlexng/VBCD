'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Search, ChevronLeft, ChevronRight,
  User, Settings, CreditCard, Lock, AlertTriangle,
} from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001/api/v1' });

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  user: <User size={13} />,
  feature_flag: <Settings size={13} />,
  transaction: <CreditCard size={13} />,
  kyc: <Shield size={13} />,
  auth: <Lock size={13} />,
};

const RISK_ACTIONS = ['DELETE', 'SUSPEND', 'UNSUSPEND', 'REJECT_KYC', 'DISABLE_FEATURE', 'APPROVE_WITHDRAWAL'];

function getActionColor(action: string): string {
  if (action.startsWith('CREATE')) return 'bg-green-100 text-green-700';
  if (action.startsWith('UPDATE') || action.startsWith('PATCH')) return 'bg-blue-100 text-blue-700';
  if (action.startsWith('DELETE') || action.includes('DISABLE')) return 'bg-red-100 text-red-700';
  if (RISK_ACTIONS.some((r) => action.includes(r))) return 'bg-orange-100 text-orange-700';
  return 'bg-gray-100 text-gray-600';
}

const RESOURCE_TYPES = ['ALL', 'user', 'feature_flag', 'transaction', 'kyc', 'provider', 'auth'];

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [resourceType, setResourceType] = useState('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, search, resourceType],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 25 };
      if (search) params.search = search;
      if (resourceType !== 'ALL') params.resourceType = resourceType;
      const { data } = await api.get('/admin/audit', { params });
      return data.data;
    },
  });

  const logs: AuditLog[] = data?.items || [];
  const total: number = data?.total || 0;
  const totalPages = Math.ceil(total / 25);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
          <Shield size={16} className="text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-muted-foreground">All admin actions are recorded here</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search actor, resource, action..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={resourceType}
          onChange={(e) => { setResourceType(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none"
        >
          {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t === 'ALL' ? 'All Resources' : t.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Log list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="px-5 py-3.5 flex gap-4 items-center">
              <div className="w-7 h-7 bg-muted animate-pulse rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-muted animate-pulse rounded w-1/3" />
                <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
              </div>
              <div className="h-3 bg-muted animate-pulse rounded w-24" />
            </div>
          ))
          : logs.map((log, i) => {
            const isExpanded = expanded === log.id;
            const isRisky = RISK_ACTIONS.some((r) => log.action.includes(r));
            return (
              <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : log.id)}
                  className={cn('w-full text-left px-5 py-3.5 flex items-start gap-3 hover:bg-muted/30 transition-colors', isRisky && 'bg-orange-50/50')}
                >
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', isRisky ? 'bg-orange-100 text-orange-600' : 'bg-muted text-muted-foreground')}>
                    {isRisky ? <AlertTriangle size={13} /> : (RESOURCE_ICONS[log.resourceType] || <Settings size={13} />)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', getActionColor(log.action))}>
                        {log.action}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">{log.resourceType.replace(/_/g, ' ')}</span>
                      {log.resourceId && <span className="text-xs font-mono text-muted-foreground">{log.resourceId.slice(0, 8)}…</span>}
                    </div>
                    <p className="text-sm mt-0.5">
                      <span className="font-medium">{log.actorEmail}</span>
                      <span className="text-muted-foreground"> · {log.actorRole}</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{log.ipAddress}</p>
                  </div>
                </button>

                {isExpanded && (log.oldValue || log.newValue) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-4 bg-muted/20"
                  >
                    <div className="grid grid-cols-2 gap-3 pt-3">
                      {log.oldValue && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">Before</p>
                          <pre className="text-xs bg-red-50 border border-red-100 rounded-lg p-3 overflow-auto max-h-32 text-red-800">
                            {JSON.stringify(log.oldValue, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.newValue && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">After</p>
                          <pre className="text-xs bg-green-50 border border-green-100 rounded-lg p-3 overflow-auto max-h-32 text-green-800">
                            {JSON.stringify(log.newValue, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">User Agent: {log.userAgent}</p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        {logs.length === 0 && !isLoading && (
          <div className="py-16 text-center text-muted-foreground text-sm">No audit logs found</div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{total.toLocaleString()} total entries</span>
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
    </div>
  );
}
