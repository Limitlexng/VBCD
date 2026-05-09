'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, ToggleLeft, ToggleRight, Wrench, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { IProvider, ProviderStatus } from '@berry-x/types';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001/api/v1' });

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  active: { color: 'bg-green-100 text-green-700', label: 'Active' },
  inactive: { color: 'bg-gray-100 text-gray-600', label: 'Inactive' },
  maintenance: { color: 'bg-yellow-100 text-yellow-700', label: 'Maintenance' },
  degraded: { color: 'bg-orange-100 text-orange-700', label: 'Degraded' },
};

export default function ProvidersPage() {
  const qc = useQueryClient();

  const { data: providers, isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const { data } = await api.get('/providers');
      return data.data || [];
    },
  });

  const { data: health } = useQuery({
    queryKey: ['provider-health'],
    queryFn: async () => {
      const { data } = await api.get('/providers/health');
      return data.data || [];
    },
    refetchInterval: 30000,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.patch(`/providers/${id}/toggle`, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['providers'] }),
  });

  const healthCheckMutation = useMutation({
    mutationFn: (id: string) => api.post(`/providers/${id}/health-check`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['provider-health'] }),
  });

  const healthMap = new Map((health || []).map((h: { provider: string; uptime: number; avgResponseTime: number }) => [h.provider, h]));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Providers</h1>
          <p className="text-muted-foreground text-sm">Manage provider routing and configuration</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm bg-card border border-border rounded-lg hover:bg-muted transition-colors">
          <RefreshCw size={14} /> Refresh Health
        </button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)
        ) : (
          (providers || []).map((provider: IProvider, i: number) => {
            const h = healthMap.get(provider.name) as { uptime: number; avgResponseTime: number } | undefined;
            const statusConf = STATUS_CONFIG[provider.status] || STATUS_CONFIG.inactive;
            return (
              <motion.div key={provider.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold capitalize">{provider.displayName || provider.name}</h3>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusConf.color)}>
                        {statusConf.label}
                      </span>
                      {provider.isSandbox && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Sandbox</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Priority: {provider.priority}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => healthCheckMutation.mutate(provider.id)}
                      className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                      title="Run health check"
                    >
                      <Activity size={14} className="text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => toggleMutation.mutate({ id: provider.id, enabled: !provider.isEnabled })}
                      title={provider.isEnabled ? 'Disable' : 'Enable'}
                    >
                      {provider.isEnabled ? (
                        <ToggleRight size={28} className="text-primary" />
                      ) : (
                        <ToggleLeft size={28} className="text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Uptime', value: h ? `${h.uptime}%` : '--', good: !h || h.uptime > 95 },
                    { label: 'Avg Response', value: h ? `${h.avgResponseTime}ms` : '--', good: !h || h.avgResponseTime < 1000 },
                    { label: 'Success Rate', value: `${provider.successRate ?? 100}%`, good: provider.successRate > 95 },
                  ].map(({ label, value, good }) => (
                    <div key={label} className="bg-muted/50 rounded-lg px-3 py-2">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={cn('text-sm font-bold mt-0.5', good ? 'text-foreground' : 'text-red-600')}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Services */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {provider.supportedServices?.map((svc) => (
                    <span key={svc} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">
                      {svc.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>

                {provider.maintenanceMessage && (
                  <div className="mt-3 flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-3 py-2">
                    <Wrench size={14} className="mt-0.5 flex-shrink-0" />
                    {provider.maintenanceMessage}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
