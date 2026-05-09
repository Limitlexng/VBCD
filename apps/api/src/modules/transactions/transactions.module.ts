import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionProcessor } from './transaction.processor';
import { TransactionEntity, TransactionTimelineEntity } from '../../database/entities/transaction.entity';
import { WalletsModule } from '../wallets/wallets.module';
import { ProvidersModule } from '../providers/providers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionEntity, TransactionTimelineEntity]),
    BullModule.registerQueue(
      { name: 'transactions' },
      { name: 'transaction-verification' },
      { name: 'transaction-retry' },
    ),
    WalletsModule,
    ProvidersModule,
    NotificationsModule,
    FeatureFlagsModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionProcessor],
  exports: [TransactionsService],
})
export class TransactionsModule {}
