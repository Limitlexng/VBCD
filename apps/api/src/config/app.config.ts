import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  name: process.env['APP_NAME'] || 'Berry X',
  env: process.env['NODE_ENV'] || 'development',
  port: parseInt(process.env['PORT'] || '3001', 10),
  apiPrefix: process.env['API_PREFIX'] || 'api',
  jwtSecret: process.env['JWT_SECRET'] || 'berry-x-super-secret-key',
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '15m',
  jwtRefreshSecret: process.env['JWT_REFRESH_SECRET'] || 'berry-x-refresh-secret',
  jwtRefreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  encryptionKey: process.env['ENCRYPTION_KEY'] || 'berry-x-32-char-encryption-key!!',
  frontendUrl: process.env['FRONTEND_URL'] || 'http://localhost:3000',
  adminUrl: process.env['ADMIN_URL'] || 'http://localhost:3002',
  corsOrigins: process.env['CORS_ORIGINS'] || 'http://localhost:3000,http://localhost:3002',

  // Email
  smtpHost: process.env['SMTP_HOST'] || 'smtp.gmail.com',
  smtpPort: parseInt(process.env['SMTP_PORT'] || '587', 10),
  smtpUser: process.env['SMTP_USER'] || '',
  smtpPass: process.env['SMTP_PASS'] || '',
  emailFrom: process.env['EMAIL_FROM'] || 'noreply@berryx.com',
  emailFromName: process.env['EMAIL_FROM_NAME'] || 'Berry X',

  // SMS
  smsProvider: process.env['SMS_PROVIDER'] || 'termii',
  termiiApiKey: process.env['TERMII_API_KEY'] || '',
  termiiSenderId: process.env['TERMII_SENDER_ID'] || 'BerryX',

  // File uploads
  uploadDestination: process.env['UPLOAD_DESTINATION'] || './uploads',
  maxFileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760', 10),
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],

  // OTP
  otpExpiry: parseInt(process.env['OTP_EXPIRY_MINUTES'] || '10', 10),
  otpLength: parseInt(process.env['OTP_LENGTH'] || '6', 10),

  // Referral
  referralBonusAmount: parseInt(process.env['REFERRAL_BONUS_AMOUNT'] || '500', 10),

  // Transaction
  transactionFeePercent: parseFloat(process.env['TRANSACTION_FEE_PERCENT'] || '1.5'),
  maxTransactionFee: parseInt(process.env['MAX_TRANSACTION_FEE'] || '500', 10),

  // Provider keys — Paystack
  paystackSecretKey: process.env['PAYSTACK_SECRET_KEY'] || '',
  paystackPublicKey: process.env['PAYSTACK_PUBLIC_KEY'] || '',
  paystackBaseUrl: process.env['PAYSTACK_BASE_URL'] || 'https://api.paystack.co',
  paystackWebhookSecret: process.env['PAYSTACK_WEBHOOK_SECRET'] || '',

  // Provider keys — Monnify
  monnifyApiKey: process.env['MONNIFY_API_KEY'] || '',
  monnifySecretKey: process.env['MONNIFY_SECRET_KEY'] || '',
  monnifyBaseUrl: process.env['MONNIFY_BASE_URL'] || 'https://api.monnify.com',
  monnifyContractCode: process.env['MONNIFY_CONTRACT_CODE'] || '',
  monnifyWebhookSecret: process.env['MONNIFY_WEBHOOK_SECRET'] || '',

  // Provider keys — Flutterwave
  flutterwaveSecretKey: process.env['FLUTTERWAVE_SECRET_KEY'] || '',
  flutterwavePublicKey: process.env['FLUTTERWAVE_PUBLIC_KEY'] || '',
  flutterwaveBaseUrl: process.env['FLUTTERWAVE_BASE_URL'] || 'https://api.flutterwave.com/v3',
  flutterwaveWebhookSecret: process.env['FLUTTERWAVE_WEBHOOK_SECRET'] || '',
}));
