import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { UserStatus, UserTier, UserRole } from '@berry-x/types';

@Entity('users')
@Index(['email'], { unique: true, where: '"deleted_at" IS NULL' })
@Index(['phone'], { unique: true, where: '"deleted_at" IS NULL' })
@Index(['referralCode'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  phone: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true, unique: true })
  username?: string;

  @Column({ select: false })
  password: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING_VERIFICATION })
  status: UserStatus;

  @Column({ type: 'int', default: UserTier.TIER_0 })
  tier: UserTier;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'is_phone_verified', default: false })
  isPhoneVerified: boolean;

  @Column({ name: 'is_two_factor_enabled', default: false })
  isTwoFactorEnabled: boolean;

  @Column({ name: 'two_factor_secret', nullable: true, select: false })
  twoFactorSecret?: string;

  @Column({ name: 'transaction_pin', nullable: true, select: false })
  transactionPin?: string;

  @Column({ name: 'referral_code', unique: true })
  referralCode: string;

  @Column({ name: 'referred_by', nullable: true })
  referredBy?: string;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'device_id', nullable: true })
  deviceId?: string;

  @Column({ name: 'failed_pin_attempts', default: 0 })
  failedPinAttempts: number;

  @Column({ name: 'pin_locked_until', type: 'timestamptz', nullable: true })
  pinLockedUntil?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;

  @BeforeInsert()
  generateDefaults() {
    if (!this.id) this.id = uuidv4();
    if (!this.referralCode) this.referralCode = this.generateReferralCode();
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async comparePassword(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.password);
  }

  async comparePin(plain: string): Promise<boolean> {
    if (!this.transactionPin) return false;
    return bcrypt.compare(plain, this.transactionPin);
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}
