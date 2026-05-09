'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, ArrowLeftRight, Grid3X3, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/transfers', icon: ArrowLeftRight, label: 'Transfer' },
  { href: '/bills', icon: Grid3X3, label: 'Bills' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link key={href} href={href} className="flex-1">
              <div className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors">
                <div className={cn('relative p-1.5 rounded-xl transition-all', isActive && 'bg-primary/10')}>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-primary/10 rounded-xl"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon
                    size={20}
                    className={cn('relative z-10 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')}
                    strokeWidth={isActive ? 2.5 : 1.75}
                  />
                </div>
                <span className={cn('text-[10px] font-medium transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')}>
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
