import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { WalletEntity } from './entities/wallet.entity';
import { TransactionEntity, TransactionTimelineEntity } from './entities/transaction.entity';
import { LedgerEntryEntity } from './entities/ledger.entity';
import { ProviderEntity, ProviderHealthLogEntity, PaymentRouteEntity } from './entities/provider.entity';
import { FeatureFlagEntity, DynamicConfigEntity } from './entities/feature-flag.entity';
import { KycRecordEntity, KycDocumentEntity } from './entities/kyc.entity';
import { VirtualAccountEntity } from './entities/virtual-account.entity';
import { NotificationEntity } from './entities/notification.entity';
import { SupportTicketEntity, TicketMessageEntity } from './entities/support.entity';
import { CryptoTradeEntity, EscrowEntity } from './entities/crypto.entity';
import { AuditLogEntity } from './entities/audit-log.entity';

export const ALL_ENTITIES = [
  UserEntity,
  WalletEntity,
  TransactionEntity,
  TransactionTimelineEntity,
  LedgerEntryEntity,
  ProviderEntity,
  ProviderHealthLogEntity,
  PaymentRouteEntity,
  FeatureFlagEntity,
  DynamicConfigEntity,
  KycRecordEntity,
  KycDocumentEntity,
  VirtualAccountEntity,
  NotificationEntity,
  SupportTicketEntity,
  TicketMessageEntity,
  CryptoTradeEntity,
  EscrowEntity,
  AuditLogEntity,
];

@Module({
  imports: [TypeOrmModule.forFeature(ALL_ENTITIES)],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
