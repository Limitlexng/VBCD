import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycRecordEntity, KycDocumentEntity } from '../../database/entities/kyc.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  KycStatus,
  KycDocumentType,
  UserTier,
  NotificationType,
  NotificationChannel,
} from '@berry-x/types';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(KycRecordEntity)
    private readonly kycRepo: Repository<KycRecordEntity>,
    @InjectRepository(KycDocumentEntity)
    private readonly docsRepo: Repository<KycDocumentEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly notifications: NotificationsService,
  ) {}

  async getKycStatus(userId: string) {
    const records = await this.kycRepo.find({ where: { userId }, order: { tier: 'ASC' } });
    return { records, currentTier: await this.getUserTier(userId) };
  }

  async submitKyc(userId: string, tier: number, data: {
    bvn?: string;
    nin?: string;
    dateOfBirth?: Date;
    address?: string;
    documents?: { type: KycDocumentType; fileUrl: string; fileSize: number; mimeType: string }[];
  }): Promise<KycRecordEntity> {
    const existing = await this.kycRepo.findOne({ where: { userId, tier } });
    if (existing && existing.status === KycStatus.APPROVED) {
      throw new BadRequestException(`Tier ${tier} KYC already approved`);
    }
    if (existing && existing.status === KycStatus.PENDING) {
      throw new BadRequestException(`Tier ${tier} KYC is under review`);
    }

    if (tier > 1) {
      const prevRecord = await this.kycRepo.findOne({ where: { userId, tier: tier - 1 } });
      if (!prevRecord || prevRecord.status !== KycStatus.APPROVED) {
        throw new BadRequestException(`Complete Tier ${tier - 1} KYC first`);
      }
    }

    const record = await this.kycRepo.save({
      userId,
      tier,
      status: KycStatus.PENDING,
      bvn: data.bvn,
      nin: data.nin,
      dateOfBirth: data.dateOfBirth,
      address: data.address,
      submittedAt: new Date(),
    });

    if (data.documents) {
      for (const doc of data.documents) {
        await this.docsRepo.save({ ...doc, kycId: record.id, status: KycStatus.PENDING });
      }
    }

    return record;
  }

  async reviewKyc(kycId: string, approved: boolean, reviewedBy: string, notes?: string): Promise<KycRecordEntity> {
    const record = await this.kycRepo.findOne({ where: { id: kycId } });
    if (!record) throw new NotFoundException('KYC record not found');

    const status = approved ? KycStatus.APPROVED : KycStatus.REJECTED;
    await this.kycRepo.update(kycId, { status, reviewedBy, reviewNotes: notes, reviewedAt: new Date() });

    if (approved) {
      const newTier = record.tier as UserTier;
      await this.usersRepo.update(record.userId, { tier: newTier });
    }

    await this.notifications.send({
      userId: record.userId,
      type: approved ? NotificationType.KYC_APPROVED : NotificationType.KYC_REJECTED,
      channel: NotificationChannel.PUSH,
      title: approved ? 'KYC Approved!' : 'KYC Rejected',
      body: approved
        ? `Your Tier ${record.tier} verification has been approved. You now have higher limits!`
        : `Your Tier ${record.tier} verification was rejected. ${notes ? `Reason: ${notes}` : ''}`,
      data: { kycId, tier: record.tier },
    });

    return this.kycRepo.findOne({ where: { id: kycId } }) as Promise<KycRecordEntity>;
  }

  async getPendingKyc(page = 1, limit = 20) {
    const [records, total] = await this.kycRepo.findAndCount({
      where: { status: KycStatus.PENDING },
      order: { submittedAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });
    return { records, total };
  }

  private async getUserTier(userId: string): Promise<UserTier> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    return user?.tier ?? UserTier.TIER_0;
  }
}
