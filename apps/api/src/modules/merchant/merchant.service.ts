import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MerchantService {
  generateQrPaymentData(merchantId: string, amount?: number, description?: string) {
    const ref = `QR-${merchantId.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`;
    return {
      reference: ref,
      merchantId,
      amount,
      description,
      deepLink: `berryx://pay?ref=${ref}&merchant=${merchantId}${amount ? `&amount=${amount}` : ''}`,
      qrData: JSON.stringify({ type: 'berry-x-payment', merchantId, ref, amount }),
    };
  }
}
