import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CryptoCurrency, TradeType, TradeStatus, EscrowStatus } from '@berry-x/types';

@Entity('crypto_trades')
@Index(['creatorId', 'status'])
@Index(['status', 'type'])
@Index(['reference'], { unique: true })
export class CryptoTradeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  reference: string;

  @Column({ name: 'creator_id' })
  @Index()
  creatorId: string;

  @Column({ name: 'taker_id', nullable: true })
  takerId?: string;

  @Column({ type: 'enum', enum: TradeType })
  type: TradeType;

  @Column({ name: 'crypto_currency', type: 'enum', enum: CryptoCurrency })
  cryptoCurrency: CryptoCurrency;

  @Column({ name: 'fiat_currency', default: 'NGN' })
  fiatCurrency: string;

  @Column({ name: 'crypto_amount', type: 'decimal', precision: 20, scale: 8 })
  cryptoAmount: number;

  @Column({ name: 'fiat_amount', type: 'decimal', precision: 20, scale: 2 })
  fiatAmount: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  rate: number;

  @Column({ name: 'min_amount', type: 'decimal', precision: 20, scale: 2 })
  minAmount: number;

  @Column({ name: 'max_amount', type: 'decimal', precision: 20, scale: 2 })
  maxAmount: number;

  @Column({ type: 'enum', enum: TradeStatus, default: TradeStatus.OPEN })
  status: TradeStatus;

  @Column({ name: 'payment_method' })
  paymentMethod: string;

  @Column({ name: 'payment_window', type: 'int', default: 30 })
  paymentWindow: number;

  @Column({ name: 'escrow_id', nullable: true })
  escrowId?: string;

  @Column({ name: 'dispute_id', nullable: true })
  disputeId?: string;

  @Column({ name: 'terms_of_trade', type: 'text', nullable: true })
  termsOfTrade?: string;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

@Entity('escrows')
export class EscrowEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trade_id', unique: true })
  tradeId: string;

  @Column({ name: 'seller_id' })
  sellerId: string;

  @Column({ name: 'buyer_id' })
  buyerId: string;

  @Column({ name: 'crypto_currency', type: 'enum', enum: CryptoCurrency })
  cryptoCurrency: CryptoCurrency;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  amount: number;

  @Column({ type: 'enum', enum: EscrowStatus, default: EscrowStatus.LOCKED })
  status: EscrowStatus;

  @Column({ name: 'released_at', type: 'timestamptz', nullable: true })
  releasedAt?: Date;

  @Column({ name: 'refunded_at', type: 'timestamptz', nullable: true })
  refundedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
