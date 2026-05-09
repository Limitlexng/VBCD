export enum CryptoCurrency {
  BTC = 'BTC',
  ETH = 'ETH',
  USDT = 'USDT',
  USDC = 'USDC',
  BNB = 'BNB',
  SOL = 'SOL',
}

export enum TradeType {
  BUY = 'buy',
  SELL = 'sell',
}

export enum TradeStatus {
  OPEN = 'open',
  LOCKED = 'locked',
  PAID = 'paid',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum EscrowStatus {
  LOCKED = 'locked',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
}

export interface ICryptoTrade {
  id: string;
  reference: string;
  creatorId: string;
  takerId?: string;
  type: TradeType;
  cryptoCurrency: CryptoCurrency;
  fiatCurrency: string;
  cryptoAmount: number;
  fiatAmount: number;
  rate: number;
  minAmount: number;
  maxAmount: number;
  status: TradeStatus;
  paymentMethod: string;
  paymentWindow: number;
  escrowId?: string;
  disputeId?: string;
  termsOfTrade?: string;
  completedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEscrow {
  id: string;
  tradeId: string;
  sellerId: string;
  buyerId: string;
  cryptoCurrency: CryptoCurrency;
  amount: number;
  status: EscrowStatus;
  releasedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICryptoRate {
  currency: CryptoCurrency;
  buyRate: number;
  sellRate: number;
  marketRate: number;
  spread: number;
  updatedAt: Date;
}
