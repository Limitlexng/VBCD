import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { TransactionEntity } from '../../database/entities/transaction.entity';
import { VirtualAccountsService } from '../virtual-accounts/virtual-accounts.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionStatus } from '@berry-x/types';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly processedWebhooks = new Set<string>();

  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionsRepo: Repository<TransactionEntity>,
    private readonly vaService: VirtualAccountsService,
    private readonly transactionsService: TransactionsService,
    private readonly config: ConfigService,
  ) {}

  async handlePaystack(payload: Record<string, unknown>, signature: string, rawBody: string): Promise<void> {
    const secret = this.config.get('app.paystackWebhookSecret');
    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
    if (hash !== signature) throw new BadRequestException('Invalid webhook signature');

    const event = payload['event'] as string;
    const data = payload['data'] as Record<string, unknown>;
    const idempotencyKey = `paystack-${data?.['id'] || ''}-${event}`;

    if (this.processedWebhooks.has(idempotencyKey)) {
      this.logger.log(`Skipping duplicate webhook: ${idempotencyKey}`);
      return;
    }
    this.processedWebhooks.add(idempotencyKey);

    this.logger.log(`Processing Paystack webhook: ${event}`);

    switch (event) {
      case 'charge.success':
        await this.handlePaystackChargeSuccess(data);
        break;
      case 'transfer.success':
        await this.handleTransferUpdate(data, 'paystack', TransactionStatus.SUCCESS);
        break;
      case 'transfer.failed':
        await this.handleTransferUpdate(data, 'paystack', TransactionStatus.FAILED);
        break;
      case 'dedicatedaccount.assign.success':
        this.logger.log('Dedicated account assigned');
        break;
    }
  }

  async handleMonnify(payload: Record<string, unknown>, signature: string, rawBody: string): Promise<void> {
    const event = payload['eventType'] as string;
    const data = payload['eventData'] as Record<string, unknown>;

    this.logger.log(`Processing Monnify webhook: ${event}`);

    switch (event) {
      case 'SUCCESSFUL_TRANSACTION':
        if (data['product']?.['type'] === 'RESERVED_ACCOUNT') {
          await this.vaService.handleDeposit(
            data['product']?.['reference'] as string,
            data['amountPaid'] as number,
            { senderName: data['paymentSourceInformation']?.[0]?.['accountName'], ...data },
          );
        }
        break;
      case 'SUCCESSFUL_DISBURSEMENT':
        await this.handleTransferUpdate(data, 'monnify', TransactionStatus.SUCCESS);
        break;
    }
  }

  async handleFlutterwave(payload: Record<string, unknown>, signature: string): Promise<void> {
    const secret = this.config.get('app.flutterwaveWebhookSecret');
    if (signature !== secret) throw new BadRequestException('Invalid webhook signature');

    const event = payload['event'] as string;
    const data = payload['data'] as Record<string, unknown>;

    this.logger.log(`Processing Flutterwave webhook: ${event}`);

    switch (event) {
      case 'charge.completed':
        if (data['status'] === 'successful') {
          await this.handlePaymentSuccess(data['tx_ref'] as string, data['amount'] as number);
        }
        break;
      case 'transfer.completed':
        const status = data['status'] === 'SUCCESSFUL' ? TransactionStatus.SUCCESS : TransactionStatus.FAILED;
        await this.handleTransferUpdate(data, 'flutterwave', status);
        break;
    }
  }

  private async handlePaystackChargeSuccess(data: Record<string, unknown>): Promise<void> {
    const reference = data['reference'] as string;
    const amount = (data['amount'] as number) / 100;
    await this.handlePaymentSuccess(reference, amount);
  }

  private async handlePaymentSuccess(reference: string, amount: number): Promise<void> {
    const tx = await this.transactionsRepo.findOne({ where: { reference } });
    if (!tx) { this.logger.warn(`Transaction not found for reference: ${reference}`); return; }
    if (tx.status === TransactionStatus.SUCCESS) return;

    await this.transactionsService.updateStatus(tx.id, TransactionStatus.SUCCESS);
    this.logger.log(`Payment succeeded for reference: ${reference}, amount: ${amount}`);
  }

  private async handleTransferUpdate(data: Record<string, unknown>, provider: string, status: TransactionStatus): Promise<void> {
    const reference = (data['reference'] || data['txRef'] || data['tx_ref']) as string;
    if (!reference) return;

    const tx = await this.transactionsRepo.findOne({ where: { providerReference: reference } });
    if (!tx) return;

    await this.transactionsService.updateStatus(tx.id, status);
    this.logger.log(`Transfer ${status} for reference: ${reference} via ${provider}`);
  }
}
