import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { LedgerEntryType } from '@berry-x/types';
import { WalletEntity } from './wallet.entity';
import { TransactionEntity } from './transaction.entity';

@Entity('ledger_entries')
@Index(['walletId', 'createdAt'])
@Index(['transactionId'])
export class LedgerEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'wallet_id' })
  @Index()
  walletId: string;

  @ManyToOne(() => WalletEntity)
  @JoinColumn({ name: 'wallet_id' })
  wallet: WalletEntity;

  @Column({ name: 'transaction_id' })
  transactionId: string;

  @ManyToOne(() => TransactionEntity)
  @JoinColumn({ name: 'transaction_id' })
  transaction: TransactionEntity;

  @Column({ type: 'enum', enum: LedgerEntryType })
  type: LedgerEntryType;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  amount: number;

  @Column({ name: 'balance_before', type: 'decimal', precision: 20, scale: 8 })
  balanceBefore: number;

  @Column({ name: 'balance_after', type: 'decimal', precision: 20, scale: 8 })
  balanceAfter: number;

  @Column()
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
