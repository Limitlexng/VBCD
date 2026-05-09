export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum UserTier {
  TIER_0 = 0,
  TIER_1 = 1,
  TIER_2 = 2,
  TIER_3 = 3,
}

export enum UserRole {
  USER = 'user',
  MERCHANT = 'merchant',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  SUPPORT = 'support',
  COMPLIANCE = 'compliance',
  OPERATIONS = 'operations',
  FINANCE = 'finance',
}

export interface TierLimit {
  dailyTransferLimit: number;
  singleTransferLimit: number;
  dailyWithdrawalLimit: number;
  walletBalance: number;
}

export const TIER_LIMITS: Record<UserTier, TierLimit> = {
  [UserTier.TIER_0]: {
    dailyTransferLimit: 20000,
    singleTransferLimit: 5000,
    dailyWithdrawalLimit: 10000,
    walletBalance: 50000,
  },
  [UserTier.TIER_1]: {
    dailyTransferLimit: 100000,
    singleTransferLimit: 50000,
    dailyWithdrawalLimit: 100000,
    walletBalance: 300000,
  },
  [UserTier.TIER_2]: {
    dailyTransferLimit: 500000,
    singleTransferLimit: 200000,
    dailyWithdrawalLimit: 500000,
    walletBalance: 1000000,
  },
  [UserTier.TIER_3]: {
    dailyTransferLimit: 5000000,
    singleTransferLimit: 2000000,
    dailyWithdrawalLimit: 5000000,
    walletBalance: 50000000,
  },
};

export interface IUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  username?: string;
  avatarUrl?: string;
  status: UserStatus;
  tier: UserTier;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isTwoFactorEnabled: boolean;
  referralCode: string;
  referredBy?: string;
  lastLoginAt?: Date;
  deviceId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IDevice {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceModel: string;
  os: string;
  osVersion: string;
  appVersion: string;
  ipAddress: string;
  isActive: boolean;
  lastSeenAt: Date;
  createdAt: Date;
}
