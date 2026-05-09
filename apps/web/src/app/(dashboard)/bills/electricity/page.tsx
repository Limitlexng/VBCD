'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api, formatApiError } from '@/lib/api';
import { useWalletStore } from '@/stores/wallet.store';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const DISCOS = [
  { code: 'EKEDC', name: 'Eko Electric', area: 'Lagos' },
  { code: 'IKEDC', name: 'Ikeja Electric', area: 'Lagos' },
  { code: 'AEDC', name: 'Abuja Electric', area: 'Abuja' },
  { code: 'PHED', name: 'Port Harcourt Electric', area: 'Rivers' },
  { code: 'BEDC', name: 'Benin Electric', area: 'Edo' },
  { code: 'EEDC', name: 'Enugu Electric', area: 'Enugu' },
  { code: 'KEDCO', name: 'Kano Electric', area: 'Kano' },
  { code: 'IBEDC', name: 'Ibadan Electric', area: 'Oyo' },
];

type Step = 'form' | 'verify' | 'success';

export default function ElectricityPage() {
  const router = useRouter();
  const { activeWallet, fetchWallets } = useWalletStore();
  const [step, setStep] = useState<Step>('form');
  const [disco, setDisco] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [meterType, setMeterType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [amount, setAmount] = useState('');
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [token, setToken] = useState('');

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/bills/electricity/validate', { disco, meterNumber, meterType });
      return data.data;
    },
    onSuccess: (d) => { setCustomerInfo(d); setStep('verify'); },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/bills/electricity', { disco, meterNumber, meterType, amount: parseFloat(amount) });
      return data.data;
    },
    onSuccess: (d) => { setToken(d.token || ''); setStep('success'); fetchWallets(); },
    onError: (e) => toast.error(formatApiError(e)),
  });

  if (step === 'success') {
    return (
      <div className="px-4 py-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
          className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-4 text-4xl">⚡</motion.div>
        <h2 className="text-xl font-bold mb-1">Payment Successful!</h2>
        {token && (
          <div className="mt-3 p-4 bg-muted rounded-2xl">
            <p className="text-xs text-muted-foreground mb-1">Token</p>
            <p className="text-2xl font-mono font-bold tracking-widest">{token}</p>
          </div>
        )}
        <button onClick={() => router.push('/home')} className="berry-btn-primary mt-6">Done</button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 max-w-md">
      <button onClick={() => step === 'verify' ? setStep('form') : router.back()} className="flex items-center gap-2 text-muted-foreground mb-5 hover:text-foreground transition-colors">
        <ArrowLeft size={16} /><span className="text-sm">Back</span>
      </button>
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold mb-5">Electricity</motion.h1>

      {step === 'form' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Distribution Company</label>
            <select value={disco} onChange={(e) => setDisco(e.target.value)} className="berry-input">
              <option value="">Select DISCO</option>
              {DISCOS.map((d) => <option key={d.code} value={d.code}>{d.name} ({d.area})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Meter Type</label>
            <div className="flex gap-2">
              {(['prepaid', 'postpaid'] as const).map((t) => (
                <button key={t} onClick={() => setMeterType(t)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${meterType === t ? 'border-primary bg-primary/5 text-primary' : 'border-border'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Meter Number</label>
            <input value={meterNumber} onChange={(e) => setMeterNumber(e.target.value)} placeholder="0000000000" className="berry-input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Amount (NGN)</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Minimum ₦500" className="berry-input text-lg font-semibold" />
            {activeWallet && <p className="text-xs text-muted-foreground mt-1">Balance: {formatCurrency(Number(activeWallet.balance))}</p>}
          </div>
          <button onClick={() => disco && meterNumber && amount && verifyMutation.mutate()} disabled={!disco || !meterNumber || !amount || verifyMutation.isPending} className="berry-btn-primary w-full">
            {verifyMutation.isPending ? 'Verifying...' : 'Verify Meter'}
          </button>
        </div>
      )}

      {step === 'verify' && customerInfo && (
        <div className="space-y-4">
          <div className="berry-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Customer Details</p>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Name</span><span className="text-sm font-semibold">{customerInfo.customerName}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Address</span><span className="text-sm font-semibold text-right max-w-[60%]">{customerInfo.address}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Meter</span><span className="text-sm font-mono font-semibold">{meterNumber}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Amount</span><span className="text-sm font-bold text-primary">{formatCurrency(parseFloat(amount))}</span></div>
            </div>
          </div>
          <button onClick={() => payMutation.mutate()} disabled={payMutation.isPending} className="berry-btn-primary w-full">
            {payMutation.isPending ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      )}
    </div>
  );
}
