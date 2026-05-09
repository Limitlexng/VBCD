'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, formatApiError } from '@/lib/api';
import { useWalletStore } from '@/stores/wallet.store';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const NETWORKS = [
  { code: 'MTN', name: 'MTN', color: 'bg-yellow-400' },
  { code: 'AIRTEL', name: 'Airtel', color: 'bg-red-500' },
  { code: 'GLO', name: 'Glo', color: 'bg-green-600' },
  { code: '9MOBILE', name: '9mobile', color: 'bg-teal-600' },
];

export default function DataPage() {
  const router = useRouter();
  const { activeWallet, fetchWallets } = useWalletStore();
  const [network, setNetwork] = useState('');
  const [phone, setPhone] = useState('');
  const [planCode, setPlanCode] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: plans } = useQuery({
    queryKey: ['data-plans', network],
    enabled: !!network,
    queryFn: async () => {
      const { data } = await api.get(`/bills/data/plans?network=${network}`);
      return data.data || [];
    },
  });

  const selectedPlan = plans?.find((p: any) => p.code === planCode);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/bills/data', { network, phone, planCode });
      return data.data;
    },
    onSuccess: () => { setSuccess(true); fetchWallets(); },
    onError: (e) => toast.error(formatApiError(e)),
  });

  if (success) {
    return (
      <div className="px-4 py-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
          className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-4xl">📶</motion.div>
        <h2 className="text-xl font-bold mb-1">Data Purchased!</h2>
        <p className="text-muted-foreground text-sm">{selectedPlan?.name} sent to {phone}</p>
        <div className="flex gap-3 mt-6">
          <button onClick={() => { setSuccess(false); setPhone(''); setPlanCode(''); }} className="py-3 px-6 rounded-xl border border-border text-sm font-semibold">Buy Again</button>
          <button onClick={() => router.push('/home')} className="berry-btn-primary">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 max-w-md">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground mb-5 hover:text-foreground transition-colors">
        <ArrowLeft size={16} /><span className="text-sm">Back</span>
      </button>
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold mb-5">Buy Data</motion.h1>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Network</label>
          <div className="grid grid-cols-4 gap-2">
            {NETWORKS.map((n) => (
              <button key={n.code} onClick={() => { setNetwork(n.code); setPlanCode(''); }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${network === n.code ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <div className={`w-8 h-8 rounded-full ${n.color}`} />
                <span className="text-xs font-medium">{n.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Phone Number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="08012345678" className="berry-input" />
        </div>

        {network && (
          <div>
            <label className="block text-sm font-medium mb-2">Select Plan</label>
            {!plans ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {plans.map((plan: any) => (
                  <button key={plan.code} onClick={() => setPlanCode(plan.code)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${planCode === plan.code ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div>
                      <p className="text-sm font-semibold">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">{plan.validity}</p>
                    </div>
                    <p className="text-sm font-bold text-primary">{formatCurrency(plan.price)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeWallet && <p className="text-xs text-muted-foreground">Balance: {formatCurrency(Number(activeWallet.balance))}</p>}

        <button onClick={() => mutation.mutate()} disabled={!network || !phone || !planCode || mutation.isPending} className="berry-btn-primary w-full">
          {mutation.isPending ? 'Processing...' : `Buy Data${selectedPlan ? ` · ${formatCurrency(selectedPlan.price)}` : ''}`}
        </button>
      </div>
    </div>
  );
}
