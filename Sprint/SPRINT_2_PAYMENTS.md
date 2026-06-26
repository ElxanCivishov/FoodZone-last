# Sprint 2 — Azərbaycan Payment İnteqrasiyaları

**Məqsəd:** Payriff (kart/bank) + M10 (rəqəmsal cüzdan) inteqrasiyaları ilə real onlayn ödəniş axını qurmaq.  
**Ön şərt:** Sprint 1 tamamlanmış olmalıdır.  
**Yeni paketlər:** `axios` (artıq var), `qrcode` (server-da artıq var)

---

## Cari Vəziyyət

- `Order.paymentMethod`: `'cash' | 'card' | 'online'` — yalnız etiket olaraq saxlanılır
- `Order.paymentStatus`: `'pending' | 'paid' | 'failed'` — əl ilə dəyişilir
- Real ödəniş prosessi yoxdur — hamısı `cash` kimi işlənir
- `server/src/routes/` içində `payments` routu mövcud deyil

---

## Paket Qurulması

```bash
# Server tərəfindən:
cd server && npm install crypto uuid
# (axios artıq var, qrcode artıq var)
```

---

## Tapşırıq 1 — `Payment` Modeli (Prisma)

**Fayl:** `server/prisma/schema.prisma`  
**Dəyişiklik:** `Order` modelindən sonra `Payment` modeli əlavə et.

```prisma
model Payment {
  id            String    @id @default(cuid())
  orderId       String
  method        String    // payriff | m10 | cash | card
  provider      String?   // payriff | m10
  amount        Float
  currency      String    @default("AZN")
  status        String    @default("pending")  // pending | success | failed | refunded | cancelled
  externalRef   String?   // Bankdan gələn referans nömrəsi
  externalTxnId String?   // Bank tranzaksiya ID
  paymentUrl    String?   // Redirect URL (Payriff üçün)
  webhookData   Json?     // Bankın göndərdiyi tam data
  refundAmount  Float?
  refundedAt    DateTime?
  failReason    String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  order         Order     @relation(fields: [orderId], references: [id])

  @@index([orderId])
  @@index([status])
  @@index([externalRef])
}
```

**`Order` modelinə əlavə et:**
```prisma
// Order modeli içinə:
payments  Payment[]
```

**Migration əmri:**
```bash
cd server && npm run db:migrate
# Migration adı: add_payment_model
```

---

## Tapşırıq 2 — Environment Variables

**Fayl:** `server/.env`  
**Əlavə et:**

```env
# Payriff
PAYRIFF_API_KEY=your_api_key_here
PAYRIFF_MERCHANT_ID=your_merchant_id
PAYRIFF_BASE_URL=https://api.payriff.com/api/v3
PAYRIFF_SUCCESS_URL=http://localhost:3000/payment/success
PAYRIFF_CANCEL_URL=http://localhost:3000/payment/cancel

# M10
M10_API_KEY=your_m10_api_key
M10_MERCHANT_ID=your_m10_merchant_id
M10_BASE_URL=https://api.m10.az/v1

# Webhook secret (random string, bank tərəflə paylaşılır)
PAYMENT_WEBHOOK_SECRET=random_strong_secret_here
```

---

## Tapşırıq 3 — Payriff Servis

**Yeni fayl:** `server/src/lib/payriff.ts`

```typescript
import axios from 'axios';

const BASE = process.env.PAYRIFF_BASE_URL!;
const KEY  = process.env.PAYRIFF_API_KEY!;
const MID  = process.env.PAYRIFF_MERCHANT_ID!;

interface CreatePaymentParams {
  orderId:     string;
  amount:      number;
  description: string;
  lang?:       'AZ' | 'EN' | 'RU';
}

interface PayriffPaymentResult {
  paymentId:  string;
  paymentUrl: string;
  sessionId:  string;
}

export async function createPayriffPayment(params: CreatePaymentParams): Promise<PayriffPaymentResult> {
  const response = await axios.post(
    `${BASE}/createOrder`,
    {
      merchantId:  MID,
      amount:      Math.round(params.amount * 100), // qəpik formatı
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
  const response = await axios.get(
    `${BASE}/getOrderStatus`,
    {
      params:  { merchantId: MID, paymentId },
      headers: { Authorization: `Bearer ${KEY}` },
    },
  );
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
```

