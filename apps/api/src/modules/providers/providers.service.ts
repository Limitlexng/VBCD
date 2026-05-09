import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderEntity, PaymentRouteEntity } from '../../database/entities/provider.entity';
import { ProviderHealthService } from './provider-health.service';
import { ProviderStatus, ProviderServiceType } from '@berry-x/types';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(ProviderEntity)
    private readonly providersRepo: Repository<ProviderEntity>,
    @InjectRepository(PaymentRouteEntity)
    private readonly routesRepo: Repository<PaymentRouteEntity>,
    private readonly healthService: ProviderHealthService,
  ) {}

  async getAllProviders() {
    return this.providersRepo.find({ order: { priority: 'ASC' } });
  }

  async getProvider(id: string) {
    const provider = await this.providersRepo.findOne({ where: { id } });
    if (!provider) throw new NotFoundException('Provider not found');
    return provider;
  }

  async toggleProvider(id: string, enabled: boolean) {
    await this.providersRepo.update(id, { isEnabled: enabled });
    return this.getProvider(id);
  }

  async setMaintenance(id: string, message: string | null) {
    await this.providersRepo.update(id, {
      status: message ? ProviderStatus.MAINTENANCE : ProviderStatus.ACTIVE,
      maintenanceMessage: message ?? undefined,
    });
    return this.getProvider(id);
  }

  async updatePriority(id: string, priority: number) {
    await this.providersRepo.update(id, { priority });
    return this.getProvider(id);
  }

  async getRoutes() {
    return this.routesRepo.find();
  }

  async updateRoute(service: ProviderServiceType, primaryProviderId: string, fallbackProviderIds: string[]) {
    const existing = await this.routesRepo.findOne({ where: { service } });
    if (existing) {
      await this.routesRepo.update(existing.id, { primaryProviderId, fallbackProviderIds });
      return this.routesRepo.findOne({ where: { service } });
    }
    return this.routesRepo.save({ service, primaryProviderId, fallbackProviderIds, isActive: true });
  }

  async getHealthSummary() {
    return this.healthService.getHealthSummary();
  }

  async runHealthCheck(id: string) {
    const provider = await this.getProvider(id);
    return this.healthService.checkProvider(provider);
  }
}
