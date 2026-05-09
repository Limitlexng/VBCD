import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { BaseProvider, PaymentPayload, PaymentResult } from '../provider-orchestrator.service';
import { ProviderName } from '@berry-x/types';

@Injectable()
export class MonnifyProvider implements BaseProvider {
  private readonly logger = new Logger(MonnifyProvider.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly contractCode: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = config.get('app.monnifyBaseUrl', 'https://api.monnify.com');
    this.apiKey = config.get('app.monnifyApiKey', '');
    this.secretKey = config.get('app.monnifySecretKey', '');
    this.contractCode = config.get('app.monnifyContractCode', '');
  }

  getName(): ProviderName {
    return ProviderName.MONNIFY;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    const credentials = Buffer.from(`${this.apiKey}:${this.secretKey}`).toString('base64');
    const { data } = await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/api/v1/auth/login`,
        {},
        { headers: { Authorization: `Basic ${credentials}` } },
      ),
    );

    this.accessToken = data.responseBody?.accessToken;
    this.tokenExpiry = new Date(Date.now() + (data.responseBody?.expiresIn || 3600) * 1000);
    return this.accessToken!;
  }

  async initializePayment(payload: PaymentPayload): Promise<PaymentResult> {
    try {
      const token = await this.getAccessToken();
      const { data } = await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/api/v1/merchant/transactions/init-transaction`,
          {
            amount: payload.amount,
            customerName: payload.metadata?.['name'] || 'Customer',
            customerEmail: payload.email,
            paymentReference: payload.reference,
            paymentDescription: payload.metadata?.['description'] || 'Payment',
            currencyCode: payload.currency || 'NGN',
            contractCode: this.contractCode,
            redirectUrl: payload.callbackUrl,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      );

      return {
        success: data.requestSuccessful,
        reference: payload.reference,
        providerReference: data.responseBody?.transactionReference,
        paymentUrl: data.responseBody?.checkoutUrl,
        status: data.requestSuccessful ? 'pending' : 'failed',
        provider: ProviderName.MONNIFY,
        rawResponse: data,
      };
    } catch (error) {
      this.logger.error(`Monnify initializePayment: ${(error as Error).message}`);
      return { success: false, reference: payload.reference, status: 'failed', provider: ProviderName.MONNIFY };
    }
  }

  async verifyPayment(reference: string): Promise<PaymentResult> {
    try {
      const token = await this.getAccessToken();
      const encoded = encodeURIComponent(reference);
      const { data } = await firstValueFrom(
        this.http.get(`${this.baseUrl}/api/v2/transactions/${encoded}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      return {
        success: data.responseBody?.paymentStatus === 'PAID',
        reference,
        status: data.responseBody?.paymentStatus,
        provider: ProviderName.MONNIFY,
        rawResponse: data,
      };
    } catch (error) {
      return { success: false, reference, status: 'failed', provider: ProviderName.MONNIFY };
    }
  }

  async createVirtualAccount(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const token = await this.getAccessToken();
    const { data } = await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/api/v2/bank-transfer/reserved-accounts`,
        { ...params, contractCode: this.contractCode },
        { headers: { Authorization: `Bearer ${token}` } },
      ),
    );
    return data.responseBody;
  }

  async initiateBankTransfer(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const token = await this.getAccessToken();
    const { data } = await firstValueFrom(
      this.http.post(`${this.baseUrl}/api/v2/disbursements/single`, params, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    return data.responseBody;
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    const computedHash = crypto
      .createHmac('sha512', this.secretKey)
      .update(body)
      .digest('hex');
    return computedHash === signature;
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch {
      return false;
    }
  }
}