---

## Tapşırıq 4 — M10 Servis

**Yeni fayl:** `server/src/lib/m10.ts`

```typescript
import axios from 'axios';
import crypto from 'crypto';
import QRCode from 'qrcode';

const BASE = process.env.M10_BASE_URL!;
const KEY  = process.env.M10_API_KEY!;
const MID  = process.env.M10_MERCHANT_ID!;

interface M10QRResult {
  transactionRef: string;
  qrCodeBase64:   string; // PNG data URL
  deepLink:       string; // m10://pay?...
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

  const data = response.data;
  const deepLink = `m10://pay?merchant=${MID}&amount=${params.amount}&ref=${ref}&note=${encodeURIComponent(params.note ?? '')}`;
  const qrCodeBase64 = await QRCode.toDataURL(data.paymentUrl ?? deepLink, { width: 300, margin: 2 });

  return {
    transactionRef: ref,
    qrCodeBase64,
    deepLink,
    expiresAt: data.expiresAt ?? new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  };
}

export async function getM10Status(transactionRef: string) {
  const response = await axios.get(
    `${BASE}/payments/status`,
    { params: { merchantId: MID, ref: transactionRef }, headers: { Authorization: `Bearer ${KEY}` } },
  );
  return response.data;
}

export function verifyM10Webhook(payload: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.PAYMENT_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
```

---

## Tapşırıq 5 — Payment Route

**Yeni fayl:** `server/src/routes/payments.ts`

```typescript
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { notify } from '../lib/notify';
import { authenticate } from '../middleware/auth';
import { createPayriffPayment, getPayriffStatus, refundPayriff } from '../lib/payriff';
import { createM10Payment, getM10Status, verifyM10Webhook } from '../lib/m10';
import crypto from 'crypto';

const router = Router();

// ── Payriff ödənişi başlat ───────────────────────────────────────────────────
router.post('/payriff/create', async (req, res, next) => {
  try {
    const { orderId, lang } = req.body;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ success: false, message: 'Sifariş tapılmadı' });

    const result = await createPayriffPayment({
      orderId,
      amount:      order.total,
      description: `FoodZone Sifariş #${order.orderNumber}`,
      lang,
    });

    await prisma.payment.create({
      data: {
        orderId,
        method:     'payriff',
        provider:   'payriff',
        amount:     order.total,
        status:     'pending',
        externalRef: result.paymentId,
        paymentUrl:  result.paymentUrl,
      },
    });

    res.json({ success: true, data: { paymentUrl: result.paymentUrl, paymentId: result.paymentId } });
  } catch (err) { next(err); }
});

