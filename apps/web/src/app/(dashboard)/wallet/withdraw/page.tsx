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

type Step = 'form' | 'pin' | 'success';

export default function WithdrawPage() {
  const router = useRouter();
  const { activeWallet, fetchWallets } = useWalletStore();
  const [step, setStep] = useState<Step>('form');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');

  const { data: banks } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const { data } = await api.get('/banks');
      return data.data || [];
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/banks/verify', { bankCode, accountNumber });
      return data.data;
    },
    onSuccess: (d) => setResolvedName(d.accountName),
    onError: (e) => toast.error(formatApiError(e)),
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/wallets/withdraw', { bankCode, accountNumber, amount: parseFloat(amount), pin });
      return data.data;
    },
    onSuccess: () => { setStep('success'); fetchWallets(); },
    onError: (e) => { toast.error(formatApiError(e)); setPin(''); },
  });

  if (step === 'success') {
    return (
      <div className="px-4 py-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
          className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 text-4xl">
          ✅
        </motion.div>
        <h2 className="text-xl font-bold mb-1">Withdrawal Initiated!</h2>
        <p className="text-muted-foreground text-sm mb-2">{formatCurrency(parseFloat(amount))} is being processed</p>
        <button onClick={() => router.push('/home')} className="berry-btn-primary mt-6">Back to Home</button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 max-w-md">
      <button onClick={() => step === 'pin' ? setStep('form') : router.back()} className="flex items-center gap-2 text-muted-foreground mb-5 hover:text-foreground transition-colors">
        <ArrowLeft size={16} />
        <span className="text-sm">Back</span>
      </button>
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold mb-5">Withdraw Funds</motion.h1>

      {step === 'form' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Bank</label>
            <select value={bankCode} onChange={(e) => { setBankCode(e.target.value); setResolvedName(''); }} className="berry-input">
              <option value="">Select bank</option>
              {banks?.map((b: any) => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Account Number</label>
            <div className="flex gap-2">
              <input value={accountNumber} onChange={(e) => { setAccountNumber(e.target.value.slice(0, 10)); setResolvedName(''); }}
                placeholder="0000000000" className="berry-input flex-1" maxLength={10} />
              <button onClick={() => bankCode && accountNumber.length === 10 && verifyMutation.mutate()}
                disabled={verifyMutation.isPending || accountNumber.length < 10}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                {verifyMutation.isPending ? '...' : 'Verify'}
              </button>
            </div>
            {resolvedName && <p className="text-xs text-green-600 font-medium mt-1">✓ {resolvedName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Amount (NGN)</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="0.00" className="berry-input text-lg font-semibold" />
            {activeWallet && <p className="text-xs text-muted-foreground mt-1">Balance: {formatCurrency(Number(activeWallet.balance))}</p>}
          </div>
          <button
            onClick={() => resolvedName && amount && parseFloat(amount) > 0 && setStep('pin')}
            disabled={!resolvedName || !amount}
            className="berry-btn-primary w-full"
          >
            Continue
          </button>
        </div>
      )}

      {step === 'pin' && (
        <div className="space-y-6">
          <div className="text-center">
            <p className="font-semibold">Confirm Withdrawal</p>
            <p className="text-muted-foreground text-sm">{formatCurrency(parseFloat(amount))} → {resolvedName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-center">Transaction PIN</label>
            <input value={pin} onChange={(e) => setPin(e.target.value.slice(0, 4))}
              type="password" inputMode="numeric" placeholder="••••" maxLength={4}
              className="berry-input text-center text-2xl tracking-widest" />
          </div>
          <button onClick={() => pin.length === 4 && withdrawMutation.mutate()}
            disabled={pin.length < 4 || withdrawMutation.isPending}
            className="berry-btn-primary w-full">
            {withdrawMutation.isPending ? 'Processing...' : 'Withdraw'}
          </button>
        </div>
      )}
    </div>
  );
}
