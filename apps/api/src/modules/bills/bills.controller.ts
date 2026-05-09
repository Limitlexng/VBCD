import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillsService } from './bills.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { IUser } from '@berry-x/types';

@ApiTags('Bills')
@Controller({ path: 'bills', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Get('data-plans')
  @ApiOperation({ summary: 'Get data plans for a network' })
  getDataPlans(@Query('network') network: string) {
    return this.billsService.getDataPlans(network);
  }

  @Post('airtime')
  @ApiOperation({ summary: 'Purchase airtime' })
  purchaseAirtime(@CurrentUser() user: IUser, @Body() body: { walletId: string; phone: string; amount: number; network: string; pin: string }) {
    return this.billsService.purchaseAirtime({ ...body, userId: user.id });
  }

  @Post('data')
  @ApiOperation({ summary: 'Purchase data bundle' })
  purchaseData(@CurrentUser() user: IUser, @Body() body: { walletId: string; phone: string; planCode: string; planName: string; amount: number; network: string; pin: string }) {
    return this.billsService.purchaseData({ ...body, userId: user.id });
  }

  @Post('electricity')
  @ApiOperation({ summary: 'Pay electricity bill' })
  payElectricity(@CurrentUser() user: IUser, @Body() body: { walletId: string; meterNumber: string; disco: string; amount: number; meterType: 'prepaid' | 'postpaid'; pin: string }) {
    return this.billsService.payElectricity({ ...body, userId: user.id });
  }

  @Post('cable-tv')
  @ApiOperation({ summary: 'Pay cable TV subscription' })
  payCableTV(@CurrentUser() user: IUser, @Body() body: { walletId: string; smartcardNumber: string; provider: string; planCode: string; planName: string; amount: number; pin: string }) {
    return this.billsService.payCableTV({ ...body, userId: user.id });
  }
}
