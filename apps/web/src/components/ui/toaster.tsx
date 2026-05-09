'use client';

import * as Toast from '@radix-ui/react-toast';
import { create } from 'zustand';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => set((state) => ({ toasts: [...state.toasts, { ...toast, id: Date.now().toString() }] })),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (title: string, description?: string) => useToastStore.getState().addToast({ type: 'success', title, description }),
  error: (title: string, description?: string) => useToastStore.getState().addToast({ type: 'error', title, description }),
  warning: (title: string, description?: string) => useToastStore.getState().addToast({ type: 'warning', title, description }),
  info: (title: string, description?: string) => useToastStore.getState().addToast({ type: 'info', title, description }),
};

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const COLORS = {
  success: 'text-green-600 bg-green-50 dark:bg-green-900/30',
  error: 'text-red-600 bg-red-50 dark:bg-red-900/30',
  warning: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30',
  info: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <Toast.Provider swipeDirection="right">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <Toast.Root
            key={t.id}
            open
            onOpenChange={(open) => !open && removeToast(t.id)}
            duration={4000}
            className={cn(
              'fixed bottom-20 left-4 right-4 max-w-sm mx-auto flex items-start gap-3 rounded-xl p-4 shadow-lg border border-border',
              'bg-background data-[state=open]:animate-slide-up data-[state=closed]:animate-fade-out',
              'z-[100]',
            )}
          >
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', COLORS[t.type])}>
              <Icon size={14} />
            </div>
            <div className="flex-1">
              <Toast.Title className="text-sm font-semibold text-foreground">{t.title}</Toast.Title>
              {t.description && <Toast.Description className="text-xs text-muted-foreground mt-0.5">{t.description}</Toast.Description>}
            </div>
            <Toast.Close onClick={() => removeToast(t.id)} className="p-1 rounded-lg hover:bg-muted">
              <X size={12} className="text-muted-foreground" />
            </Toast.Close>
          </Toast.Root>
        );
      })}
      <Toast.Viewport />
    </Toast.Provider>
  );
}
