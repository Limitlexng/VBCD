import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { WalletEntity } from '../../database/entities/wallet.entity';
import { LedgerEntryEntity } from '../../database/entities/ledger.entity';
import { TransactionEntity } from '../../database/entities/transaction.entity';
import { UserEntity } from '../../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletEntity, LedgerEntryEntity, TransactionEntity, UserEntity]),
    BullModule.registerQueue({ name: 'transactions' }),
  ],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
