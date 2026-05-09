'use client';

import Link from 'next/link';
import { Bell, Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

export default function TopBar() {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border safe-top">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="font-semibold text-foreground">Berry X</span>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/notifications" className="relative p-2 rounded-xl hover:bg-muted transition-colors">
            <Bell size={18} className="text-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </Link>
          <Link href="/settings" className="p-2 rounded-xl hover:bg-muted transition-colors">
            <Settings size={18} className="text-muted-foreground" />
          </Link>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold text-xs">
                {user?.firstName?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
