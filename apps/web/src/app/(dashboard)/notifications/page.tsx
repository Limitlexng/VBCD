'use client';

import { motion } from 'framer-motion';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatRelativeTime, cn } from '@/lib/utils';
import { INotification } from '@berry-x/types';

const TYPE_META: Record<string, { icon: React.ReactNode; bg: string }> = {
  info: { icon: <Info size={14} className="text-blue-500" />, bg: 'bg-blue-100 dark:bg-blue-900/30' },
  success: { icon: <CheckCircle size={14} className="text-green-500" />, bg: 'bg-green-100 dark:bg-green-900/30' },
  warning: { icon: <AlertTriangle size={14} className="text-yellow-500" />, bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  error: { icon: <XCircle size={14} className="text-red-500" />, bg: 'bg-red-100 dark:bg-red-900/30' },
  transaction: { icon: <Bell size={14} className="text-primary" />, bg: 'bg-primary/10' },
};

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data: notifications, isLoading } = useQuery<INotification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications?limit=50');
      return data.data?.notifications || data.data || [];
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = notifications?.filter((n) => !n.isRead).length || 0;

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-xl font-bold">Notifications</h1>
          {unread > 0 && <p className="text-xs text-muted-foreground">{unread} unread</p>}
        </motion.div>
        {unread > 0 && (
          <button onClick={() => markAllMutation.mutate()} className="flex items-center gap-1.5 text-xs text-primary font-medium">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : !notifications?.length ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-3 text-2xl">🔔</div>
          <p className="font-medium">No notifications yet</p>
          <p className="text-sm text-muted-foreground mt-1">We'll notify you about important updates</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n: INotification, i) => {
            const meta = TYPE_META[n.type] || TYPE_META.info;
            return (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => !n.isRead && markOneMutation.mutate(n.id)}
                className={cn('w-full flex items-start gap-3 p-3.5 rounded-xl transition-colors text-left', !n.isRead ? 'bg-muted/60 hover:bg-muted' : 'hover:bg-muted/30')}
              >
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', meta.bg)}>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm font-medium leading-snug', !n.isRead && 'font-semibold')}>{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(n.createdAt)}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
