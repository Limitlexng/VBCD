'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { ICryptoRate, CryptoCurrency } from '@berry-x/types';

const CRYPTO_META: Record<string, { symbol: string; name: string; color: string; emoji: string }> = {
  BTC: { symbol: 'BTC', name: 'Bitcoin', color: 'text-orange-500', emoji: '₿' },
  ETH: { symbol: 'ETH', name: 'Ethereum', color: 'text-blue-500', emoji: 'Ξ' },
  USDT: { symbol: 'USDT', name: 'Tether', color: 'text-green-500', emoji: '₮' },
  USDC: { symbol: 'USDC', name: 'USD Coin', color: 'text-blue-400', emoji: '🪙' },
  BNB: { symbol: 'BNB', name: 'BNB', color: 'text-yellow-500', emoji: '🔶' },
  SOL: { symbol: 'SOL', name: 'Solana', color: 'text-purple-500', emoji: '◎' },
};

export default function CryptoPage() {
  const [activeTab, setActiveTab] = useState<'rates' | 'p2p'>('rates');

  const { data: rates, isLoading, refetch } = useQuery({
    queryKey: ['crypto-rates'],
    queryFn: async () => {
      const { data } = await api.get('/crypto/rates');
      return data.data || [];
    },
    refetchInterval: 30000,
  });

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-5">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold">
          Crypto
        </motion.h1>
        <button onClick={() => refetch()} className="p-2 rounded-xl bg-muted">
          <RefreshCw size={16} className="text-muted-foreground" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl mb-5">
        {['rates', 'p2p'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as 'rates' | 'p2p')}
            className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize', activeTab === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}
          >
            {tab === 'p2p' ? 'P2P Trading' : 'Live Rates'}
          </button>
        ))}
      </div>

      {activeTab === 'rates' && (
        <div className="space-y-2">
          {isLoading ? (
            [...Array(6)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)
          ) : (
            rates?.map((rate: ICryptoRate, i: number) => {
              const meta = CRYPTO_META[rate.currency] || { symbol: rate.currency, name: rate.currency, color: 'text-foreground', emoji: '🪙' };
              return (
                <motion.div
                  key={rate.currency}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="berry-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl font-bold', meta.color)}>
                        {meta.emoji}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{meta.name}</p>
                        <p className="text-xs text-muted-foreground">{meta.symbol}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(rate.buyRate)}</p>
                      <div className="flex items-center gap-1 justify-end">
                        <TrendingUp size={10} className="text-green-500" />
                        <span className="text-xs text-green-500">Buy</span>
                        <span className="text-xs text-muted-foreground mx-1">·</span>
                        <TrendingDown size={10} className="text-red-500" />
                        <span className="text-xs text-red-500">Sell {formatCurrency(rate.sellRate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Buy</button>
                    <button className="flex-1 py-2 rounded-lg bg-muted text-foreground text-xs font-semibold">Sell</button>
                    <button className="flex-1 py-2 rounded-lg bg-muted text-foreground text-xs font-semibold">P2P</button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'p2p' && (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="text-5xl mb-4">🤝</div>
          <h3 className="font-bold text-lg">P2P Trading</h3>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs">
            Trade crypto directly with other users. Funds secured in escrow until both parties confirm.
          </p>
          <button className="berry-btn-primary mt-6 max-w-xs">Start Trading</button>
        </div>
      )}
    </div>
  );
}
