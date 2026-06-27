import axios from 'axios';

const BASE = process.env.PAYRIFF_BASE_URL ?? 'https://api.payriff.com/api/v3';
const KEY  = process.env.PAYRIFF_API_KEY  ?? '';
const MID  = process.env.PAYRIFF_MERCHANT_ID ?? '';

export interface PayriffPaymentResult {
  paymentId:  string;
  paymentUrl: string;
  sessionId:  string;
}

export async function createPayriffPayment(params: {
  orderId:     string;
  amount:      number;
  description: string;
  lang?:       'AZ' | 'EN' | 'RU';
}): Promise<PayriffPaymentResult> {
  const response = await axios.post(
    `${BASE}/createOrder`,
    {
      merchantId:  MID,
      amount:      Math.round(params.amount * 100),
      currency:    'AZN',
      description: params.description,
      orderId:     params.orderId,
      lang:        params.lang ?? 'AZ',
      callbackUrl: process.env.PAYRIFF_SUCCESS_URL,
    },
    { headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' } },
  );

  const data = response.data;
  if (!data.success) throw new Error(data.message ?? 'Payriff xətası');

  return {
    paymentId:  data.data.paymentId,
    paymentUrl: data.data.paymentUrl,
    sessionId:  data.data.sessionId,
  };
}

export async function getPayriffStatus(paymentId: string) {
  const response = await axios.get(`${BASE}/getOrderStatus`, {
    params:  { merchantId: MID, paymentId },
    headers: { Authorization: `Bearer ${KEY}` },
  });
  return response.data;
}

export async function refundPayriff(paymentId: string, amount: number) {
  const response = await axios.post(
    `${BASE}/refund`,
    { merchantId: MID, paymentId, amount: Math.round(amount * 100) },
    { headers: { Authorization: `Bearer ${KEY}` } },
  );
  return response.data;
}
