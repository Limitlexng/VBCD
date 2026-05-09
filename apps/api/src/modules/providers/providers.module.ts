import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { ProviderOrchestrator } from './provider-orchestrator.service';
import { PaystackProvider } from './adapters/paystack.provider';
import { MonnifyProvider } from './adapters/monnify.provider';
import { FlutterwaveProvider } from './adapters/flutterwave.provider';
import { ProviderHealthService } from './provider-health.service';
import { ProviderEntity, ProviderHealthLogEntity, PaymentRouteEntity } from '../../database/entities/provider.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProviderEntity, ProviderHealthLogEntity, PaymentRouteEntity]),
    HttpModule.register({ timeout: 30000, maxRedirects: 3 }),
  ],
  controllers: [ProvidersController],
  providers: [
    ProvidersService,
    ProviderOrchestrator,
    ProviderHealthService,
    PaystackProvider,
    MonnifyProvider,
    FlutterwaveProvider,
  ],
  exports: [ProvidersService, ProviderOrchestrator],
})
export class ProvidersModule {}
