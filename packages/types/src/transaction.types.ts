export enum TransactionType {
  WALLET_FUNDING = 'wallet_funding',
  WALLET_TRANSFER = 'wallet_transfer',
  BANK_TRANSFER = 'bank_transfer',
  BILL_PAYMENT = 'bill_payment',
  AIRTIME_PURCHASE = 'airtime_purchase',
  DATA_PURCHASE = 'data_purchase',
  ELECTRICITY_PAYMENT = 'electricity_payment',
  CABLETV_PAYMENT = 'cabletv_payment',
  CRYPTO_BUY = 'crypto_buy',
  CRYPTO_SELL = 'crypto_sell',
  CRYPTO_TRANSFER = 'crypto_transfer',
  P2P_TRADE = 'p2p_trade',
  MERCHANT_PAYMENT = 'merchant_payment',
  REVERSAL = 'reversal',
  WITHDRAWAL = 'withdrawal',
  REFERRAL_BONUS = 'referral_bonus',
  CASHBACK = 'cashback',
  FEE = 'fee',
  ESCROW_LOCK = 'escrow_lock',
  ESCROW_RELEASE = 'escrow_release',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  REVERSED = 'reversed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  AWAITING_APPROVAL = 'awaiting_approval',
  QUEUED = 'queued',
}

export enum TransactionChannel {
  APP = 'app',
  WEB = 'web',
  API = 'api',
  USSD = 'ussd',
  ADMIN = 'admin',
}

export interface ITransaction {
  id: string;
  reference: string;
  userId: string;
  walletId: string;
  type: TransactionType;
  status: TransactionStatus;
  channel: TransactionChannel;
  amount: number;
  fee: number;
  totalAmount: number;
  currency: string;
  description: string;
  narration?: string;
  metadata?: Record<string, unknown>;
  providerId?: string;
  providerReference?: string;
  providerStatus?: string;
  retryCount: number;
  maxRetries: number;
  idempotencyKey: string;
  ipAddress?: string;
  deviceId?: string;
  completedAt?: Date;
  failedAt?: Date;
  reversedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransactionTimeline {
  id: string;
  transactionId: string;
  status: TransactionStatus;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ITransactionFilter {
  userId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
