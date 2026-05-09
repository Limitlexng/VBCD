import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'NGN'): string {
  if (currency === 'NGN') {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(amount);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 8 }).format(amount);
}

export function formatAmount(amount: number): string {
  if (amount >= 1_000_000_000) return `₦${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`;
  return formatCurrency(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function maskAccountNumber(account: string): string {
  return `****${account.slice(-4)}`;
}

export function generateDeviceId(): string {
  const existing = localStorage.getItem('device_id');
  if (existing) return existing;
  const id = `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem('device_id', id);
  return id;
}

export function getTransactionStatusColor(status: string): string {
  const map: Record<string, string> = {
    success: 'text-green-600 dark:text-green-400',
    failed: 'text-red-600 dark:text-red-400',
    pending: 'text-yellow-600 dark:text-yellow-500',
    processing: 'text-blue-600 dark:text-blue-400',
    reversed: 'text-purple-600 dark:text-purple-400',
    cancelled: 'text-gray-600 dark:text-gray-400',
  };
  return map[status] || 'text-gray-600';
}

export function getTransactionIcon(type: string): string {
  const map: Record<string, string> = {
    wallet_funding: '↓',
    bank_transfer: '→',
    wallet_transfer: '↔',
    airtime_purchase: '📱',
    data_purchase: '📶',
    electricity_payment: '⚡',
    cabletv_payment: '📺',
    crypto_buy: '₿',
    crypto_sell: '₿',
    p2p_trade: '🤝',
    merchant_payment: '🛍️',
    reversal: '↩',
    fee: '💸',
  };
  return map[type] || '💰';
}
