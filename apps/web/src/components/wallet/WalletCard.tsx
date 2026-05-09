'use client';

import { motion } from 'framer-motion';
import { Eye, EyeOff, Copy, ChevronDown, TrendingUp } from 'lucide-react';
import { useWalletStore } from '@/stores/wallet.store';
import { formatCurrency, cn } from '@/lib/utils';

export default function WalletCard() {
  const { activeWallet, isBalanceHidden, toggleBalanceVisibility } = useWalletStore();

  if (!activeWallet) return <WalletCardSkeleton />;

  const balance = Number(activeWallet.balance);
  const pendingBalance = Number(activeWallet.pendingBalance);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 60%, #166534 100%)',
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white translate-x-10 -translate-y-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white -translate-x-8 translate-y-8" />
      </div>

      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-green-200 text-xs font-medium uppercase tracking-wide">Total Balance</p>
            <p className="text-white/60 text-xs mt-0.5">{activeWallet.currency} Wallet</p>
          </div>
          <button
            onClick={toggleBalanceVisibility}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            {isBalanceHidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        {/* Balance */}
        <div className="mb-5">
          <motion.div
            key={isBalanceHidden ? 'hidden' : 'shown'}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white"
          >
            {isBalanceHidden ? (
              <div className="flex items-center gap-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-white/30" />
                ))}
              </div>
            ) : (
              <span className="text-3xl font-bold tracking-tight">{formatCurrency(balance)}</span>
            )}
          </motion.div>

          {pendingBalance > 0 && (
            <p className="text-green-200 text-xs mt-1 flex items-center gap-1">
              <TrendingUp size={10} />
              {formatCurrency(pendingBalance)} pending
            </p>
          )}
        </div>

        {/* Account number */}
        {activeWallet.walletTag && (
          <div className="flex items-center justify-between">
            <p className="text-white/70 text-sm font-mono">{activeWallet.walletTag}</p>
            <button className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
              <Copy size={12} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function WalletCardSkeleton() {
  return (
    <div className="rounded-2xl p-5 bg-muted animate-pulse h-36" />
  );
}
