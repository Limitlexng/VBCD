import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { WalletsService } from '../wallets/wallets.service';
import { ProviderOrchestrator } from '../providers/provider-orchestrator.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from '../../database/entities/transaction.entity';
import {
  TransactionStatus,
  TransactionType,
  NotificationType,
  NotificationChannel,
  ProviderServiceType,
} from '@berry-x/types';

@Processor('transactions')
export class TransactionProcessor {
  private readonly logger = new Logger(TransactionProcessor.name);

  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionsRepo: Repository<TransactionEntity>,
    private readonly transactionsService: TransactionsService,
    private readonly walletsService: WalletsService,
    private readonly orchestrator: ProviderOrchestrator,
    private readonly notifications: NotificationsService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} type ${job.name}`);
  }

  @OnQueueCompleted()
  onComplete(job: Job) {
    this.logger.log(`Completed job ${job.id}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, err: Error) {
    this.logger.error(`Failed job ${job.id}: ${err.message}`);
  }

  @Process('process-transfer')
  async processTransfer(job: Job<{ transactionId: string }>) {
    const { transactionId } = job.data;
    const tx = await this.transactionsRepo.findOne({ where: { id: transactionId } });
    if (!tx) return;

    await this.transactionsService.updateStatus(transactionId, TransactionStatus.PROCESSING);
    await this.transactionsService.addTimeline(transactionId, TransactionStatus.PROCESSING, 'Deducting from wallet');

    try {
      await this.walletsService.debitWallet({
        walletId: tx.walletId,
        amount: tx.totalAmount,
        transactionId,
        description: tx.description,
        metadata: tx.metadata ?? undefined,
      });

      await this.transactionsService.addTimeline(transactionId, TransactionStatus.PROCESSING, 'Sending to provider');

      const result = await this.orchestrator.routePayment(ProviderServiceType.BANK_TRANSFER, {
        amount: tx.amount,
        reference: tx.reference,
        metadata: tx.metadata ?? undefined,
      });

      if (result.success) {
        await this.transactionsService.updateStatus(
          transactionId,
          TransactionStatus.SUCCESS,
          result.providerReference,
          result.status,
        );
        await this.transactionsService.addTimeline(transactionId, TransactionStatus.SUCCESS, 'Transfer completed');

        await this.notifications.send({
          userId: tx.userId,
          type: NotificationType.TRANSACTION_SUCCESS,
          channel: NotificationChannel.PUSH,
          title: 'Transfer Successful',
          body: `Your transfer of ₦${tx.amount.toLocaleString()} was successful.`,
          data: { transactionId },
        });
      } else {
        throw new Error('Provider returned failure');
      }
    } catch (error) {
      this.logger.error(`Transfer ${transactionId} failed: ${(error as Error).message}`);

      // Reverse the debit if provider failed
      try {
        const reversalRef = this.transactionsService.generateReference('REV');
        await this.walletsService.creditWallet({
          walletId: tx.walletId,
          amount: tx.totalAmount,
          transactionId: reversalRef,
          description: `Reversal for failed transaction ${tx.reference}`,
        });
      } catch (reversalError) {
        this.logger.error(`CRITICAL: Reversal failed for ${transactionId}`);
      }

      await this.transactionsService.updateStatus(transactionId, TransactionStatus.FAILED);
      await this.transactionsService.addTimeline(
        transactionId,
        TransactionStatus.FAILED,
        (error as Error).message,
      );

      await this.notifications.send({
        userId: tx.userId,
        type: NotificationType.TRANSACTION_FAILED,
        channel: NotificationChannel.PUSH,
        title: 'Transfer Failed',
        body: `Your transfer of ₦${tx.amount.toLocaleString()} failed. Any deducted amount will be reversed.`,
        data: { transactionId },
      });

      throw error;
    }
  }

  @Process('fund-wallet')
  async processFundWallet(job: Job<{ transactionId: string }>) {
    const { transactionId } = job.data;
    const tx = await this.transactionsRepo.findOne({ where: { id: transactionId } });
    if (!tx) return;

    await this.transactionsService.updateStatus(transactionId, TransactionStatus.PROCESSING);

    try {
      const result = await this.orchestrator.routePayment(ProviderServiceType.WALLET_FUNDING, {
        amount: tx.amount,
        reference: tx.reference,
        email: tx.metadata?.['email'] as string,
      });

      if (result.success) {
        await this.walletsService.creditWallet({
          walletId: tx.walletId,
          amount: tx.amount,
          transactionId,
          description: `Wallet funding via ${result.provider}`,
        });

        await this.transactionsService.updateStatus(transactionId, TransactionStatus.SUCCESS, result.providerReference);

        await this.notifications.send({
          userId: tx.userId,
          type: NotificationType.WALLET_CREDIT,
          channel: NotificationChannel.PUSH,
          title: 'Wallet Funded',
          body: `₦${tx.amount.toLocaleString()} has been added to your wallet.`,
          data: { transactionId },
        });
      }
    } catch (error) {
      await this.transactionsService.updateStatus(transactionId, TransactionStatus.FAILED);
      throw error;
    }
  }
}
