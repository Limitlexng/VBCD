import { DataSource } from 'typeorm';
import { FeatureFlagEntity } from '../../modules/feature-flags/entities/feature-flag.entity';
import { FeatureKey } from '@berry-x/types';

interface FlagSeed {
  key: FeatureKey;
  description: string;
  isEnabled: boolean;
  rolloutPercentage: number;
}

const FLAGS: FlagSeed[] = [
  // Bill Payments
  { key: FeatureKey.AIRTIME, description: 'Airtime top-up for all networks', isEnabled: true, rolloutPercentage: 100 },
  { key: FeatureKey.DATA, description: 'Mobile data bundle purchases', isEnabled: true, rolloutPercentage: 100 },
  { key: FeatureKey.ELECTRICITY, description: 'Electricity token purchases (EKEDC, IKEDC, etc.)', isEnabled: true, rolloutPercentage: 100 },
  { key: FeatureKey.CABLE_TV, description: 'DSTV, GOtv, Startimes subscriptions', isEnabled: true, rolloutPercentage: 100 },
  { key: FeatureKey.INTERNET, description: 'Spectranet, Smile, etc.', isEnabled: true, rolloutPercentage: 100 },

  // Financial
  { key: FeatureKey.WALLET_FUNDING, description: 'Fund wallet via card or bank transfer', isEnabled: true, rolloutPercentage: 100 },
  { key: FeatureKey.BANK_TRANSFER, description: 'Transfer to bank accounts', isEnabled: true, rolloutPercentage: 100 },
  { key: FeatureKey.WALLET_TRANSFER, description: 'Transfer between BerryX wallets', isEnabled: true, rolloutPercentage: 100 },
  { key: FeatureKey.WITHDRAWAL, description: 'Withdraw from wallet to bank', isEnabled: true, rolloutPercentage: 100 },
  { key: FeatureKey.VIRTUAL_ACCOUNT, description: 'Dedicated virtual account provisioning', isEnabled: true, rolloutPercentage: 100 },

  // Crypto
  { key: FeatureKey.CRYPTO_BUY, description: 'Buy cryptocurrency with NGN wallet', isEnabled: true, rolloutPercentage: 100 },
  { key: FeatureKey.CRYPTO_SELL, description: 'Sell cryptocurrency to NGN wallet', isEnabled: true, rolloutPercentage: 100 },
  { key: FeatureKey.P2P_TRADING, description: 'Peer-to-peer crypto trading marketplace', isEnabled: true, rolloutPercentage: 100 },

  // User
  { key: FeatureKey.USER_REGISTRATION, description: 'New user registration', isEnabled: true, rolloutPercentage: 100 },
  { key: FeatureKey.KYC, description: 'KYC verification flow', isEnabled: true, rolloutPercentage: 100 },
  { key: FeatureKey.TWO_FACTOR_AUTH, description: 'TOTP-based two-factor authentication', isEnabled: true, rolloutPercentage: 100 },
  { key: FeatureKey.REFERRAL, description: 'Referral program with rewards', isEnabled: true, rolloutPercentage: 100 },

  // Merchant
  { key: FeatureKey.MERCHANT_PAYMENT, description: 'Accept payments as a merchant', isEnabled: true, rolloutPercentage: 100 },
  { key: FeatureKey.QR_PAYMENT, description: 'QR code scan-to-pay', isEnabled: true, rolloutPercentage: 100 },

  // Notifications
  { key: FeatureKey.NOTIFICATIONS_EMAIL, description: 'Email notifications', isEnabled: true, rolloutPercentage: 100 },
  { key: FeatureKey.NOTIFICATIONS_SMS, description: 'SMS notifications via Termii/Twilio', isEnabled: true, rolloutPercentage: 100 },
  { key: FeatureKey.NOTIFICATIONS_PUSH, description: 'Firebase push notifications', isEnabled: true, rolloutPercentage: 100 },

  // System
  { key: FeatureKey.MAINTENANCE_MODE, description: 'Global maintenance mode', isEnabled: false, rolloutPercentage: 100 },
  { key: FeatureKey.PROMOTIONS, description: 'Promotional banners and offers', isEnabled: true, rolloutPercentage: 100 },
  { key: FeatureKey.CASHBACK, description: 'Cashback rewards on transactions', isEnabled: false, rolloutPercentage: 0 },
];

export async function seedFeatureFlags(dataSource: DataSource) {
  const repo = dataSource.getRepository(FeatureFlagEntity);
  console.log('🚩 Seeding feature flags...');

  let created = 0;
  let skipped = 0;

  for (const flag of FLAGS) {
    const existing = await repo.findOne({ where: { key: flag.key } });
    if (existing) {
      skipped++;
      continue;
    }
    await repo.save(repo.create({
      key: flag.key,
      description: flag.description,
      isEnabled: flag.isEnabled,
      rolloutPercentage: flag.rolloutPercentage,
    }));
    created++;
  }

  console.log(`   ✅ Feature flags: ${created} created, ${skipped} already existed`);
}
