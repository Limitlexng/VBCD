'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { IFeatureFlag, FeatureKey } from '@berry-x/types';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001/api/v1' });

const FEATURE_CATEGORIES: Record<string, string[]> = {
  'Bill Payments': [FeatureKey.AIRTIME, FeatureKey.DATA, FeatureKey.ELECTRICITY, FeatureKey.CABLE_TV, FeatureKey.INTERNET],
  'Financial': [FeatureKey.WALLET_FUNDING, FeatureKey.BANK_TRANSFER, FeatureKey.WALLET_TRANSFER, FeatureKey.WITHDRAWAL, FeatureKey.VIRTUAL_ACCOUNT],
  'Crypto': [FeatureKey.CRYPTO_BUY, FeatureKey.CRYPTO_SELL, FeatureKey.P2P_TRADING],
  'User': [FeatureKey.USER_REGISTRATION, FeatureKey.KYC, FeatureKey.TWO_FACTOR_AUTH, FeatureKey.REFERRAL],
  'Merchant': [FeatureKey.MERCHANT_PAYMENT, FeatureKey.QR_PAYMENT],
  'Notifications': [FeatureKey.NOTIFICATIONS_EMAIL, FeatureKey.NOTIFICATIONS_SMS, FeatureKey.NOTIFICATIONS_PUSH],
  'System': [FeatureKey.MAINTENANCE_MODE, FeatureKey.PROMOTIONS, FeatureKey.CASHBACK],
};

export default function FeaturesPage() {
  const qc = useQueryClient();

  const { data: flags, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data } = await api.get('/features');
      return data.data || [];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled, message }: { key: string; enabled: boolean; message?: string }) =>
      api.patch(`/features/${key}`, { isEnabled: enabled, maintenanceMessage: message }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feature-flags'] }),
  });

  const flagMap = new Map((flags || []).map((f: IFeatureFlag) => [f.key, f]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feature Flags</h1>
        <p className="text-muted-foreground text-sm mt-1">Enable or disable platform features without redeployment</p>
      </div>

      {Object.entries(FEATURE_CATEGORIES).map(([category, keys], ci) => (
        <motion.div key={category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.05 }}>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">{category}</h3>
          <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
            {keys.map((key) => {
              const flag = flagMap.get(key) as IFeatureFlag | undefined;
              const enabled = flag?.isEnabled ?? true;
              return (
                <div key={key} className={cn('flex items-center gap-4 px-5 py-3.5 transition-colors', !enabled && 'bg-muted/30')}>
                  <div className="flex-1">
                    <p className="text-sm font-medium flex items-center gap-2">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      {!enabled && flag?.maintenanceMessage && (
                        <span className="flex items-center gap-1 text-xs text-yellow-600 font-normal">
                          <AlertTriangle size={10} /> {flag.maintenanceMessage.slice(0, 40)}
                        </span>
                      )}
                    </p>
                    {flag?.rolloutPercentage !== undefined && flag.rolloutPercentage < 100 && (
                      <p className="text-xs text-muted-foreground mt-0.5">Rollout: {flag.rolloutPercentage}%</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={cn('text-xs font-medium', enabled ? 'text-green-600' : 'text-muted-foreground')}>
                      {enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button
                      onClick={() => toggleMutation.mutate({ key, enabled: !enabled })}
                      className="flex-shrink-0"
                    >
                      {enabled ? (
                        <ToggleRight size={28} className="text-primary" />
                      ) : (
                        <ToggleLeft size={28} className="text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
