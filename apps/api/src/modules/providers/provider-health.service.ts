import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderEntity, ProviderHealthLogEntity } from '../../database/entities/provider.entity';
import { PaystackProvider } from './adapters/paystack.provider';
import { MonnifyProvider } from './adapters/monnify.provider';
import { FlutterwaveProvider } from './adapters/flutterwave.provider';
import { ProviderName, ProviderServiceType, ProviderStatus } from '@berry-x/types';

@Injectable()
export class ProviderHealthService {
  private readonly logger = new Logger(ProviderHealthService.name);

  constructor(
    @InjectRepository(ProviderEntity)
    private readonly providersRepo: Repository<ProviderEntity>,
    @InjectRepository(ProviderHealthLogEntity)
    private readonly healthLogsRepo: Repository<ProviderHealthLogEntity>,
    private readonly paystack: PaystackProvider,
    private readonly monnify: MonnifyProvider,
    private readonly flutterwave: FlutterwaveProvider,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkAllProviders() {
    const providers = await this.providersRepo.find({ where: { isEnabled: true } });

    for (const provider of providers) {
      await this.checkProvider(provider);
    }
  }

  async checkProvider(provider: ProviderEntity): Promise<boolean> {
    const start = Date.now();
    let isHealthy = false;
    let errorMessage: string | undefined;

    try {
      const adapter = this.getAdapter(provider.name);
      if (!adapter) return false;
      isHealthy = await adapter.isHealthy();
    } catch (error) {
      errorMessage = (error as Error).message;
      isHealthy = false;
    }

    const responseTime = Date.now() - start;

    await this.healthLogsRepo.save({
      providerId: provider.id,
      service: ProviderServiceType.WALLET_FUNDING,
      isHealthy,
      responseTime,
      errorMessage,
      checkedAt: new Date(),
    });

    const newStatus = isHealthy ? ProviderStatus.ACTIVE : ProviderStatus.DEGRADED;
    if (provider.status !== newStatus) {
      await this.providersRepo.update(provider.id, {
        status: newStatus,
        avgResponseTime: responseTime,
      });
      this.logger.warn(`Provider ${provider.name} status changed to ${newStatus}`);
    } else {
      await this.providersRepo.update(provider.id, { avgResponseTime: responseTime });
    }

    return isHealthy;
  }

  async getHealthSummary() {
    const providers = await this.providersRepo.find();
    const summary = [];

    for (const provider of providers) {
      const recentLogs = await this.healthLogsRepo.find({
        where: { providerId: provider.id },
        order: { checkedAt: 'DESC' },
        take: 20,
      });

      const successCount = recentLogs.filter((l) => l.isHealthy).length;
      const uptime = recentLogs.length > 0 ? (successCount / recentLogs.length) * 100 : 0;
      const avgResponse =
        recentLogs.reduce((sum, l) => sum + l.responseTime, 0) / (recentLogs.length || 1);

      summary.push({
        provider: provider.name,
        status: provider.status,
        isEnabled: provider.isEnabled,
        uptime: Math.round(uptime * 100) / 100,
        avgResponseTime: Math.round(avgResponse),
        lastChecked: recentLogs[0]?.checkedAt,
      });
    }

    return summary;
  }

  private getAdapter(name: ProviderName) {
    const map: Partial<Record<ProviderName, { isHealthy(): Promise<boolean> }>> = {
      [ProviderName.PAYSTACK]: this.paystack,
      [ProviderName.MONNIFY]: this.monnify,
      [ProviderName.FLUTTERWAVE]: this.flutterwave,
    };
    return map[name];
  }
}
