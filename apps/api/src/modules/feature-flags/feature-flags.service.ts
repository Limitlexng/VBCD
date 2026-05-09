import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlagEntity, DynamicConfigEntity } from '../../database/entities/feature-flag.entity';
import { FeatureKey, IUser } from '@berry-x/types';

@Injectable()
export class FeatureFlagsService {
  constructor(
    @InjectRepository(FeatureFlagEntity)
    private readonly flagsRepo: Repository<FeatureFlagEntity>,
    @InjectRepository(DynamicConfigEntity)
    private readonly configsRepo: Repository<DynamicConfigEntity>,
  ) {}

  async isEnabled(key: FeatureKey, user?: Partial<IUser>): Promise<boolean> {
    const flag = await this.flagsRepo.findOne({ where: { key } });
    if (!flag) return true;
    if (!flag.isEnabled) return false;

    if (user) {
      if (flag.allowedTiers && flag.allowedTiers.length > 0) {
        const allowed = flag.allowedTiers.map(Number);
        if (!allowed.includes(user.tier ?? 0)) return false;
      }
      if (flag.allowedRoles && flag.allowedRoles.length > 0) {
        if (user.role && !flag.allowedRoles.includes(user.role)) return false;
      }
    }

    if (flag.rolloutPercentage < 100) {
      const hash = this.hashUser(user?.id ?? Math.random().toString());
      if (hash > flag.rolloutPercentage) return false;
    }

    return true;
  }

  async requireFeature(key: FeatureKey, user?: Partial<IUser>): Promise<void> {
    const enabled = await this.isEnabled(key, user);
    if (!enabled) {
      const flag = await this.flagsRepo.findOne({ where: { key } });
      throw new ForbiddenException(flag?.maintenanceMessage || `Feature ${key} is temporarily unavailable`);
    }
  }

  async getAllFlags(): Promise<FeatureFlagEntity[]> {
    return this.flagsRepo.find({ order: { key: 'ASC' } });
  }

  async getPublicFlags(): Promise<Partial<FeatureFlagEntity>[]> {
    const flags = await this.flagsRepo.find();
    return flags.map(({ key, isEnabled, maintenanceMessage }) => ({ key, isEnabled, maintenanceMessage }));
  }

  async updateFlag(key: FeatureKey, updates: Partial<FeatureFlagEntity>, updatedBy: string): Promise<FeatureFlagEntity> {
    const flag = await this.flagsRepo.findOne({ where: { key } });
    if (!flag) throw new NotFoundException('Feature flag not found');
    await this.flagsRepo.update(flag.id, { ...updates, updatedBy });
    return this.flagsRepo.findOne({ where: { key } }) as Promise<FeatureFlagEntity>;
  }

  async getConfig(configKey: string): Promise<unknown> {
    const config = await this.configsRepo.findOne({ where: { key: configKey } });
    return config?.value;
  }

  async getAllConfigs(category?: string): Promise<DynamicConfigEntity[]> {
    const where = category ? { category } : {};
    return this.configsRepo.find({ where, order: { key: 'ASC' } });
  }

  async setConfig(key: string, value: unknown, updatedBy: string, category = 'general', description?: string): Promise<DynamicConfigEntity> {
    const existing = await this.configsRepo.findOne({ where: { key } });
    if (existing) {
      await this.configsRepo.update(existing.id, { value, updatedBy });
      return this.configsRepo.findOne({ where: { key } }) as Promise<DynamicConfigEntity>;
    }
    return this.configsRepo.save({ key, value, updatedBy, category, description, isPublic: false });
  }

  private hashUser(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 100;
  }
}
