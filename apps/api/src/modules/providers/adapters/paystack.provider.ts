import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { BaseProvider, PaymentPayload, PaymentResult } from '../provider-orchestrator.service';
import { ProviderName } from '@berry-x/types';

@Injectable()
export class PaystackProvider implements BaseProvider {
  private readonly logger = new Logger(PaystackProvider.name);
  private readonly baseUrl: string;
  private readonly secretKey: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = config.get('app.paystackBaseUrl', 'https://api.paystack.co');
    this.secretKey = config.get('app.paystackSecretKey', '');
  }

  getName(): ProviderName {
    return ProviderName.PAYSTACK;
  }

  private getHeaders() {
    return { Authorization: `Bearer ${this.secretKey}`, 'Content-Type': 'application/json' };
  }

  async initializePayment(payload: PaymentPayload): Promise<PaymentResult> {
    try {
      const { data } = await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/transaction/initialize`,
          {
            amount: Math.round(payload.amount * 100),
            email: payload.email,
            reference: payload.reference,
            callback_url: payload.callbackUrl,
            metadata: payload.metadata,
          },
          { headers: this.getHeaders() },
        ),
      );

      return {
        success: data.status,
        reference: payload.reference,
        providerReference: data.data?.reference,
        paymentUrl: data.data?.authorization_url,
        status: data.status ? 'pending' : 'failed',
        provider: ProviderName.PAYSTACK,
        rawResponse: data,
      };
    } catch (error) {
      this.logger.error(`Paystack initializePayment error: ${(error as Error).message}`);
      return { success: false, reference: payload.reference, status: 'failed', provider: ProviderName.PAYSTACK };
    }
  }

  async verifyPayment(reference: string): Promise<PaymentResult> {
    try {
      const { data } = await firstValueFrom(
        this.http.get(`${this.baseUrl}/transaction/verify/${reference}`, { headers: this.getHeaders() }),
      );

      return {
        success: data.data?.status === 'success',
        reference,
        providerReference: data.data?.id?.toString(),
        status: data.data?.status,
        provider: ProviderName.PAYSTACK,
        rawResponse: data,
      };
    } catch (error) {
      this.logger.error(`Paystack verifyPayment error: ${(error as Error).message}`);
      return { success: false, reference, status: 'failed', provider: ProviderName.PAYSTACK };
    }
  }

  async createVirtualAccount(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const { data } = await firstValueFrom(
        this.http.post(`${this.baseUrl}/dedicated_account`, params, { headers: this.getHeaders() }),
      );
      return data;
    } catch (error) {
      throw new Error(`Paystack createVirtualAccount: ${(error as Error).message}`);
    }
  }

  async initiateBankTransfer(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const { data } = await firstValueFrom(
        this.http.post(`${this.baseUrl}/transfer`, params, { headers: this.getHeaders() }),
      );
      return data;
    } catch (error) {
      throw new Error(`Paystack initiateBankTransfer: ${(error as Error).message}`);
    }
  }

  async getBanks(): Promise<Record<string, unknown>[]> {
    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/bank?country=nigeria&per_page=100`, { headers: this.getHeaders() }),
    );
    return data.data;
  }

  async resolveAccount(accountNumber: string, bankCode: string): Promise<Record<string, unknown>> {
    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
        headers: this.getHeaders(),
      }),
    );
    return data.data;
  }

  async isHealthy(): Promise<boolean> {
    try {
      await firstValueFrom(this.http.get(`${this.baseUrl}/bank?perPage=1`, { headers: this.getHeaders() }));
      return true;
    } catch {
      return false;
    }
  }
}
