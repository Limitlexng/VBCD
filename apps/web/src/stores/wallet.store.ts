import { create } from 'zustand';
import { api } from '@/lib/api';
import { IWallet } from '@berry-x/types';

interface WalletState {
  wallets: IWallet[];
  activeWallet: IWallet | null;
  isLoading: boolean;
  isBalanceHidden: boolean;

  fetchWallets: () => Promise<void>;
  setActiveWallet: (wallet: IWallet) => void;
  toggleBalanceVisibility: () => void;
  refreshBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  activeWallet: null,
  isLoading: false,
  isBalanceHidden: false,

  fetchWallets: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/wallets');
      const wallets = data.data || [];
      set({ wallets, activeWallet: wallets.find((w: IWallet) => w.isDefault) || wallets[0] || null, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setActiveWallet: (wallet) => set({ activeWallet: wallet }),

  toggleBalanceVisibility: () => set((state) => ({ isBalanceHidden: !state.isBalanceHidden })),

  refreshBalance: async () => {
    const { fetchWallets } = get();
    await fetchWallets();
  },
}));
