import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { TicketStatus, TicketPriority, TicketCategory } from '@berry-x/types';
import { UserEntity } from './user.entity';

@Entity('support_tickets')
@Index(['userId', 'status'])
@Index(['ticketNumber'], { unique: true })
export class SupportTicketEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_number', unique: true })
  ticketNumber: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'assigned_to', nullable: true })
  assignedTo?: string;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Column({ type: 'enum', enum: TicketCategory })
  category: TicketCategory;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'related_transaction_id', nullable: true })
  relatedTransactionId?: string;

  @Column({ type: 'simple-array', nullable: true })
  attachments?: string[];

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt?: Date;

  @Column({ name: 'first_response_at', type: 'timestamptz', nullable: true })
  firstResponseAt?: Date;

  @OneToMany(() => TicketMessageEntity, (msg) => msg.ticket, { cascade: true })
  messages: TicketMessageEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @BeforeInsert()
  generateTicketNumber() {
    const date = new Date();
    const prefix = 'BX';
    const timestamp = date.getTime().toString(36).toUpperCase();
    this.ticketNumber = `${prefix}-${timestamp}`;
  }
}

@Entity('ticket_messages')
@Index(['ticketId', 'createdAt'])
export class TicketMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_id' })
  @Index()
  ticketId: string;

  @ManyToOne(() => SupportTicketEntity, (t) => t.messages)
  @JoinColumn({ name: 'ticket_id' })
  ticket: SupportTicketEntity;

  @Column({ name: 'sender_id' })
  senderId: string;

  @Column({ name: 'sender_role', type: 'varchar' })
  senderRole: 'user' | 'support' | 'system';

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'simple-array', nullable: true })
  attachments?: string[];

  @Column({ name: 'is_internal', default: false })
  isInternal: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
