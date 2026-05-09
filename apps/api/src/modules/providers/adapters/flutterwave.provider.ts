import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { BaseProvider, PaymentPayload, PaymentResult } from '../provider-orchestrator.service';
import { ProviderName } from '@berry-x/types';

@Injectable()
export class FlutterwaveProvider implements BaseProvider {
  private readonly logger = new Logger(FlutterwaveProvider.name);
  private readonly baseUrl: string;
  private readonly secretKey: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = config.get('app.flutterwaveBaseUrl', 'https://api.flutterwave.com/v3');
    this.secretKey = config.get('app.flutterwaveSecretKey', '');
  }

  getName(): ProviderName {
    return ProviderName.FLUTTERWAVE;
  }

  private getHeaders() {
    return { Authorization: `Bearer ${this.secretKey}`, 'Content-Type': 'application/json' };
  }

  async initializePayment(payload: PaymentPayload): Promise<PaymentResult> {
    try {
      const { data } = await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/payments`,
          {
            tx_ref: payload.reference,
            amount: payload.amount,
            currency: payload.currency || 'NGN',
            redirect_url: payload.callbackUrl,
            customer: { email: payload.email, phonenumber: payload.phone },
            meta: payload.metadata,
          },
          { headers: this.getHeaders() },
        ),
      );

      return {
        success: data.status === 'success',
        reference: payload.reference,
        paymentUrl: data.data?.link,
        status: data.status === 'success' ? 'pending' : 'failed',
        provider: ProviderName.FLUTTERWAVE,
        rawResponse: data,
      };
    } catch (error) {
      this.logger.error(`Flutterwave initializePayment: ${(error as Error).message}`);
      return { success: false, reference: payload.reference, status: 'failed', provider: ProviderName.FLUTTERWAVE };
    }
  }

  async verifyPayment(reference: string): Promise<PaymentResult> {
    try {
      const { data } = await firstValueFrom(
        this.http.get(`${this.baseUrl}/transactions/verify_by_reference?tx_ref=${reference}`, {
          headers: this.getHeaders(),
        }),
      );

      return {
        success: data.data?.status === 'successful',
        reference,
        providerReference: data.data?.id?.toString(),
        status: data.data?.status,
        provider: ProviderName.FLUTTERWAVE,
        rawResponse: data,
      };
    } catch (error) {
      return { success: false, reference, status: 'failed', provider: ProviderName.FLUTTERWAVE };
    }
  }

  async createVirtualAccount(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data } = await firstValueFrom(
      this.http.post(`${this.baseUrl}/virtual-account-numbers`, params, { headers: this.getHeaders() }),
    );
    return data.data;
  }

  async initiateBankTransfer(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data } = await firstValueFrom(
      this.http.post(`${this.baseUrl}/transfers`, params, { headers: this.getHeaders() }),
    );
    return data.data;
  }

  async getBanks(country = 'NG'): Promise<Record<string, unknown>[]> {
    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/banks/${country}`, { headers: this.getHeaders() }),
    );
    return data.data;
  }

  async isHealthy(): Promise<boolean> {
    try {
      await firstValueFrom(this.http.get(`${this.baseUrl}/banks/NG?per_page=1`, { headers: this.getHeaders() }));
      return true;
    } catch {
      return false;
    }
  }
}
