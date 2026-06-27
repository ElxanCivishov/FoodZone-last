import axios from 'axios';
import crypto from 'crypto';
import QRCode from 'qrcode';

const BASE = process.env.M10_BASE_URL      ?? 'https://api.m10.az/v1';
const KEY  = process.env.M10_API_KEY       ?? '';
const MID  = process.env.M10_MERCHANT_ID   ?? '';

export interface M10QRResult {
  transactionRef: string;
  qrCodeBase64:   string;
  deepLink:       string;
  expiresAt:      string;
}

export async function createM10Payment(params: {
  orderId: string;
  amount:  number;
  note?:   string;
}): Promise<M10QRResult> {
  const ref = `FZ-${params.orderId}-${Date.now()}`;

  const response = await axios.post(
    `${BASE}/payments/qr`,
    {
      merchantId: MID,
      amount:     params.amount,
      currency:   'AZN',
      reference:  ref,
      note:       params.note ?? 'FoodZone ödənişi',
    },
    { headers: { Authorization: `Bearer ${KEY}` } },
  );

  const deepLink = `m10://pay?merchant=${MID}&amount=${params.amount}&ref=${ref}&note=${encodeURIComponent(params.note ?? '')}`;
  const qrCodeBase64 = await QRCode.toDataURL(
    response.data?.paymentUrl ?? deepLink,
    { width: 300, margin: 2 },
  );

  return {
    transactionRef: ref,
    qrCodeBase64,
    deepLink,
    expiresAt: response.data?.expiresAt ?? new Date(Date.now() + 10 * 60_000).toISOString(),
  };
}

export async function getM10Status(transactionRef: string) {
  const response = await axios.get(`${BASE}/payments/status`, {
    params:  { merchantId: MID, ref: transactionRef },
    headers: { Authorization: `Bearer ${KEY}` },
  });
  return response.data;
}

export function verifyM10Webhook(payload: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.PAYMENT_WEBHOOK_SECRET ?? '')
    .update(payload)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex'),
    );
  } catch {
    return false;
  }
}
