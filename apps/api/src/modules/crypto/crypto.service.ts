import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptoTradeEntity, EscrowEntity } from '../../database/entities/crypto.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import {
  CryptoCurrency,
  TradeType,
  TradeStatus,
  EscrowStatus,
  FeatureKey,
  ICryptoRate,
  NotificationType,
  NotificationChannel,
} from '@berry-x/types';

const MOCK_RATES: Record<CryptoCurrency, { buy: number; sell: number }> = {
  [CryptoCurrency.BTC]: { buy: 95000000, sell: 93000000 },
  [CryptoCurrency.ETH]: { buy: 5000000, sell: 4900000 },
  [CryptoCurrency.USDT]: { buy: 1620, sell: 1600 },
  [CryptoCurrency.USDC]: { buy: 1620, sell: 1600 },
  [CryptoCurrency.BNB]: { buy: 900000, sell: 880000 },
  [CryptoCurrency.SOL]: { buy: 200000, sell: 195000 },
};

@Injectable()
export class CryptoService {
  constructor(
    @InjectRepository(CryptoTradeEntity)
    private readonly tradesRepo: Repository<CryptoTradeEntity>,
    @InjectRepository(EscrowEntity)
    private readonly escrowRepo: Repository<EscrowEntity>,
    private readonly notifications: NotificationsService,
    private readonly featureFlags: FeatureFlagsService,
  ) {}

  async getRates(): Promise<ICryptoRate[]> {
    return Object.entries(MOCK_RATES).map(([currency, rates]) => ({
      currency: currency as CryptoCurrency,
      buyRate: rates.buy,
      sellRate: rates.sell,
      marketRate: (rates.buy + rates.sell) / 2,
      spread: rates.buy - rates.sell,
      updatedAt: new Date(),
    }));
  }

  async getRate(currency: CryptoCurrency): Promise<ICryptoRate> {
    const rates = MOCK_RATES[currency];
    return {
      currency,
      buyRate: rates.buy,
      sellRate: rates.sell,
      marketRate: (rates.buy + rates.sell) / 2,
      spread: rates.buy - rates.sell,
      updatedAt: new Date(),
    };
  }

  async createTrade(userId: string, data: {
    type: TradeType;
    cryptoCurrency: CryptoCurrency;
    cryptoAmount: number;
    paymentMethod: string;
    paymentWindow?: number;
    termsOfTrade?: string;
  }): Promise<CryptoTradeEntity> {
    await this.featureFlags.requireFeature(
      data.type === TradeType.BUY ? FeatureKey.CRYPTO_BUY : FeatureKey.CRYPTO_SELL,
    );

    const rate = await this.getRate(data.cryptoCurrency);
    const appliedRate = data.type === TradeType.BUY ? rate.buyRate : rate.sellRate;
    const fiatAmount = data.cryptoAmount * appliedRate;

    const reference = `P2P-${Date.now().toString(36).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return this.tradesRepo.save({
      reference,
      creatorId: userId,
      type: data.type,
      cryptoCurrency: data.cryptoCurrency,
      fiatCurrency: 'NGN',
      cryptoAmount: data.cryptoAmount,
      fiatAmount,
      rate: appliedRate,
      minAmount: fiatAmount * 0.1,
      maxAmount: fiatAmount,
      status: TradeStatus.OPEN,
      paymentMethod: data.paymentMethod,
      paymentWindow: data.paymentWindow || 30,
      termsOfTrade: data.termsOfTrade,
      expiresAt,
    });
  }

  async getTrades(status?: TradeStatus, type?: TradeType, page = 1, limit = 20) {
    const where: Record<string, unknown> = {};
    if (status) where['status'] = status;
    if (type) where['type'] = type;

    const [trades, total] = await this.tradesRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { trades, total };
  }

  async acceptTrade(tradeId: string, takerId: string): Promise<CryptoTradeEntity> {
    const trade = await this.tradesRepo.findOne({ where: { id: tradeId } });
    if (!trade) throw new NotFoundException('Trade not found');
    if (trade.status !== TradeStatus.OPEN) throw new BadRequestException('Trade is not available');
    if (trade.creatorId === takerId) throw new BadRequestException('Cannot accept your own trade');

    await this.tradesRepo.update(tradeId, { status: TradeStatus.LOCKED, takerId });

    const escrow = await this.escrowRepo.save({
      tradeId,
      sellerId: trade.type === TradeType.SELL ? trade.creatorId : takerId,
      buyerId: trade.type === TradeType.BUY ? trade.creatorId : takerId,
      cryptoCurrency: trade.cryptoCurrency,
      amount: trade.cryptoAmount,
      status: EscrowStatus.LOCKED,
    });

    await this.tradesRepo.update(tradeId, { escrowId: escrow.id });

    await this.notifications.send({
      userId: trade.creatorId,
      type: NotificationType.TRADE_UPDATE,
      channel: NotificationChannel.PUSH,
      title: 'Trade Accepted',
      body: `Your ${trade.cryptoCurrency} trade has been accepted. Complete the payment within ${trade.paymentWindow} minutes.`,
      data: { tradeId },
    });

    return this.tradesRepo.findOne({ where: { id: tradeId } }) as Promise<CryptoTradeEntity>;
  }

  async releaseTrade(tradeId: string, userId: string): Promise<CryptoTradeEntity> {
    const trade = await this.tradesRepo.findOne({ where: { id: tradeId } });
    if (!trade) throw new NotFoundException('Trade not found');
    if (trade.status !== TradeStatus.LOCKED) throw new BadRequestException('Trade is not locked');

    const escrow = await this.escrowRepo.findOne({ where: { tradeId } });
    if (escrow) await this.escrowRepo.update(escrow.id, { status: EscrowStatus.RELEASED, releasedAt: new Date() });

    await this.tradesRepo.update(tradeId, { status: TradeStatus.COMPLETED, completedAt: new Date() });

    return this.tradesRepo.findOne({ where: { id: tradeId } }) as Promise<CryptoTradeEntity>;
  }
}