// ── Payriff webhook ──────────────────────────────────────────────────────────
router.post('/payriff/webhook', async (req, res, next) => {
  try {
    const sig  = req.headers['x-payriff-signature'] as string;
    const body = JSON.stringify(req.body);
    const expected = crypto.createHmac('sha256', process.env.PAYMENT_WEBHOOK_SECRET!).update(body).digest('hex');

    if (sig !== expected) return res.status(401).json({ success: false, message: 'Invalid signature' });

    const { paymentId, status, orderId } = req.body;
    const payment = await prisma.payment.findFirst({ where: { externalRef: paymentId } });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    const paymentStatus = status === 'APPROVED' ? 'success' : status === 'DECLINED' ? 'failed' : 'pending';

    await prisma.payment.update({
      where:   { id: payment.id },
      data:    { status: paymentStatus, webhookData: req.body },
    });

    if (paymentStatus === 'success') {
      const order = await prisma.order.update({
        where: { id: payment.orderId },
        data:  { paymentStatus: 'paid', paidAt: new Date() },
      });

      await notify({
        io:       (req as any).io,
        branchId: order.branchId,
        type:     'payment_received',
        title:    'Ödəniş alındı',
        message:  `#${order.orderNumber} — ${order.total.toFixed(2)} ₼ (Payriff)`,
        data:     { orderId: order.id },
      });
    }

    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Payriff status yoxla ─────────────────────────────────────────────────────
router.get('/payriff/status/:paymentId', authenticate, async (req, res, next) => {
  try {
    const result = await getPayriffStatus(req.params.paymentId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ── Payriff geri qaytarma ────────────────────────────────────────────────────
router.post('/payriff/refund', authenticate, async (req, res, next) => {
  try {
    const { paymentId, amount } = req.body;
    const result = await refundPayriff(paymentId, amount);
    await prisma.payment.update({
      where: { externalRef: paymentId },
      data:  { status: 'refunded', refundAmount: amount, refundedAt: new Date() },
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ── M10 QR yarat ────────────────────────────────────────────────────────────
router.post('/m10/create', async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ success: false, message: 'Sifariş tapılmadı' });

    const result = await createM10Payment({
      orderId,
      amount: order.total,
      note:   `Sifariş #${order.orderNumber}`,
    });

    await prisma.payment.create({
      data: {
        orderId,
        method:      'm10',
        provider:    'm10',
        amount:      order.total,
        status:      'pending',
        externalRef: result.transactionRef,
      },
    });

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ── M10 status yoxla (polling üçün) ─────────────────────────────────────────
router.get('/m10/status/:ref', async (req, res, next) => {
  try {
    const result = await getM10Status(req.params.ref);
    const isPaid = result.status === 'SUCCESS';

    if (isPaid) {
      const payment = await prisma.payment.findFirst({ where: { externalRef: req.params.ref, status: 'pending' } });
      if (payment) {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'success' } });
        const order = await prisma.order.update({
          where: { id: payment.orderId },
          data:  { paymentStatus: 'paid', paidAt: new Date() },
        });
        await notify({
          io:       (req as any).io,
          branchId: order.branchId,
          type:     'payment_received',
          title:    'Ödəniş alındı (M10)',
          message:  `#${order.orderNumber} — ${order.total.toFixed(2)} ₼`,
          data:     { orderId: order.id },
        });
      }
    }

    res.json({ success: true, data: { status: result.status, isPaid } });
  } catch (err) { next(err); }
});

// ── M10 webhook ──────────────────────────────────────────────────────────────
router.post('/m10/webhook', async (req, res, next) => {
  try {
    const sig = req.headers['x-m10-signature'] as string;
    const { verifyM10Webhook: verify } = await import('../lib/m10');
    if (!verify(JSON.stringify(req.body), sig)) {
      return res.status(401).json({ success: false });
    }
    // M10-dan gələn webhook — /m10/status ilə eyni məntiq
    res.json({ success: true });
  } catch (err) { next(err); }
});

export { router as paymentRoutes };
```

---

## Tapşırıq 6 — Route-u `index.ts`-ə qoş

**Fayl:** `server/src/index.ts`  
**Dəyişiklik:**

```typescript
// Mövcud import-ların yanına:
import { paymentRoutes } from './routes/payments';

// Route-ları yanına:
app.use('/api/payments', paymentRoutes);
```

---

## Tapşırıq 7 — Frontend: `CheckoutScreen.tsx`

**Fayl:** `src/components/customer/CheckoutScreen.tsx`  
**Dəyişiklik:** Ödəniş metodu seçimi genişlənsin, real ödəniş axını əlavə olsun.

**Ödəniş metodları UI:**

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { post } from '@/services/api';

// Ödəniş metodları konfiqurasiyası:
const PAYMENT_METHODS = [
  { id: 'cash',    label: 'Nağd',    icon: '💵', desc: 'Kassirə ödə' },
  { id: 'card',    label: 'Kart',    icon: '💳', desc: 'POS terminal' },
  { id: 'payriff', label: 'Bank kartı (Online)', icon: '🏦', desc: 'Bütün Azərbaycan bankları' },
  { id: 'm10',     label: 'M10',     icon: '📱', desc: 'M10 cüzdanı' },
];

// Seçim UI:
<div className="grid grid-cols-2 gap-3">
  {PAYMENT_METHODS.map((method) => (
    <motion.button
      key={method.id}
      whileTap={{ scale: 0.95 }}
      onClick={() => setSelectedMethod(method.id)}
      className={cn(
        'p-4 rounded-2xl border-2 text-left transition-all',
        selectedMethod === method.id
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
          : 'border-border bg-surface-elevated',
      )}
    >
      <span className="text-2xl">{method.icon}</span>
      <p className="font-semibold text-sm mt-2">{method.label}</p>
      <p className="text-xs text-foreground-muted">{method.desc}</p>
    </motion.button>
  ))}
</div>

// Sifariş verilən zaman:
async function handleOrder() {
  const order = await placeOrder(/* ... */);

  if (selectedMethod === 'payriff') {
    const { data } = await post<{ paymentUrl: string }>('/payments/payriff/create', {
      orderId: order.id,
      lang: i18n.language.toUpperCase() as 'AZ' | 'EN' | 'RU',
    });
    window.location.href = data.paymentUrl; // Payriff-ə redirect
    return;
  }

  if (selectedMethod === 'm10') {
    const { data } = await post<M10QRResult>('/payments/m10/create', { orderId: order.id });
    setM10Data(data); // QR kodu göstər
    setScreen('m10-payment'); // Yeni ekran
    return;
  }

  // Nağd/kart üçün:
  setScreen('order-success');
}
```

---

## Tapşırıq 8 — Yeni Ekran: M10 Payment Screen

**Yeni fayl:** `src/components/customer/M10PaymentScreen.tsx`

```tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { get } from '@/services/api';
import { useUIStore } from '@/stores/uiStore';

interface M10Data {
  transactionRef: string;
  qrCodeBase64:   string;
  deepLink:       string;
  expiresAt:      string;
}

export function M10PaymentScreen({ data }: { data: M10Data }) {
  const setScreen = useUIStore((s) => s.setScreen);
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [timeLeft, setTimeLeft] = useState(600); // 10 dəqiqə

  // Hər 3 saniyədə bir status yoxla
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await get<{ isPaid: boolean }>(`/payments/m10/status/${data.transactionRef}`);
        if (res.data.isPaid) {
          setStatus('success');
          clearInterval(interval);
          setTimeout(() => setScreen('order-success'), 2000);
        }
      } catch { /* silent */ }
    }, 3000);

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timer); setStatus('failed'); }
        return t - 1;
      });
    }, 1000);

    return () => { clearInterval(interval); clearInterval(timer); };
  }, [data.transactionRef, setScreen]);

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
      <AnimatePresence mode="wait">
        {status === 'pending' && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6 w-full max-w-sm"
          >
            <h2 className="text-xl font-bold">M10 ilə ödə</h2>
            <p className="text-sm text-foreground-muted">M10 tətbiqindən QR kodu skan et</p>

            {/* QR Kodu */}
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(249,115,22,0.3)', '0 0 0 16px rgba(249,115,22,0)', '0 0 0 0 rgba(249,115,22,0)'] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="rounded-3xl overflow-hidden border-4 border-primary-500 w-64 h-64 mx-auto"
            >
              <img src={data.qrCodeBase64} alt="M10 QR" className="w-full h-full" />
            </motion.div>

            {/* Countdown */}
            <div className="flex items-center justify-center gap-2 text-foreground-muted text-sm">
              <Clock className="w-4 h-4" />
              <span>Vaxt: <span className="font-mono font-bold text-foreground">{minutes}:{seconds}</span></span>
            </div>

            {/* Deep link düyməsi (mobil üçün) */}
            <a
              href={data.deepLink}
              className="block w-full py-3 bg-primary-500 text-white rounded-2xl font-semibold text-center btn-press"
            >
              M10 tətbiqini aç
            </a>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-4"
          >
            <motion.div
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="w-20 h-20 bg-success-500 rounded-full flex items-center justify-center mx-auto"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-xl font-bold text-success-600">Ödəniş uğurludur!</h2>
          </motion.div>
        )}

        {status === 'failed' && (
          <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-danger-500 mx-auto" />
            <h2 className="text-lg font-bold">Vaxt bitdi</h2>
            <button onClick={() => setScreen('checkout')} className="btn-primary px-6 py-3">
              Geri qayıt
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## Tapşırıq 9 — `M10PaymentScreen`-i axına əlavə et

**Fayl:** `src/App.tsx`

```typescript
// Import əlavə et:
import { M10PaymentScreen } from '@/components/customer/M10PaymentScreen';

// customerScreens obyektinə:
'm10-payment': () => <M10PaymentScreen data={m10Data} />,
// NOT: m10Data zustand store-da saxlanılmalıdır
```

**`src/stores/uiStore.ts`-ə əlavə et:**
```typescript
m10PaymentData: M10QRResult | null;
setM10PaymentData: (data: M10QRResult | null) => void;
```

---

## Tapşırıq 10 — Payment success redirect

**Yeni fayl:** `src/components/customer/PaymentSuccessScreen.tsx`

```tsx
// Payriff-dən callback gəlir: /?orderId=xxx&status=success
// Bu ekran URL parametrini oxuyub sifarişi yoxlayır

import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

export function PaymentCallbackHandler() {
  const setScreen = useUIStore((s) => s.setScreen);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status  = params.get('status');
    // Query parametrlərini təmizlə
    window.history.replaceState({}, '', '/');
    setScreen(status === 'success' ? 'order-success' : 'checkout');
  }, [setScreen]);

  return <div className="min-h-screen flex items-center justify-center">Yüklənir...</div>;
}
```

---

## Tapşırıq 11 — Admin: Ödəniş Tarixçəsi

**Fayl:** `src/components/admin/views/CashierView.tsx`  
**Dəyişiklik:** Mövcud `CashierView`-a "Onlayn Ödənişlər" tab-ı əlavə et.

```tsx
// React Query ilə payment list:
const { data: payments } = useQuery({
  queryKey: ['payments', branchId],
  queryFn: () => api.get(`/payments?branchId=${branchId}&limit=20`).then(r => r.data),
  enabled: !!branchId,
});

// Cədvəl sütunları:
// Sifariş # | Məbləğ | Metod | Status | Tarix | Əməliyyat(Refund)
```

---

## Tamamlanma Vəziyyəti

- [ ] `Payment` modeli Prisma schema-ya əlavə edildi
- [ ] `npm run db:migrate` işə salındı
- [ ] `server/.env`-ə Payriff + M10 dəyərləri əlavə edildi
- [ ] `server/src/lib/payriff.ts` yaradıldı
- [ ] `server/src/lib/m10.ts` yaradıldı
- [ ] `server/src/routes/payments.ts` yaradıldı
- [ ] `server/src/index.ts`-ə `/api/payments` route əlavə edildi
- [ ] `CheckoutScreen.tsx` yeniləndi (4 ödəniş metodu)
- [ ] `M10PaymentScreen.tsx` yaradıldı
- [ ] `App.tsx` — `m10-payment` screen əlavə edildi
- [ ] `uiStore.ts` — `m10PaymentData` əlavə edildi
- [ ] Admin `CashierView.tsx` — ödəniş tarixçəsi əlavə edildi

---

## Test Axını

```
1. Müştəri "Payriff ilə ödə" seçir
   → POST /api/payments/payriff/create
   → paymentUrl alır
   → Payriff ödəniş səhifəsinə redirect olur
   → Bank tərəfi webhook göndərir: POST /api/payments/payriff/webhook
   → Order paymentStatus="paid" olur
   → Socket event: admin panelə bildiriş gedir

2. Müştəri "M10 ilə ödə" seçir
   → POST /api/payments/m10/create
   → QR kodu alır (base64 PNG)
   → M10PaymentScreen göstərilir
   → Hər 3san: GET /api/payments/m10/status/:ref
   → Ödəniş alındıqda → order-success ekranı
```

---

## Növbəti Sprint

Sprint 2 tamamlandıqdan sonra **SPRINT_3_PRINTING.md** faylına keç.
