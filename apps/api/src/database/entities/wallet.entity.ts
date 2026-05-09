import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WalletCurrency, WalletStatus, WalletType } from '@berry-x/types';
import { UserEntity } from './user.entity';

@Entity('wallets')
@Index(['userId', 'currency', 'type'])
export class WalletEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'enum', enum: WalletCurrency })
  currency: WalletCurrency;

  @Column({ type: 'enum', enum: WalletType, default: WalletType.FIAT })
  type: WalletType;

  @Column({ type: 'enum', enum: WalletStatus, default: WalletStatus.ACTIVE })
  status: WalletStatus;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  balance: number;

  @Column({ name: 'ledger_balance', type: 'decimal', precision: 20, scale: 8, default: 0 })
  ledgerBalance: number;

  @Column({ name: 'pending_balance', type: 'decimal', precision: 20, scale: 8, default: 0 })
  pendingBalance: number;

  @Column({ name: 'total_deposited', type: 'decimal', precision: 20, scale: 8, default: 0 })
  totalDeposited: number;

  @Column({ name: 'total_withdrawn', type: 'decimal', precision: 20, scale: 8, default: 0 })
  totalWithdrawn: number;

  @Column({ name: 'wallet_tag', nullable: true, unique: true })
  walletTag?: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ type: 'int', name: 'version', default: 1 })
  version: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
