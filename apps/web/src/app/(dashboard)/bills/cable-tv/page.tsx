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

const PROVIDERS = [
  { code: 'DSTV', name: 'DStv', color: 'bg-blue-600' },
  { code: 'GOTV', name: 'GOtv', color: 'bg-orange-500' },
  { code: 'STARTIMES', name: 'Startimes', color: 'bg-red-600' },
  { code: 'SHOWMAX', name: 'Showmax', color: 'bg-purple-600' },
];

type Step = 'form' | 'verify' | 'success';

export default function CableTvPage() {
  const router = useRouter();
  const { activeWallet, fetchWallets } = useWalletStore();
  const [step, setStep] = useState<Step>('form');
  const [provider, setProvider] = useState('');
  const [smartCardNo, setSmartCardNo] = useState('');
  const [planCode, setPlanCode] = useState('');
  const [customerInfo, setCustomerInfo] = useState<any>(null);

  const { data: plans } = useQuery({
    queryKey: ['cable-plans', provider],
    enabled: !!provider,
    queryFn: async () => {
      const { data } = await api.get(`/bills/cable-tv/plans?provider=${provider}`);
      return data.data || [];
    },
  });

  const selectedPlan = plans?.find((p: any) => p.code === planCode);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/bills/cable-tv/validate', { provider, smartCardNo });
      return data.data;
    },
    onSuccess: (d) => { setCustomerInfo(d); setStep('verify'); },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/bills/cable-tv', { provider, smartCardNo, planCode });
      return data.data;
    },
    onSuccess: () => { setStep('success'); fetchWallets(); },
    onError: (e) => toast.error(formatApiError(e)),
  });

  if (step === 'success') {
    return (
      <div className="px-4 py-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
          className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 text-4xl">📺</motion.div>
        <h2 className="text-xl font-bold mb-1">Subscription Renewed!</h2>
        <p className="text-muted-foreground text-sm">{selectedPlan?.name} for {customerInfo?.customerName}</p>
        <button onClick={() => router.push('/home')} className="berry-btn-primary mt-6">Done</button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 max-w-md">
      <button onClick={() => step === 'verify' ? setStep('form') : router.back()} className="flex items-center gap-2 text-muted-foreground mb-5 hover:text-foreground transition-colors">
        <ArrowLeft size={16} /><span className="text-sm">Back</span>
      </button>
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold mb-5">Cable TV</motion.h1>

      {step === 'form' && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map((p) => (
                <button key={p.code} onClick={() => { setProvider(p.code); setPlanCode(''); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${provider === p.code ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <div className={`w-7 h-7 rounded-lg ${p.color}`} />
                  <span className="text-sm font-semibold">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Smart Card / IUC Number</label>
            <input value={smartCardNo} onChange={(e) => setSmartCardNo(e.target.value)} placeholder="0000000000" className="berry-input" />
          </div>
          {provider && plans && (
            <div>
              <label className="block text-sm font-medium mb-2">Select Plan</label>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {plans.map((plan: any) => (
                  <button key={plan.code} onClick={() => setPlanCode(plan.code)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${planCode === plan.code ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div>
                      <p className="text-sm font-semibold">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">{plan.duration}</p>
                    </div>
                    <p className="text-sm font-bold text-primary">{formatCurrency(plan.price)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          {activeWallet && <p className="text-xs text-muted-foreground">Balance: {formatCurrency(Number(activeWallet.balance))}</p>}
          <button onClick={() => provider && smartCardNo && planCode && verifyMutation.mutate()} disabled={!provider || !smartCardNo || !planCode || verifyMutation.isPending} className="berry-btn-primary w-full">
            {verifyMutation.isPending ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      )}

      {step === 'verify' && customerInfo && (
        <div className="space-y-4">
          <div className="berry-card space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Confirm Details</p>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Customer</span><span className="text-sm font-semibold">{customerInfo.customerName}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Plan</span><span className="text-sm font-semibold">{selectedPlan?.name}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Amount</span><span className="text-sm font-bold text-primary">{formatCurrency(selectedPlan?.price || 0)}</span></div>
          </div>
          <button onClick={() => payMutation.mutate()} disabled={payMutation.isPending} className="berry-btn-primary w-full">
            {payMutation.isPending ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      )}
    </div>
  );
}
