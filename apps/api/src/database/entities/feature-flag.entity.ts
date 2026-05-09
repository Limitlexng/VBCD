import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FeatureKey } from '@berry-x/types';

@Entity('feature_flags')
export class FeatureFlagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: FeatureKey, unique: true })
  key: FeatureKey;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'is_enabled', default: true })
  isEnabled: boolean;

  @Column({ name: 'maintenance_message', nullable: true })
  maintenanceMessage?: string;

  @Column({ name: 'rollout_percentage', type: 'int', default: 100 })
  rolloutPercentage: number;

  @Column({ name: 'allowed_tiers', type: 'simple-array', nullable: true })
  allowedTiers?: string[];

  @Column({ name: 'allowed_regions', type: 'simple-array', nullable: true })
  allowedRegions?: string[];

  @Column({ name: 'allowed_roles', type: 'simple-array', nullable: true })
  allowedRoles?: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

@Entity('dynamic_configs')
export class DynamicConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column({ type: 'jsonb' })
  value: unknown;

  @Column({ nullable: true })
  description?: string;

  @Column()
  category: string;

  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
