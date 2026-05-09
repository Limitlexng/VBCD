import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';
import { TransactionEntity } from '../../database/entities/transaction.entity';
import { WalletsModule } from '../wallets/wallets.module';
import { ProvidersModule } from '../providers/providers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionEntity]),
    BullModule.registerQueue({ name: 'bills' }),
    WalletsModule,
    ProvidersModule,
    NotificationsModule,
    FeatureFlagsModule,
  ],
  controllers: [BillsController],
  providers: [BillsService],
  exports: [BillsService],
})
export class BillsModule {}
