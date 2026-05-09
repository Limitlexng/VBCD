'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Smartphone, Wifi, Zap, Tv, GraduationCap, Droplets, TrendingUp, Gift } from 'lucide-react';

const billCategories = [
  { label: 'Airtime', icon: Smartphone, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600', href: '/bills/airtime', description: 'Top up any network' },
  { label: 'Data', icon: Wifi, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600', href: '/bills/data', description: 'Buy data bundles' },
  { label: 'Electricity', icon: Zap, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600', href: '/bills/electricity', description: 'Prepaid & postpaid' },
  { label: 'Cable TV', icon: Tv, color: 'bg-red-100 dark:bg-red-900/30 text-red-600', href: '/bills/cable-tv', description: 'DStv, GOtv, Startimes' },
  { label: 'Education', icon: GraduationCap, color: 'bg-green-100 dark:bg-green-900/30 text-green-600', href: '/bills/education', description: 'School payments' },
  { label: 'Water', icon: Droplets, color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600', href: '/bills/water', description: 'Water bills' },
  { label: 'Betting', icon: TrendingUp, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600', href: '/bills/betting', description: 'Fund betting accounts' },
  { label: 'Gift Cards', icon: Gift, color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600', href: '/bills/gift-cards', description: 'Buy & redeem' },
];

export default function BillsPage() {
  const router = useRouter();

  return (
    <div className="px-4 py-4">
      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold mb-1">Bill Payments</h1>
        <p className="text-muted-foreground text-sm mb-5">Pay all your bills in one place</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {billCategories.map(({ label, icon: Icon, color, href, description }, i) => (
          <motion.button
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => router.push(href)}
            className="berry-card text-left hover:shadow-md transition-shadow active:scale-98"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="font-semibold text-sm">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
