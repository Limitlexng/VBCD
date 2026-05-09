'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
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

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

export default function AirtimePage() {
  const router = useRouter();
  const { activeWallet, fetchWallets } = useWalletStore();
  const [network, setNetwork] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/bills/airtime', { network, phone, amount: parseFloat(amount) });
      return data.data;
    },
    onSuccess: () => { setSuccess(true); fetchWallets(); },
    onError: (e) => toast.error(formatApiError(e)),
  });

  if (success) {
    return (
      <div className="px-4 py-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
          className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 text-4xl">📱</motion.div>
        <h2 className="text-xl font-bold mb-1">Airtime Sent!</h2>
        <p className="text-muted-foreground text-sm">{formatCurrency(parseFloat(amount))} to {phone}</p>
        <div className="flex gap-3 mt-6">
          <button onClick={() => { setSuccess(false); setPhone(''); setAmount(''); }} className="py-3 px-6 rounded-xl border border-border text-sm font-semibold">Buy Again</button>
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
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold mb-5">Buy Airtime</motion.h1>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Select Network</label>
          <div className="grid grid-cols-4 gap-2">
            {NETWORKS.map((n) => (
              <button key={n.code} onClick={() => setNetwork(n.code)}
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

        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="₦0" className="berry-input text-lg font-semibold mb-2" />
          <div className="grid grid-cols-3 gap-2">
            {QUICK_AMOUNTS.map((a) => (
              <button key={a} onClick={() => setAmount(String(a))}
                className={`py-2 rounded-xl text-sm font-medium border transition-all ${amount === String(a) ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>
                ₦{a.toLocaleString()}
              </button>
            ))}
          </div>
          {activeWallet && <p className="text-xs text-muted-foreground mt-1">Balance: {formatCurrency(Number(activeWallet.balance))}</p>}
        </div>

        <button onClick={() => mutation.mutate()} disabled={!network || !phone || !amount || mutation.isPending} className="berry-btn-primary w-full">
          {mutation.isPending ? 'Processing...' : `Buy Airtime · ${amount ? formatCurrency(parseFloat(amount)) : '₦0'}`}
        </button>
      </div>
    </div>
  );
}
