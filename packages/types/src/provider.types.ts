export enum ProviderName {
  PAYSTACK = 'paystack',
  MONNIFY = 'monnify',
  FLUTTERWAVE = 'flutterwave',
  BINANCE_PAY = 'binance_pay',
  KORAPAY = 'korapay',
  SQUAD = 'squad',
}

export enum ProviderStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  DEGRADED = 'degraded',
}

export enum ProviderServiceType {
  WALLET_FUNDING = 'wallet_funding',
  VIRTUAL_ACCOUNT = 'virtual_account',
  BANK_TRANSFER = 'bank_transfer',
  CARD_PAYMENT = 'card_payment',
  BILL_PAYMENT = 'bill_payment',
  CRYPTO = 'crypto',
}

export interface IProvider {
  id: string;
  name: ProviderName;
  displayName: string;
  status: ProviderStatus;
  isEnabled: boolean;
  isSandbox: boolean;
  priority: number;
  supportedServices: ProviderServiceType[];
  webhookSecret?: string;
  baseUrl: string;
  successRate: number;
  avgResponseTime: number;
  metadata?: Record<string, unknown>;
  maintenanceMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProviderHealthLog {
  id: string;
  providerId: string;
  service: ProviderServiceType;
  isHealthy: boolean;
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  checkedAt: Date;
}

export interface IProviderMetrics {
  providerId: string;
  period: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  successRate: number;
  avgResponseTime: number;
  totalVolume: number;
  webhookFailures: number;
  timeouts: number;
}

export interface IPaymentRoute {
  id: string;
  service: ProviderServiceType;
  primaryProviderId: string;
  fallbackProviderIds: string[];
  conditions?: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
