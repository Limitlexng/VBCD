import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { TransactionEntity } from '../../database/entities/transaction.entity';
import { WalletEntity } from '../../database/entities/wallet.entity';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';
import { UsersService } from '../users/users.service';
import { WalletsService } from '../wallets/wallets.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  UserStatus,
  TransactionStatus,
  NotificationType,
  NotificationChannel,
} from '@berry-x/types';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionsRepo: Repository<TransactionEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletsRepo: Repository<WalletEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
    private readonly notifications: NotificationsService,
  ) {}

  async getDashboardSummary() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsersToday,
      txToday,
      successfulTxToday,
      failedTxToday,
    ] = await Promise.all([
      this.usersRepo.count(),
      this.usersRepo.count({ where: { lastLoginAt: MoreThanOrEqual(yesterday) } }),
      this.transactionsRepo.count({ where: { createdAt: MoreThanOrEqual(yesterday) } }),
      this.transactionsRepo.count({ where: { status: TransactionStatus.SUCCESS, createdAt: MoreThanOrEqual(yesterday) } }),
      this.transactionsRepo.count({ where: { status: TransactionStatus.FAILED, createdAt: MoreThanOrEqual(yesterday) } }),
    ]);

    const volumeResult = await this.transactionsRepo
      .createQueryBuilder('tx')
      .select('SUM(tx.amount)', 'total')
      .where('tx.status = :status AND tx.createdAt >= :date', { status: TransactionStatus.SUCCESS, date: yesterday })
      .getRawOne();

    const feeResult = await this.transactionsRepo
      .createQueryBuilder('tx')
      .select('SUM(tx.fee)', 'total')
      .where('tx.status = :status AND tx.createdAt >= :date', { status: TransactionStatus.SUCCESS, date: yesterday })
      .getRawOne();

    return {
      totalUsers,
      activeUsers24h: activeUsersToday,
      totalTransactions24h: txToday,
      successRate24h: txToday > 0 ? Math.round((successfulTxToday / txToday) * 100) : 0,
      failedTransactions24h: failedTxToday,
      totalVolume24h: Number(volumeResult?.total || 0),
      totalRevenue24h: Number(feeResult?.total || 0),
    };
  }

  async getUsers(page = 1, limit = 20, search?: string, status?: UserStatus) {
    const query = this.usersRepo.createQueryBuilder('user');
    if (search) {
      query.where('user.email ILIKE :search OR user.phone LIKE :search OR user.firstName ILIKE :search', {
        search: `%${search}%`,
      });
    }
    if (status) query.andWhere('user.status = :status', { status });

    const [users, total] = await query
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async suspendUser(userId: string, adminId: string, reason: string): Promise<void> {
    await this.usersService.updateStatus(userId, UserStatus.SUSPENDED);
    await this.logAudit(adminId, 'SUSPEND_USER', 'user', userId, undefined, { reason });
    await this.notifications.send({
      userId,
      type: NotificationType.SYSTEM_ALERT,
      channel: NotificationChannel.EMAIL,
      title: 'Account Suspended',
      body: `Your Berry X account has been temporarily suspended. Reason: ${reason}. Contact support for assistance.`,
    });
  }

  async unsuspendUser(userId: string, adminId: string): Promise<void> {
    await this.usersService.updateStatus(userId, UserStatus.ACTIVE);
    await this.logAudit(adminId, 'UNSUSPEND_USER', 'user', userId);
  }

  async getTransactions(page = 1, limit = 20, filters: Record<string, unknown> = {}) {
    const query = this.transactionsRepo.createQueryBuilder('tx').leftJoinAndSelect('tx.user', 'user');

    if (filters['status']) query.andWhere('tx.status = :status', { status: filters['status'] });
    if (filters['type']) query.andWhere('tx.type = :type', { type: filters['type'] });
    if (filters['userId']) query.andWhere('tx.userId = :userId', { userId: filters['userId'] });

    const [transactions, total] = await query
      .orderBy('tx.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { transactions, total };
  }

  async getAuditLogs(page = 1, limit = 50) {
    const [logs, total] = await this.auditRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { logs, total };
  }

  async logAudit(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    oldValue?: Record<string, unknown>,
    newValue?: Record<string, unknown>,
  ) {
    await this.auditRepo.save({ userId, action, resourceType, resourceId, oldValue, newValue });
  }

  async getRevenueAnalytics(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyRevenue = await this.transactionsRepo
      .createQueryBuilder('tx')
      .select("DATE(tx.created_at) as date, SUM(tx.fee) as revenue, SUM(tx.amount) as volume, COUNT(*) as count")
      .where('tx.status = :status AND tx.created_at >= :startDate', { status: TransactionStatus.SUCCESS, startDate })
      .groupBy('DATE(tx.created_at)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return dailyRevenue;
  }
}
