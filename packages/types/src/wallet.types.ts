export enum WalletCurrency {
  NGN = 'NGN',
  USD = 'USD',
  BTC = 'BTC',
  ETH = 'ETH',
  USDT = 'USDT',
  USDC = 'USDC',
}

export enum WalletStatus {
  ACTIVE = 'active',
  FROZEN = 'frozen',
  CLOSED = 'closed',
  PENDING = 'pending',
}

export enum WalletType {
  FIAT = 'fiat',
  CRYPTO = 'crypto',
  ESCROW = 'escrow',
  MERCHANT = 'merchant',
  SYSTEM = 'system',
}

export interface IWallet {
  id: string;
  userId: string;
  currency: WalletCurrency;
  type: WalletType;
  status: WalletStatus;
  balance: number;
  ledgerBalance: number;
  pendingBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  walletTag?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum LedgerEntryType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export interface ILedgerEntry {
  id: string;
  walletId: string;
  transactionId: string;
  type: LedgerEntryType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface IBeneficiary {
  id: string;
  userId: string;
  name: string;
  bankCode?: string;
  bankName?: string;
  accountNumber?: string;
  walletTag?: string;
  type: 'bank' | 'wallet' | 'crypto';
  isFavorite: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
}
