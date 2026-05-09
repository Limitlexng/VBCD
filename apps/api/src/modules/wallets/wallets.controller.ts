import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { IUser, WalletCurrency } from '@berry-x/types';

@ApiTags('Wallets')
@Controller({ path: 'wallets', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all wallets for current user' })
  getMyWallets(@CurrentUser() user: IUser) {
    return this.walletsService.getUserWallets(user.id);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get NGN wallet balance' })
  getBalance(@CurrentUser() user: IUser) {
    return this.walletsService.getWalletBalance(user.id, WalletCurrency.NGN);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get wallet by ID' })
  getWallet(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.walletsService.getWalletById(id, user.id);
  }

  @Get(':id/ledger')
  @ApiOperation({ summary: 'Get wallet ledger entries' })
  getLedger(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.walletsService.getLedger(id, page, limit);
  }
}
