import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WalletEntity } from '../../database/entities/wallet.entity';
import { LedgerEntryEntity } from '../../database/entities/ledger.entity';
import { TransactionEntity } from '../../database/entities/transaction.entity';
import {
  WalletCurrency,
  WalletStatus,
  WalletType,
  LedgerEntryType,
  TransactionStatus,
} from '@berry-x/types';

export interface CreditWalletParams {
  walletId: string;
  amount: number;
  transactionId: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface DebitWalletParams {
  walletId: string;
  amount: number;
  transactionId: string;
  description: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(WalletEntity)
    private readonly walletsRepo: Repository<WalletEntity>,
    @InjectRepository(LedgerEntryEntity)
    private readonly ledgerRepo: Repository<LedgerEntryEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async createWallet(userId: string, currency: WalletCurrency, type: WalletType = WalletType.FIAT): Promise<WalletEntity> {
    const existing = await this.walletsRepo.findOne({ where: { userId, currency, type } });
    if (existing) throw new ConflictException(`${currency} wallet already exists`);

    const isFirst = !(await this.walletsRepo.findOne({ where: { userId } }));
    const wallet = this.walletsRepo.create({ userId, currency, type, isDefault: isFirst });
    return this.walletsRepo.save(wallet);
  }

  async getUserWallets(userId: string): Promise<WalletEntity[]> {
    return this.walletsRepo.find({ where: { userId }, order: { isDefault: 'DESC', createdAt: 'ASC' } });
  }

  async getWalletById(walletId: string, userId?: string): Promise<WalletEntity> {
    const where: Record<string, string> = { id: walletId };
    if (userId) where['userId'] = userId;
    const wallet = await this.walletsRepo.findOne({ where });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async getWalletBalance(userId: string, currency: WalletCurrency = WalletCurrency.NGN): Promise<{ balance: number; pendingBalance: number; ledgerBalance: number }> {
    const wallet = await this.walletsRepo.findOne({ where: { userId, currency } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return {
      balance: Number(wallet.balance),
      pendingBalance: Number(wallet.pendingBalance),
      ledgerBalance: Number(wallet.ledgerBalance),
    };
  }

  async creditWallet(params: CreditWalletParams): Promise<WalletEntity> {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(WalletEntity, {
        where: { id: params.walletId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');
      if (wallet.status !== WalletStatus.ACTIVE) throw new BadRequestException('Wallet is not active');

      const balanceBefore = Number(wallet.balance);
      wallet.balance = balanceBefore + params.amount;
      wallet.ledgerBalance = Number(wallet.ledgerBalance) + params.amount;
      wallet.totalDeposited = Number(wallet.totalDeposited) + params.amount;
      wallet.version += 1;

      await manager.save(WalletEntity, wallet);

      const entry = manager.create(LedgerEntryEntity, {
        walletId: wallet.id,
        transactionId: params.transactionId,
        type: LedgerEntryType.CREDIT,
        amount: params.amount,
        balanceBefore,
        balanceAfter: Number(wallet.balance),
        description: params.description,
        metadata: params.metadata,
      });
      await manager.save(LedgerEntryEntity, entry);

      return wallet;
    });
  }

  async debitWallet(params: DebitWalletParams): Promise<WalletEntity> {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(WalletEntity, {
        where: { id: params.walletId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');
      if (wallet.status !== WalletStatus.ACTIVE) throw new BadRequestException('Wallet is not active');
      if (Number(wallet.balance) < params.amount) throw new BadRequestException('Insufficient balance');

      const balanceBefore = Number(wallet.balance);
      wallet.balance = balanceBefore - params.amount;
      wallet.ledgerBalance = Number(wallet.ledgerBalance) - params.amount;
      wallet.totalWithdrawn = Number(wallet.totalWithdrawn) + params.amount;
      wallet.version += 1;

      await manager.save(WalletEntity, wallet);

      const entry = manager.create(LedgerEntryEntity, {
        walletId: wallet.id,
        transactionId: params.transactionId,
        type: LedgerEntryType.DEBIT,
        amount: params.amount,
        balanceBefore,
        balanceAfter: Number(wallet.balance),
        description: params.description,
        metadata: params.metadata,
      });
      await manager.save(LedgerEntryEntity, entry);

      return wallet;
    });
  }

  async freezeWallet(walletId: string): Promise<WalletEntity> {
    await this.walletsRepo.update(walletId, { status: WalletStatus.FROZEN });
    return this.getWalletById(walletId);
  }

  async unfreezeWallet(walletId: string): Promise<WalletEntity> {
    await this.walletsRepo.update(walletId, { status: WalletStatus.ACTIVE });
    return this.getWalletById(walletId);
  }

  async getLedger(walletId: string, page = 1, limit = 20): Promise<{ entries: LedgerEntryEntity[]; total: number }> {
    const [entries, total] = await this.ledgerRepo.findAndCount({
      where: { walletId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { entries, total };
  }
}
