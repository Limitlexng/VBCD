import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptoController } from './crypto.controller';
import { CryptoService } from './crypto.service';
import { CryptoTradeEntity, EscrowEntity } from '../../database/entities/crypto.entity';
import { WalletsModule } from '../wallets/wallets.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CryptoTradeEntity, EscrowEntity]),
    WalletsModule,
    NotificationsModule,
    FeatureFlagsModule,
  ],
  controllers: [CryptoController],
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
