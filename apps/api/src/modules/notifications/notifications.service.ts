import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { NotificationEntity } from '../../database/entities/notification.entity';
import { NotificationType, NotificationChannel, NotificationStatus } from '@berry-x/types';

export interface SendNotificationDto {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepo: Repository<NotificationEntity>,
    @InjectQueue('notifications')
    private readonly notificationsQueue: Queue,
  ) {}

  async send(dto: SendNotificationDto): Promise<NotificationEntity> {
    const notification = await this.notificationsRepo.save({
      userId: dto.userId,
      type: dto.type,
      channel: dto.channel,
      status: NotificationStatus.PENDING,
      title: dto.title,
      body: dto.body,
      imageUrl: dto.imageUrl,
      data: dto.data,
      isRead: false,
    });

    await this.notificationsQueue.add('send', { notificationId: notification.id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });

    return notification;
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const [notifications, total] = await this.notificationsRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { notifications, total, unread: await this.getUnreadCount(userId) };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepo.count({ where: { userId, isRead: false } });
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.notificationsRepo.update({ id, userId }, { isRead: true, readAt: new Date() });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepo.update({ userId, isRead: false }, { isRead: true, readAt: new Date() });
  }
}
