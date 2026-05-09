export enum NotificationType {
  TRANSACTION_SUCCESS = 'transaction_success',
  TRANSACTION_FAILED = 'transaction_failed',
  TRANSACTION_PENDING = 'transaction_pending',
  WALLET_CREDIT = 'wallet_credit',
  WALLET_DEBIT = 'wallet_debit',
  KYC_APPROVED = 'kyc_approved',
  KYC_REJECTED = 'kyc_rejected',
  KYC_SUBMITTED = 'kyc_submitted',
  LOGIN_ALERT = 'login_alert',
  PASSWORD_CHANGED = 'password_changed',
  REFERRAL_BONUS = 'referral_bonus',
  SUPPORT_REPLY = 'support_reply',
  TRADE_UPDATE = 'trade_update',
  SYSTEM_ALERT = 'system_alert',
  PROMOTION = 'promotion',
}

export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read',
}

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
}
