import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MerchantService } from './merchant.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { IUser } from '@berry-x/types';

@ApiTags('Merchant')
@Controller({ path: 'merchant', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Post('qr/generate')
  @ApiOperation({ summary: 'Generate QR payment code' })
  generateQr(@CurrentUser() user: IUser, @Body() body: { amount?: number; description?: string }) {
    return this.merchantService.generateQrPaymentData(user.id, body.amount, body.description);
  }
}
