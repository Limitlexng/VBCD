import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from '../../database/entities/transaction.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { WalletEntity } from '../../database/entities/wallet.entity';
import { TransactionStatus, TransactionType } from '@berry-x/types';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionsRepo: Repository<TransactionEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletsRepo: Repository<WalletEntity>,
  ) {}

  async getTransactionMetrics(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.transactionsRepo
      .createQueryBuilder('tx')
      .select([
        "DATE(tx.created_at) as date",
        "COUNT(*) as total",
        `SUM(CASE WHEN tx.status = '${TransactionStatus.SUCCESS}' THEN 1 ELSE 0 END) as successful`,
        `SUM(CASE WHEN tx.status = '${TransactionStatus.FAILED}' THEN 1 ELSE 0 END) as failed`,
        'SUM(tx.amount) as volume',
        'SUM(tx.fee) as fees',
      ])
      .where('tx.created_at >= :startDate', { startDate })
      .groupBy('DATE(tx.created_at)')
      .orderBy('date', 'ASC')
      .getRawMany();
  }

  async getUserMetrics(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.usersRepo
      .createQueryBuilder('u')
      .select([
        "DATE(u.created_at) as date",
        'COUNT(*) as new_users',
        'SUM(CASE WHEN u.is_email_verified = true THEN 1 ELSE 0 END) as verified',
      ])
      .where('u.created_at >= :startDate', { startDate })
      .groupBy('DATE(u.created_at)')
      .orderBy('date', 'ASC')
      .getRawMany();
  }

  async getTransactionsByType() {
    return this.transactionsRepo
      .createQueryBuilder('tx')
      .select(['tx.type as type', 'COUNT(*) as count', 'SUM(tx.amount) as volume'])
      .where('tx.status = :status', { status: TransactionStatus.SUCCESS })
      .groupBy('tx.type')
      .orderBy('count', 'DESC')
      .getRawMany();
  }

  async getTopUsers(limit = 10) {
    return this.transactionsRepo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.user', 'user')
      .select(['tx.userId', 'COUNT(*) as txCount', 'SUM(tx.amount) as volume'])
      .where('tx.status = :status', { status: TransactionStatus.SUCCESS })
      .groupBy('tx.userId')
      .orderBy('volume', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getUserTransactionSummary(userId: string) {
    const result = await this.transactionsRepo
      .createQueryBuilder('tx')
      .select([
        'COUNT(*) as total',
        `SUM(CASE WHEN tx.status = '${TransactionStatus.SUCCESS}' THEN 1 ELSE 0 END) as successful`,
        `SUM(CASE WHEN tx.status = '${TransactionStatus.FAILED}' THEN 1 ELSE 0 END) as failed`,
        'SUM(tx.amount) as totalVolume',
        'SUM(tx.fee) as totalFees',
      ])
      .where('tx.userId = :userId', { userId })
      .getRawOne();

    return result;
  }
}
