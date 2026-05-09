import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicketEntity, TicketMessageEntity } from '../../database/entities/support.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  TicketStatus,
  TicketPriority,
  TicketCategory,
  NotificationType,
  NotificationChannel,
} from '@berry-x/types';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicketEntity)
    private readonly ticketsRepo: Repository<SupportTicketEntity>,
    @InjectRepository(TicketMessageEntity)
    private readonly messagesRepo: Repository<TicketMessageEntity>,
    private readonly notifications: NotificationsService,
  ) {}

  async createTicket(userId: string, data: {
    category: TicketCategory;
    subject: string;
    description: string;
    relatedTransactionId?: string;
    attachments?: string[];
  }): Promise<SupportTicketEntity> {
    const ticket = await this.ticketsRepo.save({
      userId,
      ...data,
      status: TicketStatus.OPEN,
      priority: TicketPriority.MEDIUM,
    });

    await this.messagesRepo.save({
      ticketId: ticket.id,
      senderId: userId,
      senderRole: 'user',
      message: data.description,
      attachments: data.attachments,
      isInternal: false,
    });

    return ticket;
  }

  async getUserTickets(userId: string, page = 1, limit = 10) {
    const [tickets, total] = await this.ticketsRepo.findAndCount({
      where: { userId },
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { tickets, total };
  }

  async getTicketWithMessages(ticketId: string, userId?: string): Promise<SupportTicketEntity & { messages: TicketMessageEntity[] }> {
    const ticket = await this.ticketsRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (userId && ticket.userId !== userId) throw new ForbiddenException('Access denied');

    const messages = await this.messagesRepo.find({
      where: { ticketId, isInternal: false },
      order: { createdAt: 'ASC' },
    });

    return { ...ticket, messages };
  }

  async addMessage(ticketId: string, senderId: string, senderRole: 'user' | 'support', message: string, attachments?: string[]): Promise<TicketMessageEntity> {
    const ticket = await this.ticketsRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const msg = await this.messagesRepo.save({ ticketId, senderId, senderRole, message, attachments, isInternal: false });

    if (senderRole === 'support' && !ticket.firstResponseAt) {
      await this.ticketsRepo.update(ticketId, { firstResponseAt: new Date(), status: TicketStatus.IN_PROGRESS });
    }

    if (senderRole === 'support') {
      await this.notifications.send({
        userId: ticket.userId,
        type: NotificationType.SUPPORT_REPLY,
        channel: NotificationChannel.PUSH,
        title: 'Support Reply',
        body: `Your ticket #${ticket.ticketNumber} has a new reply.`,
        data: { ticketId },
      });
    }

    return msg;
  }

  async updateTicketStatus(ticketId: string, status: TicketStatus, agentId: string): Promise<SupportTicketEntity> {
    const updates: Partial<SupportTicketEntity> = { status };
    if (status === TicketStatus.RESOLVED) updates.resolvedAt = new Date();
    if (status === TicketStatus.CLOSED) updates.closedAt = new Date();
    await this.ticketsRepo.update(ticketId, updates);
    return this.ticketsRepo.findOne({ where: { id: ticketId } }) as Promise<SupportTicketEntity>;
  }

  async assignTicket(ticketId: string, agentId: string): Promise<SupportTicketEntity> {
    await this.ticketsRepo.update(ticketId, { assignedTo: agentId, status: TicketStatus.IN_PROGRESS });
    return this.ticketsRepo.findOne({ where: { id: ticketId } }) as Promise<SupportTicketEntity>;
  }

  async getAllTickets(page = 1, limit = 20, status?: TicketStatus, category?: TicketCategory) {
    const where: Record<string, unknown> = {};
    if (status) where['status'] = status;
    if (category) where['category'] = category;

    const [tickets, total] = await this.ticketsRepo.findAndCount({
      where,
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });
    return { tickets, total };
  }
}
