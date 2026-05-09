'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Search, Star, ChevronRight } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, formatApiError } from '@/lib/api';
import { useWalletStore } from '@/stores/wallet.store';
import { cn, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

type Step = 'search' | 'amount' | 'pin' | 'success';

export default function TransfersPage() {
  const router = useRouter();
  const { activeWallet, fetchWallets } = useWalletStore();
  const [step, setStep] = useState<Step>('search');
  const [recipient, setRecipient] = useState('');
  const [resolvedUser, setResolvedUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pin, setPin] = useState('');

  const { data: beneficiaries } = useQuery({
    queryKey: ['beneficiaries'],
    queryFn: async () => {
      const { data } = await api.get('/wallets/beneficiaries');
      return data.data || [];
    },
  });

  const lookupMutation = useMutation({
    mutationFn: async (tag: string) => {
      const { data } = await api.get(`/wallets/lookup?tag=${tag}`);
      return data.data;
    },
    onSuccess: (data) => { setResolvedUser(data); setStep('amount'); },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const transferMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/wallets/transfer', {
        recipientTag: resolvedUser.walletTag,
        amount: parseFloat(amount),
        pin,
        note,
      });
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
        <h2 className="text-xl font-bold mb-1">Transfer Successful!</h2>
        <p className="text-muted-foreground text-sm mb-2">
          {formatCurrency(parseFloat(amount))} sent to {resolvedUser?.firstName}
        </p>
        <button onClick={() => router.push('/home')} className="berry-btn-primary mt-6">Back to Home</button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 max-w-md">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold mb-5">
        Send Money
      </motion.h1>

      {step === 'search' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter tag, phone or email"
              className="berry-input pl-10"
              onKeyDown={(e) => e.key === 'Enter' && recipient && lookupMutation.mutate(recipient)}
            />
          </div>
          <button
            onClick={() => recipient && lookupMutation.mutate(recipient)}
            disabled={!recipient || lookupMutation.isPending}
            className="berry-btn-primary w-full"
          >
            {lookupMutation.isPending ? 'Looking up...' : 'Find Recipient'}
          </button>

          {beneficiaries?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Recent</p>
              <div className="berry-card p-0 divide-y divide-border overflow-hidden">
                {beneficiaries.slice(0, 5).map((b: any) => (
                  <button key={b.id} onClick={() => { setResolvedUser(b); setStep('amount'); }}
                    className="flex items-center gap-3 px-4 py-3 w-full hover:bg-muted/50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">{b.name?.[0]}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.walletTag}</p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'amount' && resolvedUser && (
        <div className="space-y-4">
          <div className="berry-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold">{resolvedUser.firstName?.[0]}</span>
            </div>
            <div>
              <p className="font-semibold">{resolvedUser.firstName} {resolvedUser.lastName}</p>
              <p className="text-xs text-muted-foreground">{resolvedUser.walletTag || resolvedUser.tag}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Amount (NGN)</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="0.00" className="berry-input text-lg font-semibold" />
            {activeWallet && <p className="text-xs text-muted-foreground mt-1">Balance: {formatCurrency(Number(activeWallet.balance))}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's this for?" className="berry-input" />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('search')} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold">Back</button>
            <button onClick={() => amount && parseFloat(amount) > 0 && setStep('pin')} className="flex-1 berry-btn-primary">Continue</button>
          </div>
        </div>
      )}

      {step === 'pin' && (
        <div className="space-y-6">
          <div className="text-center">
            <p className="font-semibold">Confirm Transfer</p>
            <p className="text-muted-foreground text-sm">Enter your PIN to send {formatCurrency(parseFloat(amount))} to {resolvedUser?.firstName}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-center">Transaction PIN</label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.slice(0, 4))}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="••••"
              maxLength={4}
              className="berry-input text-center text-2xl tracking-widest"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('amount')} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold">Back</button>
            <button
              onClick={() => pin.length === 4 && transferMutation.mutate()}
              disabled={pin.length < 4 || transferMutation.isPending}
              className="flex-1 berry-btn-primary"
            >
              {transferMutation.isPending ? 'Sending...' : 'Send Money'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
