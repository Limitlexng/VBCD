import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { TransactionType, TransactionStatus, TransactionChannel } from '@berry-x/types';
import { UserEntity } from './user.entity';
import { WalletEntity } from './wallet.entity';

@Entity('transactions')
@Index(['userId', 'createdAt'])
@Index(['reference'], { unique: true })
@Index(['idempotencyKey'], { unique: true })
@Index(['status', 'createdAt'])
@Index(['type', 'status'])
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  reference: string;

  @Column({ name: 'idempotency_key', unique: true })
  idempotencyKey: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'wallet_id' })
  walletId: string;

  @ManyToOne(() => WalletEntity)
  @JoinColumn({ name: 'wallet_id' })
  wallet: WalletEntity;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ type: 'enum', enum: TransactionChannel, default: TransactionChannel.APP })
  channel: TransactionChannel;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  amount: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  fee: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 20, scale: 8 })
  totalAmount: number;

  @Column({ default: 'NGN' })
  currency: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  narration?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'provider_id', nullable: true })
  providerId?: string;

  @Column({ name: 'provider_reference', nullable: true })
  providerReference?: string;

  @Column({ name: 'provider_status', nullable: true })
  providerStatus?: string;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retries', default: 3 })
  maxRetries: number;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'device_id', nullable: true })
  deviceId?: string;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ name: 'failed_at', type: 'timestamptz', nullable: true })
  failedAt?: Date;

  @Column({ name: 'reversed_at', type: 'timestamptz', nullable: true })
  reversedAt?: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

@Entity('transaction_timelines')
@Index(['transactionId', 'createdAt'])
export class TransactionTimelineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transaction_id' })
  @Index()
  transactionId: string;

  @ManyToOne(() => TransactionEntity)
  @JoinColumn({ name: 'transaction_id' })
  transaction: TransactionEntity;

  @Column({ type: 'enum', enum: TransactionStatus })
  status: TransactionStatus;

  @Column()
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
