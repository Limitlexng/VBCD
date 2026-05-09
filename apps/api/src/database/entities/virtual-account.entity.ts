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
import { VirtualAccountStatus } from '@berry-x/types';
import { UserEntity } from './user.entity';
import { WalletEntity } from './wallet.entity';

@Entity('virtual_accounts')
@Index(['userId'])
@Index(['accountNumber'], { unique: true })
export class VirtualAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ name: 'account_number', unique: true })
  accountNumber: string;

  @Column({ name: 'account_name' })
  accountName: string;

  @Column({ name: 'bank_name' })
  bankName: string;

  @Column({ name: 'bank_code' })
  bankCode: string;

  @Column({ type: 'enum', enum: VirtualAccountStatus, default: VirtualAccountStatus.ACTIVE })
  status: VirtualAccountStatus;

  @Column()
  provider: string;

  @Column({ name: 'external_reference' })
  externalReference: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
