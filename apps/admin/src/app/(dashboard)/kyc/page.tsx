'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import axios from 'axios';
import { formatDate, cn } from '@/lib/utils';
import { IKycRecord, KycStatus } from '@berry-x/types';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001/api/v1' });

export default function KycPage() {
  const [selected, setSelected] = useState<IKycRecord | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pending-kyc'],
    queryFn: async () => {
      const { data } = await api.get('/kyc/pending?limit=50');
      return data.data || {};
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, approved, notes }: { id: string; approved: boolean; notes?: string }) =>
      api.patch(`/kyc/${id}/review`, { approved, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-kyc'] });
      setSelected(null);
      setRejectNote('');
    },
  });

  const records: IKycRecord[] = data?.records || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">KYC Review</h1>
          <p className="text-muted-foreground text-sm">{data?.total || 0} pending reviews</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-lg">
          <Clock size={14} />
          {data?.total || 0} awaiting review
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <CheckCircle size={40} className="text-green-500 mb-3" />
          <h3 className="font-bold text-lg">All caught up!</h3>
          <p className="text-muted-foreground text-sm mt-1">No pending KYC submissions</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {['User', 'Tier', 'Documents', 'Submitted', 'Status', 'Actions'].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{record.userId?.slice(0, 8)}...</td>
                  <td className="px-4 py-3"><span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Tier {record.tier}</span></td>
                  <td className="px-4 py-3 text-sm">{record.documents?.length || 0} documents</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{record.submittedAt ? formatDate(record.submittedAt) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', {
                      'bg-yellow-100 text-yellow-700': record.status === KycStatus.PENDING,
                      'bg-green-100 text-green-700': record.status === KycStatus.APPROVED,
                      'bg-red-100 text-red-700': record.status === KycStatus.REJECTED,
                    })}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(record)} className="p-1.5 rounded-lg hover:bg-muted"><Eye size={13} className="text-muted-foreground" /></button>
                      <button onClick={() => reviewMutation.mutate({ id: record.id, approved: true })} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600"><CheckCircle size={13} /></button>
                      <button onClick={() => { setSelected(record); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><XCircle size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-bold text-lg mb-4">Review KYC — Tier {selected.tier}</h2>
            <div className="space-y-3 mb-4">
              <p className="text-sm"><span className="font-medium">User:</span> {selected.userId}</p>
              <p className="text-sm"><span className="font-medium">Status:</span> {selected.status}</p>
              <p className="text-sm"><span className="font-medium">Documents:</span> {selected.documents?.length || 0}</p>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium mb-1.5 block">Notes (required for rejection)</label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                className="w-full border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring h-20 resize-none"
                placeholder="Add review notes..."
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={() => reviewMutation.mutate({ id: selected.id, approved: false, notes: rejectNote })} className="flex-1 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium">Reject</button>
              <button onClick={() => reviewMutation.mutate({ id: selected.id, approved: true, notes: rejectNote })} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium">Approve</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
