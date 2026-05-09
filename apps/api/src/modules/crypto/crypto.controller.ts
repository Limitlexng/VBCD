import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CryptoService } from './crypto.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { IUser, CryptoCurrency, TradeType, TradeStatus } from '@berry-x/types';

@ApiTags('Crypto')
@Controller({ path: 'crypto', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Get('rates')
  @ApiOperation({ summary: 'Get current crypto rates' })
  getRates() {
    return this.cryptoService.getRates();
  }

  @Get('rates/:currency')
  @ApiOperation({ summary: 'Get rate for a specific crypto' })
  getRate(@Param('currency') currency: CryptoCurrency) {
    return this.cryptoService.getRate(currency);
  }

  @Get('trades')
  @ApiOperation({ summary: 'Get open P2P trades' })
  getTrades(
    @Query('status') status?: TradeStatus,
    @Query('type') type?: TradeType,
    @Query('page') page = 1,
  ) {
    return this.cryptoService.getTrades(status, type, Number(page));
  }

  @Post('trades')
  @ApiOperation({ summary: 'Create a P2P trade' })
  createTrade(
    @CurrentUser() user: IUser,
    @Body() body: {
      type: TradeType;
      cryptoCurrency: CryptoCurrency;
      cryptoAmount: number;
      paymentMethod: string;
      paymentWindow?: number;
      termsOfTrade?: string;
    },
  ) {
    return this.cryptoService.createTrade(user.id, body);
  }

  @Post('trades/:id/accept')
  @ApiOperation({ summary: 'Accept a P2P trade' })
  acceptTrade(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.cryptoService.acceptTrade(id, user.id);
  }

  @Patch('trades/:id/release')
  @ApiOperation({ summary: 'Release crypto from escrow' })
  releaseTrade(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.cryptoService.releaseTrade(id, user.id);
  }
}
