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
} from 'typeorm';
import { KycStatus, KycDocumentType } from '@berry-x/types';
import { UserEntity } from './user.entity';

@Entity('kyc_records')
@Index(['userId', 'tier'])
export class KycRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'int' })
  tier: number;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.NOT_STARTED })
  status: KycStatus;

  @Column({ nullable: true, select: false })
  bvn?: string;

  @Column({ nullable: true, select: false })
  nin?: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ nullable: true })
  address?: string;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy?: string;

  @Column({ name: 'review_notes', nullable: true })
  reviewNotes?: string;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt?: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @OneToMany(() => KycDocumentEntity, (doc) => doc.kyc, { cascade: true, eager: true })
  documents: KycDocumentEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

@Entity('kyc_documents')
export class KycDocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'kyc_id' })
  kycId: string;

  @ManyToOne(() => KycRecordEntity, (kyc) => kyc.documents)
  @JoinColumn({ name: 'kyc_id' })
  kyc: KycRecordEntity;

  @Column({ type: 'enum', enum: KycDocumentType })
  type: KycDocumentType;

  @Column({ name: 'file_url' })
  fileUrl: string;

  @Column({ name: 'file_size', type: 'int' })
  fileSize: number;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING })
  status: KycStatus;

  @Column({ name: 'verification_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  verificationScore?: number;

  @Column({ name: 'rejection_reason', nullable: true })
  rejectionReason?: string;

  @Column({ name: 'external_reference', nullable: true })
  externalReference?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
