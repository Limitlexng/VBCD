'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Shield, Bell, HelpCircle, LogOut, ChevronRight, CreditCard, Star, Lock, Smartphone } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

const menuSections = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Personal Information', href: '/profile/info' },
      { icon: CreditCard, label: 'Bank Accounts', href: '/profile/banks' },
      { icon: Star, label: 'Referral Program', href: '/profile/referral', badge: 'Earn ₦500' },
    ],
  },
  {
    title: 'Security',
    items: [
      { icon: Lock, label: 'Change Password', href: '/profile/password' },
      { icon: Smartphone, label: 'Transaction PIN', href: '/profile/pin' },
      { icon: Shield, label: '2FA Settings', href: '/profile/2fa' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: Bell, label: 'Notifications', href: '/notifications/settings' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: HelpCircle, label: 'Help Center', href: '/support' },
    ],
  },
];

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const tierColors: Record<number, string> = {
    0: 'bg-gray-100 text-gray-600',
    1: 'bg-blue-100 text-blue-600',
    2: 'bg-purple-100 text-purple-600',
    3: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className="px-4 py-4">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6 p-4 berry-card">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-primary font-bold text-xl">
              {user?.firstName?.[0]?.toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <div>
          <p className="font-bold text-lg">{user?.firstName} {user?.lastName}</p>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', tierColors[user?.tier ?? 0])}>
              Tier {user?.tier || 0}
            </span>
            {user?.isEmailVerified && (
              <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
                <Shield size={10} /> Verified
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Menu Sections */}
      <div className="space-y-5">
        {menuSections.map((section, si) => (
          <motion.div key={section.title} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.1 }}>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">{section.title}</p>
            <div className="berry-card divide-y divide-border p-0 overflow-hidden">
              {section.items.map(({ icon: Icon, label, href, badge }) => (
                <button key={label} onClick={() => router.push(href)} className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-muted/50 transition-colors">
                  <Icon size={16} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium flex-1 text-left">{label}</span>
                  {badge && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{badge}</span>}
                  <ChevronRight size={14} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Logout */}
        <button
          onClick={() => { logout(); router.push('/login'); }}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-destructive/5 hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={16} className="text-destructive" />
          <span className="text-sm font-medium text-destructive">Sign out</span>
        </button>
      </div>
    </div>
  );
}
