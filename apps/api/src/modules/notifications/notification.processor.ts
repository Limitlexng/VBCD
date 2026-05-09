import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { NotificationEntity } from '../../database/entities/notification.entity';
import { NotificationChannel, NotificationStatus } from '@berry-x/types';

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepo: Repository<NotificationEntity>,
    private readonly config: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: config.get('app.smtpHost'),
      port: config.get<number>('app.smtpPort'),
      auth: { user: config.get('app.smtpUser'), pass: config.get('app.smtpPass') },
    });
  }

  @Process('send')
  async processNotification(job: Job<{ notificationId: string }>) {
    const notification = await this.notificationsRepo.findOne({ where: { id: job.data.notificationId } });
    if (!notification) return;

    try {
      if (notification.channel === NotificationChannel.EMAIL) {
        await this.sendEmail(notification);
      } else if (notification.channel === NotificationChannel.PUSH) {
        await this.sendPush(notification);
      } else if (notification.channel === NotificationChannel.SMS) {
        await this.sendSms(notification);
      }

      await this.notificationsRepo.update(notification.id, {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to send notification ${notification.id}: ${(error as Error).message}`);
      await this.notificationsRepo.update(notification.id, { status: NotificationStatus.FAILED });
      throw error;
    }
  }

  private async sendEmail(notification: NotificationEntity) {
    const userEmail = notification.data?.['email'] as string;
    if (!userEmail) return;

    await this.transporter.sendMail({
      from: `"${this.config.get('app.emailFromName')}" <${this.config.get('app.emailFrom')}>`,
      to: userEmail,
      subject: notification.title,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>${notification.title}</h2>
        <p>${notification.body}</p>
        <hr/>
        <small>Berry X — Nigeria's smartest fintech platform</small>
      </div>`,
    });
  }

  private async sendPush(notification: NotificationEntity) {
    // Firebase Cloud Messaging or OneSignal integration placeholder
    this.logger.log(`Push notification sent to user ${notification.userId}: ${notification.title}`);
  }

  private async sendSms(notification: NotificationEntity) {
    // Termii SMS integration placeholder
    this.logger.log(`SMS notification sent to user ${notification.userId}: ${notification.body}`);
  }
}
