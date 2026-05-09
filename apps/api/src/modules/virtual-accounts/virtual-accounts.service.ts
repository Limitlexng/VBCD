import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VirtualAccountEntity } from '../../database/entities/virtual-account.entity';
import { WalletsService } from '../wallets/wallets.service';
import { ProviderOrchestrator } from '../providers/provider-orchestrator.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  VirtualAccountStatus,
  WalletCurrency,
  ProviderServiceType,
  ProviderName,
  NotificationType,
  NotificationChannel,
} from '@berry-x/types';

@Injectable()
export class VirtualAccountsService {
  constructor(
    @InjectRepository(VirtualAccountEntity)
    private readonly vaRepo: Repository<VirtualAccountEntity>,
    private readonly walletsService: WalletsService,
    private readonly orchestrator: ProviderOrchestrator,
    private readonly notifications: NotificationsService,
  ) {}

  async createVirtualAccount(userId: string): Promise<VirtualAccountEntity> {
    const existing = await this.vaRepo.findOne({ where: { userId, status: VirtualAccountStatus.ACTIVE } });
    if (existing) return existing;

    const wallet = (await this.walletsService.getUserWallets(userId))
      .find((w) => w.currency === WalletCurrency.NGN);
    if (!wallet) throw new NotFoundException('NGN wallet not found');

    const monnifyProvider = this.orchestrator.getProvider(ProviderName.MONNIFY);
    const result = await monnifyProvider.createVirtualAccount({
      accountReference: userId,
      accountName: `Berry X - ${userId.slice(0, 8)}`,
      currencyCode: 'NGN',
      getAllAvailableBanks: false,
      preferredBanks: ['035'],
    });

    const accountData = result as Record<string, unknown>;
    const accounts = accountData['accounts'] as Record<string, unknown>[] || [];
    const account = accounts[0] as Record<string, unknown> || {};

    return this.vaRepo.save({
      userId,
      walletId: wallet.id,
      accountNumber: account['accountNumber'] as string || `9${Date.now()}`.slice(0, 10),
      accountName: account['accountName'] as string || `Berry X User`,
      bankName: account['bankName'] as string || 'Wema Bank',
      bankCode: account['bankCode'] as string || '035',
      status: VirtualAccountStatus.ACTIVE,
      provider: ProviderName.MONNIFY,
      externalReference: accountData['accountReference'] as string || userId,
      isDefault: true,
    });
  }

  async getUserVirtualAccounts(userId: string): Promise<VirtualAccountEntity[]> {
    return this.vaRepo.find({ where: { userId, status: VirtualAccountStatus.ACTIVE } });
  }

  async handleDeposit(accountNumber: string, amount: number, metadata: Record<string, unknown>): Promise<void> {
    const va = await this.vaRepo.findOne({ where: { accountNumber } });
    if (!va) throw new NotFoundException('Virtual account not found');

    const depositRef = `VA-DEP-${Date.now()}`;
    await this.walletsService.creditWallet({
      walletId: va.walletId,
      amount,
      transactionId: depositRef,
      description: `Virtual account deposit from ${metadata['senderName'] || 'Unknown'}`,
      metadata,
    });

    await this.notifications.send({
      userId: va.userId,
      type: NotificationType.WALLET_CREDIT,
      channel: NotificationChannel.PUSH,
      title: 'Money Received!',
      body: `₦${amount.toLocaleString()} has been received in your Berry X account.`,
      data: { amount, sender: metadata['senderName'] },
    });
  }
}
