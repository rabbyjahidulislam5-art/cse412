import qrcode from 'qrcode';
import { signQR } from './crypto';
import { config } from '../config';

export interface QRPayload {
  merchantId: string;
  amount?: number;
  timestamp?: number;
  nonce?: string;
  type: 'STATIC' | 'DYNAMIC';
}

export async function generateMerchantQR(merchantId: string): Promise<string> {
  const payload: QRPayload = { merchantId, type: 'STATIC' };
  const signature = signQR(payload, config.security.qrSigningSecret);
  const data = JSON.stringify({ ...payload, signature });
  return qrcode.toDataURL(data, { width: 300, margin: 2 });
}

export async function generateDynamicQR(merchantId: string, amount: number): Promise<string> {
  const nonce = require('crypto').randomBytes(8).toString('hex');
  const payload: QRPayload = {
    merchantId, amount, timestamp: Date.now(), nonce, type: 'DYNAMIC',
  };
  const signature = signQR(payload, config.security.qrSigningSecret);
  const data = JSON.stringify({ ...payload, signature });
  return qrcode.toDataURL(data, { width: 300, margin: 2 });
}

export function parseQRData(qrString: string): QRPayload & { signature: string } | null {
  try {
    return JSON.parse(qrString);
  } catch {
    return null;
  }
}
