'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Plus, Copy, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useWalletStore } from '@/stores/wallet.store';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { IWallet, WalletCurrency } from '@berry-x/types';
import WalletCard from '@/components/wallet/WalletCard';
import toast from 'react-hot-toast';

const CURRENCY_META: Record<string, { name: string; emoji: string }> = {
  NGN: { name: 'Naira', emoji: '🇳🇬' },
  USD: { name: 'Dollar', emoji: '🇺🇸' },
  BTC: { name: 'Bitcoin', emoji: '₿' },
  ETH: { name: 'Ethereum', emoji: 'Ξ' },
  USDT: { name: 'Tether', emoji: '₮' },
};

export default function WalletPage() {
  const router = useRouter();
  const { wallets, activeWallet, setActiveWallet, fetchWallets } = useWalletStore();

  const { data: virtualAccount } = useQuery({
    queryKey: ['virtual-account'],
    queryFn: async () => {
      const { data } = await api.get('/virtual-accounts/my');
      return data.data;
    },
  });

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  const actions = [
    { label: 'Add Money', icon: Plus, href: '/wallet/fund', color: 'bg-green-500/10 text-green-500' },
    { label: 'Send', icon: ArrowUpRight, href: '/transfers', color: 'bg-blue-500/10 text-blue-500' },
    { label: 'Withdraw', icon: ArrowDownLeft, href: '/wallet/withdraw', color: 'bg-orange-500/10 text-orange-500' },
  ];

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold">
        Wallet
      </motion.h1>

      <WalletCard />

      {/* Actions */}
      <div className="grid grid-cols-3 gap-3">
        {actions.map(({ label, icon: Icon, href, color }) => (
          <button
            key={label}
            onClick={() => router.push(href)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:shadow-sm transition-all"
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
              <Icon size={18} />
            </div>
            <span className="text-xs font-medium text-foreground">{label}</span>
          </button>
        ))}
      </div>

      {/* Virtual Account */}
      {virtualAccount && (
        <div className="berry-card">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">
            Virtual Account · Fund via bank transfer
          </p>
          <div className="space-y-2">
            {[
              { label: 'Bank', value: virtualAccount.bankName },
              { label: 'Account Number', value: virtualAccount.accountNumber, mono: true, copy: true },
              { label: 'Account Name', value: virtualAccount.accountName },
            ].map(({ label, value, mono, copy }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm font-semibold', mono && 'font-mono')}>{value}</span>
                  {copy && (
                    <button
                      onClick={() => { navigator.clipboard.writeText(value); toast.success('Copied!'); }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Wallets */}
      {wallets.length > 1 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">All Wallets</p>
          <div className="space-y-2">
            {wallets.map((wallet: IWallet) => {
              const meta = CURRENCY_META[wallet.currency] || { name: wallet.currency, emoji: '💰' };
              return (
                <button
                  key={wallet.id}
                  onClick={() => setActiveWallet(wallet)}
                  className={cn('w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left',
                    activeWallet?.id === wallet.id ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80')}
                >
                  <span className="text-2xl">{meta.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{meta.name}</p>
                    <p className="text-xs text-muted-foreground">{wallet.currency}</p>
                  </div>
                  <p className="text-sm font-bold">{formatCurrency(Number(wallet.balance), wallet.currency)}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
