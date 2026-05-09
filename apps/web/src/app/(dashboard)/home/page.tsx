'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Plus, Zap, Wifi, Tv, Bolt } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useWalletStore } from '@/stores/wallet.store';
import WalletCard from '@/components/wallet/WalletCard';
import TransactionList from '@/components/transactions/TransactionList';
import { cn } from '@/lib/utils';

const quickActions = [
  { label: 'Add Money', icon: Plus, color: 'bg-green-100 dark:bg-green-900/30 text-green-600', href: '/wallet/fund' },
  { label: 'Transfer', icon: ArrowUpRight, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600', href: '/transfers' },
  { label: 'Airtime', icon: Zap, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600', href: '/bills/airtime' },
  { label: 'Data', icon: Wifi, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600', href: '/bills/data' },
  { label: 'TV', icon: Tv, color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600', href: '/bills/cable-tv' },
  { label: 'Electricity', icon: Bolt, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600', href: '/bills/electricity' },
  { label: 'Request', icon: ArrowDownLeft, color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600', href: '/wallet/request' },
  { label: 'More', icon: RefreshCw, color: 'bg-gray-100 dark:bg-gray-800 text-gray-600', href: '/bills' },
];

export default function HomePage() {
  const { user } = useAuthStore();
  const { fetchWallets } = useWalletStore();
  const router = useRouter();

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="px-4 py-4 space-y-6">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-muted-foreground text-sm">{greeting()},</p>
        <h2 className="text-xl font-bold">{user?.firstName} {user?.lastName} 👋</h2>
      </motion.div>

      {/* Wallet Card */}
      <WalletCard />

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Quick actions</h3>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map(({ label, icon: Icon, color, href }) => (
            <button key={label} onClick={() => router.push(href)} className="flex flex-col items-center gap-2">
              <div className={cn('w-13 h-13 rounded-2xl flex items-center justify-center w-12 h-12', color)}>
                <Icon size={20} />
              </div>
              <span className="text-[11px] font-medium text-foreground text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Recent</h3>
          <button onClick={() => router.push('/transactions')} className="text-primary text-xs font-semibold">See all</button>
        </div>
        <TransactionList limit={5} />
      </motion.div>
    </div>
  );
}
