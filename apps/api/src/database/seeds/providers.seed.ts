import { DataSource } from 'typeorm';
import { ProviderEntity, PaymentRouteEntity } from '../../modules/providers/entities/provider.entity';
import { ProviderName, ProviderServiceType, ProviderStatus } from '@berry-x/types';

const PROVIDERS = [
  {
    name: ProviderName.PAYSTACK,
    displayName: 'Paystack',
    isEnabled: true,
    priority: 1,
    supportedServices: [
      ProviderServiceType.CARD_PAYMENT,
      ProviderServiceType.BANK_TRANSFER,
      ProviderServiceType.VIRTUAL_ACCOUNT,
      ProviderServiceType.BANK_LOOKUP,
    ],
    config: {
      baseUrl: 'https://api.paystack.co',
      webhookPath: '/api/v1/webhooks/paystack',
    },
  },
  {
    name: ProviderName.MONNIFY,
    displayName: 'Monnify',
    isEnabled: true,
    priority: 2,
    supportedServices: [
      ProviderServiceType.VIRTUAL_ACCOUNT,
      ProviderServiceType.BANK_TRANSFER,
      ProviderServiceType.BANK_LOOKUP,
    ],
    config: {
      baseUrl: 'https://api.monnify.com',
      webhookPath: '/api/v1/webhooks/monnify',
    },
  },
  {
    name: ProviderName.FLUTTERWAVE,
    displayName: 'Flutterwave',
    isEnabled: true,
    priority: 3,
    supportedServices: [
      ProviderServiceType.CARD_PAYMENT,
      ProviderServiceType.BANK_TRANSFER,
      ProviderServiceType.VIRTUAL_ACCOUNT,
      ProviderServiceType.MOBILE_MONEY,
    ],
    config: {
      baseUrl: 'https://api.flutterwave.com/v3',
      webhookPath: '/api/v1/webhooks/flutterwave',
    },
  },
];

const ROUTES = [
  // Wallet funding: Paystack primary, Flutterwave fallback
  { serviceType: ProviderServiceType.CARD_PAYMENT, providerName: ProviderName.PAYSTACK, priority: 1, isActive: true, minAmount: 10000, maxAmount: 500000000 },
  { serviceType: ProviderServiceType.CARD_PAYMENT, providerName: ProviderName.FLUTTERWAVE, priority: 2, isActive: true, minAmount: 10000, maxAmount: 500000000 },

  // Virtual accounts: Monnify primary, Paystack fallback
  { serviceType: ProviderServiceType.VIRTUAL_ACCOUNT, providerName: ProviderName.MONNIFY, priority: 1, isActive: true, minAmount: 0, maxAmount: null },
  { serviceType: ProviderServiceType.VIRTUAL_ACCOUNT, providerName: ProviderName.PAYSTACK, priority: 2, isActive: true, minAmount: 0, maxAmount: null },

  // Bank transfer: Paystack primary
  { serviceType: ProviderServiceType.BANK_TRANSFER, providerName: ProviderName.PAYSTACK, priority: 1, isActive: true, minAmount: 5000, maxAmount: 500000000 },
  { serviceType: ProviderServiceType.BANK_TRANSFER, providerName: ProviderName.MONNIFY, priority: 2, isActive: true, minAmount: 5000, maxAmount: 500000000 },
  { serviceType: ProviderServiceType.BANK_TRANSFER, providerName: ProviderName.FLUTTERWAVE, priority: 3, isActive: true, minAmount: 5000, maxAmount: 500000000 },
];

export async function seedProviders(dataSource: DataSource) {
  const providerRepo = dataSource.getRepository(ProviderEntity);
  const routeRepo = dataSource.getRepository(PaymentRouteEntity);
  console.log('🔌 Seeding payment providers...');

  let pCreated = 0;

  for (const p of PROVIDERS) {
    const existing = await providerRepo.findOne({ where: { name: p.name } });
    if (!existing) {
      await providerRepo.save(providerRepo.create({
        ...p,
        status: ProviderStatus.ACTIVE,
        uptimePercentage: 99.9,
        avgResponseTime: 500,
      }));
      pCreated++;
    }
  }

  let rCreated = 0;
  for (const r of ROUTES) {
    const existing = await routeRepo.findOne({
      where: { serviceType: r.serviceType, providerName: r.providerName },
    });
    if (!existing) {
      await routeRepo.save(routeRepo.create(r));
      rCreated++;
    }
  }

  console.log(`   ✅ Providers: ${pCreated} created | Routes: ${rCreated} created`);
}
