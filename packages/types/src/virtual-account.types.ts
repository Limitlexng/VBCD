export enum VirtualAccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

export enum VirtualAccountBank {
  PROVIDUS = 'Providus Bank',
  WEMA = 'Wema Bank',
  STERLING = 'Sterling Bank',
  MONIEPOINT = 'Moniepoint',
  GLOBUS = 'Globus Bank',
}

export interface IVirtualAccount {
  id: string;
  userId: string;
  walletId: string;
  accountNumber: string;
  accountName: string;
  bankName: VirtualAccountBank;
  bankCode: string;
  status: VirtualAccountStatus;
  provider: string;
  externalReference: string;
  isDefault: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVirtualAccountDeposit {
  id: string;
  virtualAccountId: string;
  transactionId: string;
  amount: number;
  senderName: string;
  senderBankName?: string;
  senderAccountNumber?: string;
  narration?: string;
  providerReference: string;
  createdAt: Date;
}
