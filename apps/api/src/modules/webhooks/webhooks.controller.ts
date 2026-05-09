import { Controller, Post, Body, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';
import { Public } from '../../common/decorators';

@ApiTags('Webhooks')
@Controller({ path: 'webhooks', version: '1' })
@Public()
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('paystack')
  @ApiOperation({ summary: 'Paystack webhook receiver' })
  paystack(
    @Body() body: Record<string, unknown>,
    @Headers('x-paystack-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = req.rawBody?.toString() || JSON.stringify(body);
    return this.webhooksService.handlePaystack(body, signature, rawBody);
  }

  @Post('monnify')
  @ApiOperation({ summary: 'Monnify webhook receiver' })
  monnify(
    @Body() body: Record<string, unknown>,
    @Headers('monnify-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = req.rawBody?.toString() || JSON.stringify(body);
    return this.webhooksService.handleMonnify(body, signature, rawBody);
  }

  @Post('flutterwave')
  @ApiOperation({ summary: 'Flutterwave webhook receiver' })
  flutterwave(
    @Body() body: Record<string, unknown>,
    @Headers('verif-hash') signature: string,
  ) {
    return this.webhooksService.handleFlutterwave(body, signature);
  }
}
