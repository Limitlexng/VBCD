import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UserEntity } from '../../database/entities/user.entity';
import { TransactionEntity } from '../../database/entities/transaction.entity';
import { WalletEntity } from '../../database/entities/wallet.entity';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';
import { UsersModule } from '../users/users.module';
import { WalletsModule } from '../wallets/wallets.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, TransactionEntity, WalletEntity, AuditLogEntity]),
    UsersModule,
    WalletsModule,
    NotificationsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
