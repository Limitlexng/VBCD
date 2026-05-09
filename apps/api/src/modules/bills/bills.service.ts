import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { TransactionEntity } from '../../database/entities/transaction.entity';
import { WalletsService } from '../wallets/wallets.service';
import { ProviderOrchestrator } from '../providers/provider-orchestrator.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import {
  TransactionType,
  TransactionStatus,
  TransactionChannel,
  BillCategory,
  FeatureKey,
  ProviderServiceType,
  NotificationType,
  NotificationChannel,
} from '@berry-x/types';

export interface PurchaseAirtimeDto {
  userId: string;
  walletId: string;
  phone: string;
  amount: number;
  network: string;
  pin: string;
}

export interface PurchaseDataDto {
  userId: string;
  walletId: string;
  phone: string;
  planCode: string;
  planName: string;
  amount: number;
  network: string;
  pin: string;
}

export interface PayElectricityDto {
  userId: string;
  walletId: string;
  meterNumber: string;
  disco: string;
  amount: number;
  meterType: 'prepaid' | 'postpaid';
  pin: string;
}

export interface PayCableTvDto {
  userId: string;
  walletId: string;
  smartcardNumber: string;
  provider: string;
  planCode: string;
  planName: string;
  amount: number;
  pin: string;
}

@Injectable()
export class BillsService {
  private readonly logger = new Logger(BillsService.name);

  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionsRepo: Repository<TransactionEntity>,
    private readonly walletsService: WalletsService,
    private readonly orchestrator: ProviderOrchestrator,
    private readonly notifications: NotificationsService,
    private readonly featureFlags: FeatureFlagsService,
  ) {}

  async purchaseAirtime(dto: PurchaseAirtimeDto): Promise<TransactionEntity> {
    await this.featureFlags.requireFeature(FeatureKey.AIRTIME);
    if (dto.amount < 50 || dto.amount > 50000) {
      throw new BadRequestException('Airtime amount must be between ₦50 and ₦50,000');
    }

    return this.processBillPayment({
      userId: dto.userId,
      walletId: dto.walletId,
      amount: dto.amount,
      type: TransactionType.AIRTIME_PURCHASE,
      description: `${dto.network} Airtime - ${dto.phone}`,
      metadata: { phone: dto.phone, network: dto.network },
    });
  }

  async purchaseData(dto: PurchaseDataDto): Promise<TransactionEntity> {
    await this.featureFlags.requireFeature(FeatureKey.DATA);

    return this.processBillPayment({
      userId: dto.userId,
      walletId: dto.walletId,
      amount: dto.amount,
      type: TransactionType.DATA_PURCHASE,
      description: `${dto.network} Data - ${dto.planName} - ${dto.phone}`,
      metadata: { phone: dto.phone, network: dto.network, planCode: dto.planCode, planName: dto.planName },
    });
  }

  async payElectricity(dto: PayElectricityDto): Promise<TransactionEntity> {
    await this.featureFlags.requireFeature(FeatureKey.ELECTRICITY);
    if (dto.amount < 1000) throw new BadRequestException('Minimum electricity payment is ₦1,000');

    return this.processBillPayment({
      userId: dto.userId,
      walletId: dto.walletId,
      amount: dto.amount,
      type: TransactionType.ELECTRICITY_PAYMENT,
      description: `${dto.disco} - ${dto.meterType} - ${dto.meterNumber}`,
      metadata: { meterNumber: dto.meterNumber, disco: dto.disco, meterType: dto.meterType },
    });
  }

  async payCableTV(dto: PayCableTvDto): Promise<TransactionEntity> {
    await this.featureFlags.requireFeature(FeatureKey.CABLE_TV);

    return this.processBillPayment({
      userId: dto.userId,
      walletId: dto.walletId,
      amount: dto.amount,
      type: TransactionType.CABLETV_PAYMENT,
      description: `${dto.provider} - ${dto.planName} - ${dto.smartcardNumber}`,
      metadata: { smartcardNumber: dto.smartcardNumber, provider: dto.provider, planCode: dto.planCode },
    });
  }

  private async processBillPayment(params: {
    userId: string;
    walletId: string;
    amount: number;
    type: TransactionType;
    description: string;
    metadata: Record<string, unknown>;
  }): Promise<TransactionEntity> {
    const wallet = await this.walletsService.getWalletById(params.walletId, params.userId);
    if (Number(wallet.balance) < params.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const reference = this.generateReference(params.type);
    const tx = await this.transactionsRepo.save({
      id: uuidv4(),
      reference,
      idempotencyKey: uuidv4(),
      userId: params.userId,
      walletId: params.walletId,
      type: params.type,
      status: TransactionStatus.PROCESSING,
      channel: TransactionChannel.APP,
      amount: params.amount,
      fee: 0,
      totalAmount: params.amount,
      currency: 'NGN',
      description: params.description,
      metadata: params.metadata,
    });

    try {
      await this.walletsService.debitWallet({
        walletId: params.walletId,
        amount: params.amount,
        transactionId: tx.id,
        description: params.description,
      });

      const result = await this.orchestrator.routePayment(ProviderServiceType.BILL_PAYMENT, {
        amount: params.amount,
        reference,
        metadata: params.metadata,
      });

      const newStatus = result.success ? TransactionStatus.SUCCESS : TransactionStatus.FAILED;
      await this.transactionsRepo.update(tx.id, {
        status: newStatus,
        providerReference: result.providerReference,
        providerStatus: result.status,
        ...(result.success ? { completedAt: new Date() } : { failedAt: new Date() }),
      });

      if (!result.success) {
        await this.walletsService.creditWallet({
          walletId: params.walletId,
          amount: params.amount,
          transactionId: uuidv4(),
          description: `Reversal: ${params.description}`,
        });
      }

      await this.notifications.send({
        userId: params.userId,
        type: result.success ? NotificationType.TRANSACTION_SUCCESS : NotificationType.TRANSACTION_FAILED,
        channel: NotificationChannel.PUSH,
        title: result.success ? 'Payment Successful' : 'Payment Failed',
        body: result.success
          ? `Your payment of ₦${params.amount.toLocaleString()} was successful.`
          : `Payment of ₦${params.amount.toLocaleString()} failed. Amount reversed.`,
        data: { transactionId: tx.id },
      });

      return { ...tx, status: newStatus };
    } catch (error) {
      await this.transactionsRepo.update(tx.id, { status: TransactionStatus.FAILED, failedAt: new Date() });
      throw error;
    }
  }

  private generateReference(type: TransactionType): string {
    const prefixes: Partial<Record<TransactionType, string>> = {
      [TransactionType.AIRTIME_PURCHASE]: 'AIR',
      [TransactionType.DATA_PURCHASE]: 'DAT',
      [TransactionType.ELECTRICITY_PAYMENT]: 'ELC',
      [TransactionType.CABLETV_PAYMENT]: 'CAB',
    };
    const prefix = prefixes[type] || 'BILL';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  async getDataPlans(network: string): Promise<{ planCode: string; name: string; amount: number; validity: string }[]> {
    const plans: Record<string, { planCode: string; name: string; amount: number; validity: string }[]> = {
      MTN: [
        { planCode: 'MTN-1GB-30', name: '1GB (30 days)', amount: 1000, validity: '30 days' },
        { planCode: 'MTN-2GB-30', name: '2GB (30 days)', amount: 2000, validity: '30 days' },
        { planCode: 'MTN-5GB-30', name: '5GB (30 days)', amount: 3500, validity: '30 days' },
        { planCode: 'MTN-10GB-30', name: '10GB (30 days)', amount: 6000, validity: '30 days' },
      ],
      Airtel: [
        { planCode: 'AIR-1.5GB-30', name: '1.5GB (30 days)', amount: 1000, validity: '30 days' },
        { planCode: 'AIR-3GB-30', name: '3GB (30 days)', amount: 2000, validity: '30 days' },
      ],
    };
    return plans[network] || [];
  }
}
