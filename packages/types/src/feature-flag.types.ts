export enum FeatureKey {
  AIRTIME = 'airtime',
  DATA = 'data',
  ELECTRICITY = 'electricity',
  CABLE_TV = 'cable_tv',
  INTERNET = 'internet',
  EDUCATION_PAYMENT = 'education_payment',
  CRYPTO_BUY = 'crypto_buy',
  CRYPTO_SELL = 'crypto_sell',
  P2P_TRADING = 'p2p_trading',
  WALLET_TRANSFER = 'wallet_transfer',
  BANK_TRANSFER = 'bank_transfer',
  WALLET_FUNDING = 'wallet_funding',
  CARD_FUNDING = 'card_funding',
  WITHDRAWAL = 'withdrawal',
  VIRTUAL_ACCOUNT = 'virtual_account',
  MERCHANT_PAYMENT = 'merchant_payment',
  QR_PAYMENT = 'qr_payment',
  REFERRAL = 'referral',
  CASHBACK = 'cashback',
  PROMOTIONS = 'promotions',
  NOTIFICATIONS_EMAIL = 'notifications_email',
  NOTIFICATIONS_SMS = 'notifications_sms',
  NOTIFICATIONS_PUSH = 'notifications_push',
  USER_REGISTRATION = 'user_registration',
  KYC = 'kyc',
  KYC_BVN = 'kyc_bvn',
  KYC_NIN = 'kyc_nin',
  KYC_SELFIE = 'kyc_selfie',
  TWO_FACTOR_AUTH = 'two_factor_auth',
  MAINTENANCE_MODE = 'maintenance_mode',
}

export interface IFeatureFlag {
  id: string;
  key: FeatureKey;
  displayName: string;
  description?: string;
  isEnabled: boolean;
  maintenanceMessage?: string;
  rolloutPercentage: number;
  allowedTiers?: number[];
  allowedRegions?: string[];
  allowedRoles?: string[];
  metadata?: Record<string, unknown>;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDynamicConfig {
  id: string;
  key: string;
  value: unknown;
  description?: string;
  category: string;
  isPublic: boolean;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
