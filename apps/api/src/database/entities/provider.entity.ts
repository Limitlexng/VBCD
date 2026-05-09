import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProviderName, ProviderStatus, ProviderServiceType } from '@berry-x/types';

@Entity('providers')
export class ProviderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ProviderName, unique: true })
  name: ProviderName;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ type: 'enum', enum: ProviderStatus, default: ProviderStatus.ACTIVE })
  status: ProviderStatus;

  @Column({ name: 'is_enabled', default: true })
  isEnabled: boolean;

  @Column({ name: 'is_sandbox', default: false })
  isSandbox: boolean;

  @Column({ default: 100 })
  priority: number;

  @Column({ name: 'supported_services', type: 'simple-array' })
  supportedServices: ProviderServiceType[];

  @Column({ name: 'api_key_encrypted', nullable: true, select: false })
  apiKeyEncrypted?: string;

  @Column({ name: 'secret_key_encrypted', nullable: true, select: false })
  secretKeyEncrypted?: string;

  @Column({ name: 'webhook_secret', nullable: true, select: false })
  webhookSecret?: string;

  @Column({ name: 'base_url' })
  baseUrl: string;

  @Column({ name: 'success_rate', type: 'decimal', precision: 5, scale: 2, default: 100 })
  successRate: number;

  @Column({ name: 'avg_response_time', type: 'int', default: 0 })
  avgResponseTime: number;

  @Column({ name: 'maintenance_message', nullable: true })
  maintenanceMessage?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

@Entity('provider_health_logs')
export class ProviderHealthLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'provider_id' })
  providerId: string;

  @Column({ type: 'enum', enum: ProviderServiceType })
  service: ProviderServiceType;

  @Column({ name: 'is_healthy' })
  isHealthy: boolean;

  @Column({ name: 'response_time', type: 'int' })
  responseTime: number;

  @Column({ name: 'status_code', nullable: true })
  statusCode?: number;

  @Column({ name: 'error_message', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'checked_at', type: 'timestamptz' })
  checkedAt: Date;
}

@Entity('payment_routes')
export class PaymentRouteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ProviderServiceType, unique: true })
  service: ProviderServiceType;

  @Column({ name: 'primary_provider_id' })
  primaryProviderId: string;

  @Column({ name: 'fallback_provider_ids', type: 'simple-array', nullable: true })
  fallbackProviderIds: string[];

  @Column({ type: 'jsonb', nullable: true })
  conditions?: Record<string, unknown>;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
