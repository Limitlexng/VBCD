import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { TransactionEntity, TransactionTimelineEntity } from '../../database/entities/transaction.entity';
import { WalletsService } from '../wallets/wallets.service';
import { ProviderOrchestrator } from '../providers/provider-orchestrator.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  TransactionType,
  TransactionStatus,
  TransactionChannel,
  TransactionFilter,
  NotificationType,
  NotificationChannel,
  ProviderServiceType,
} from '@berry-x/types';

export interface InitiateTransferDto {
  userId: string;
  walletId: string;
  amount: number;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  narration?: string;
  pin: string;
  idempotencyKey?: string;
}

export interface WalletTransferDto {
  userId: string;
  fromWalletId: string;
  toWalletTag: string;
  amount: number;
  narration?: string;
  pin: string;
}

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionsRepo: Repository<TransactionEntity>,
    @InjectRepository(TransactionTimelineEntity)
    private readonly timelineRepo: Repository<TransactionTimelineEntity>,
    @InjectQueue('transactions')
    private readonly transactionsQueue: Queue,
    @InjectQueue('transaction-verification')
    private readonly verificationQueue: Queue,
    private readonly walletsService: WalletsService,
    private readonly orchestrator: ProviderOrchestrator,
    private readonly notifications: NotificationsService,
  ) {}

  async getTransactions(userId: string, filter: Partial<TransactionFilter> = {}) {
    const query = this.transactionsRepo
      .createQueryBuilder('tx')
      .where('tx.userId = :userId', { userId });

    if (filter.type) query.andWhere('tx.type = :type', { type: filter.type });
    if (filter.status) query.andWhere('tx.status = :status', { status: filter.status });
    if (filter.startDate) query.andWhere('tx.createdAt >= :startDate', { startDate: filter.startDate });
    if (filter.endDate) query.andWhere('tx.createdAt <= :endDate', { endDate: filter.endDate });
    if (filter.minAmount) query.andWhere('tx.amount >= :minAmount', { minAmount: filter.minAmount });
    if (filter.maxAmount) query.andWhere('tx.amount <= :maxAmount', { maxAmount: filter.maxAmount });

    const page = filter.page || 1;
    const limit = Math.min(filter.limit || 20, 100);
    query.orderBy('tx.createdAt', 'DESC').skip((page - 1) * limit).take(limit);

    const [transactions, total] = await query.getManyAndCount();
    return {
      transactions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTransactionById(id: string, userId: string): Promise<TransactionEntity> {
    const tx = await this.transactionsRepo.findOne({ where: { id, userId } });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  async getTransactionTimeline(id: string): Promise<TransactionTimelineEntity[]> {
    return this.timelineRepo.find({ where: { transactionId: id }, order: { createdAt: 'ASC' } });
  }

  async initiateBankTransfer(dto: InitiateTransferDto): Promise<TransactionEntity> {
    const idempotencyKey = dto.idempotencyKey || uuidv4();
    const existing = await this.transactionsRepo.findOne({ where: { idempotencyKey } });
    if (existing) return existing;

    const wallet = await this.walletsService.getWalletById(dto.walletId, dto.userId);
    const fee = this.calculateFee(dto.amount);
    const totalAmount = dto.amount + fee;

    if (Number(wallet.balance) < totalAmount) {
      throw new BadRequestException('Insufficient balance');
    }

    const reference = this.generateReference('TRF');
    const tx = await this.transactionsRepo.save({
      id: uuidv4(),
      reference,
      idempotencyKey,
      userId: dto.userId,
      walletId: dto.walletId,
      type: TransactionType.BANK_TRANSFER,
      status: TransactionStatus.QUEUED,
      channel: TransactionChannel.APP,
      amount: dto.amount,
      fee,
      totalAmount,
      currency: 'NGN',
      description: `Transfer to ${dto.accountName} - ${dto.bankName}`,
      narration: dto.narration,
      metadata: {
        bankCode: dto.bankCode,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountName: dto.accountName,
      },
    });

    await this.addTimeline(tx.id, TransactionStatus.QUEUED, 'Transaction queued for processing');

    await this.transactionsQueue.add('process-transfer', { transactionId: tx.id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    return tx;
  }

  async addTimeline(transactionId: string, status: TransactionStatus, message: string, metadata?: Record<string, unknown>) {
    await this.timelineRepo.save({ transactionId, status, message, metadata });
  }

  async updateStatus(id: string, status: TransactionStatus, providerReference?: string, providerStatus?: string) {
    await this.transactionsRepo.update(id, {
      status,
      providerReference,
      providerStatus,
      ...(status === TransactionStatus.SUCCESS ? { completedAt: new Date() } : {}),
      ...(status === TransactionStatus.FAILED ? { failedAt: new Date() } : {}),
    });
  }

  private calculateFee(amount: number): number {
    const feePercent = 1.5;
    const maxFee = 5000;
    return Math.min(Math.round((amount * feePercent) / 100), maxFee);
  }

  generateReference(prefix = 'BX'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}
