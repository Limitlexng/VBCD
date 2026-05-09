import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderEntity, PaymentRouteEntity } from '../../database/entities/provider.entity';
import { PaystackProvider } from './adapters/paystack.provider';
import { MonnifyProvider } from './adapters/monnify.provider';
import { FlutterwaveProvider } from './adapters/flutterwave.provider';
import {
  ProviderName,
  ProviderServiceType,
  ProviderStatus,
} from '@berry-x/types';

export interface PaymentPayload {
  amount: number;
  currency?: string;
  email?: string;
  phone?: string;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  success: boolean;
  reference: string;
  providerReference?: string;
  paymentUrl?: string;
  status: string;
  provider: ProviderName;
  rawResponse?: Record<string, unknown>;
}

export interface BaseProvider {
  getName(): ProviderName;
  initializePayment(payload: PaymentPayload): Promise<PaymentResult>;
  verifyPayment(reference: string): Promise<PaymentResult>;
  createVirtualAccount(params: Record<string, unknown>): Promise<Record<string, unknown>>;
  initiateBankTransfer(params: Record<string, unknown>): Promise<Record<string, unknown>>;
  isHealthy(): Promise<boolean>;
}

@Injectable()
export class ProviderOrchestrator {
  private readonly logger = new Logger(ProviderOrchestrator.name);

  constructor(
    @InjectRepository(ProviderEntity)
    private readonly providersRepo: Repository<ProviderEntity>,
    @InjectRepository(PaymentRouteEntity)
    private readonly routesRepo: Repository<PaymentRouteEntity>,
    private readonly paystack: PaystackProvider,
    private readonly monnify: MonnifyProvider,
    private readonly flutterwave: FlutterwaveProvider,
  ) {}

  getProvider(name: ProviderName): BaseProvider {
    const map: Record<ProviderName, BaseProvider> = {
      [ProviderName.PAYSTACK]: this.paystack,
      [ProviderName.MONNIFY]: this.monnify,
      [ProviderName.FLUTTERWAVE]: this.flutterwave,
      [ProviderName.BINANCE_PAY]: this.paystack,
      [ProviderName.KORAPAY]: this.paystack,
      [ProviderName.SQUAD]: this.paystack,
    };
    return map[name];
  }

  async routePayment(service: ProviderServiceType, payload: PaymentPayload): Promise<PaymentResult> {
    const route = await this.routesRepo.findOne({ where: { service, isActive: true } });
    const providerOrder: ProviderName[] = [];

    if (route) {
      const primary = await this.providersRepo.findOne({ where: { id: route.primaryProviderId } });
      if (primary?.name) providerOrder.push(primary.name);

      for (const fallbackId of route.fallbackProviderIds ?? []) {
        const fallback = await this.providersRepo.findOne({ where: { id: fallbackId } });
        if (fallback?.name) providerOrder.push(fallback.name);
      }
    } else {
      providerOrder.push(...this.getDefaultProviderOrder(service));
    }

    for (const providerName of providerOrder) {
      const providerConfig = await this.providersRepo.findOne({ where: { name: providerName } });
      if (!providerConfig?.isEnabled || providerConfig.status !== ProviderStatus.ACTIVE) continue;

      try {
        const provider = this.getProvider(providerName);
        const healthy = await provider.isHealthy();
        if (!healthy) {
          this.logger.warn(`Provider ${providerName} health check failed, trying next`);
          continue;
        }

        const result = await provider.initializePayment(payload);
        if (result.success) return result;

        this.logger.warn(`Provider ${providerName} returned failure for ${payload.reference}`);
      } catch (error) {
        this.logger.error(`Provider ${providerName} threw error: ${(error as Error).message}`);
        continue;
      }
    }

    throw new ServiceUnavailableException('All payment providers are currently unavailable');
  }

  async verifyPayment(providerName: ProviderName, reference: string): Promise<PaymentResult> {
    const provider = this.getProvider(providerName);
    return provider.verifyPayment(reference);
  }

  private getDefaultProviderOrder(service: ProviderServiceType): ProviderName[] {
    const defaults: Record<ProviderServiceType, ProviderName[]> = {
      [ProviderServiceType.WALLET_FUNDING]: [ProviderName.PAYSTACK, ProviderName.FLUTTERWAVE],
      [ProviderServiceType.VIRTUAL_ACCOUNT]: [ProviderName.MONNIFY, ProviderName.PAYSTACK],
      [ProviderServiceType.BANK_TRANSFER]: [ProviderName.PAYSTACK, ProviderName.FLUTTERWAVE, ProviderName.MONNIFY],
      [ProviderServiceType.CARD_PAYMENT]: [ProviderName.FLUTTERWAVE, ProviderName.PAYSTACK],
      [ProviderServiceType.BILL_PAYMENT]: [ProviderName.PAYSTACK, ProviderName.FLUTTERWAVE],
      [ProviderServiceType.CRYPTO]: [ProviderName.BINANCE_PAY],
    };
    return defaults[service] ?? [ProviderName.PAYSTACK];
  }
}
