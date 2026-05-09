'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Copy, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function FundWalletPage() {
  const router = useRouter();

  const { data: virtualAccount, isLoading } = useQuery({
    queryKey: ['virtual-account'],
    queryFn: async () => {
      const { data } = await api.get('/virtual-accounts/my');
      return data.data;
    },
  });

  const copy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="px-4 py-4 max-w-md">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground mb-5 hover:text-foreground transition-colors">
        <ArrowLeft size={16} />
        <span className="text-sm">Back</span>
      </button>

      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold mb-1">Fund Wallet</h1>
        <p className="text-muted-foreground text-sm mb-6">Transfer to your virtual account to fund your wallet</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : virtualAccount ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="berry-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Bank Details</p>
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 px-2 py-0.5 rounded-full font-medium">Active</span>
          </div>

          {[
            { label: 'Bank Name', value: virtualAccount.bankName },
            { label: 'Account Number', value: virtualAccount.accountNumber, copy: true },
            { label: 'Account Name', value: virtualAccount.accountName, copy: true },
          ].map(({ label, value, copy: canCopy }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold font-mono">{value}</span>
                {canCopy && (
                  <button onClick={() => copy(value, label)} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <Copy size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={() => copy(virtualAccount.accountNumber, 'Account number')}
            className="w-full berry-btn-primary flex items-center justify-center gap-2"
          >
            <Copy size={16} />
            Copy Account Number
          </button>
        </motion.div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No virtual account found</p>
        </div>
      )}

      <div className="mt-5 p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How it works</p>
        <ul className="space-y-1 text-xs list-disc list-inside">
          <li>Transfer any amount to the account above</li>
          <li>Your wallet is credited automatically within seconds</li>
          <li>Minimum: ₦100 · No maximum</li>
        </ul>
      </div>
    </div>
  );
}
