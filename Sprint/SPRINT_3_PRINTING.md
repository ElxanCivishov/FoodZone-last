# Sprint 3 — Thermal Printer & Çap Sistemi

**Məqsəd:** Müştəri çeki, mətbəx çeki və avtomatik çap sistemini tamamlamaq.  
**Ön şərt:** Sprint 1 tamamlanmış olmalıdır (dizayn).  
**Qeyd:** `printShiftReport.ts` və `printRangeReport` artıq mövcuddur — onları dəyişdirmə, genişləndir.

---

## Cari Vəziyyət

**Mövcud olan:**
- `src/utils/printShiftReport.ts` — Smena hesabatı çapı (A4 + 80mm thermal mode)
- `src/utils/printShiftReport.ts:printRangeReport` — Dövr hesabatı çapı
- `CashierView.tsx` — Smena hesabatı çap düyməsi
- `ReportsView.tsx` — Dövr hesabatı çap düyməsi

**Mövcud olmayan:**
- Müştəri ödəniş çeki (ayrı sifariş üçün)
- Mətbəx çeki (yeni sifariş gəlincə)
- Auto-print (sifariş təsdiqlənəndə)
- Admin paneldən sifariş çeki çapı
- Network printer (ESC/POS LAN)

---

## Paket Qurulması

```bash
# Yeni paket lazım deyil — window.open() + CSS @media print yetərlidir
# Network printer üçün (isteğe bağlı, LAN şəbəkəsi lazımdır):
cd server && npm install node-escpos @types/node-escpos
```

---

## Tapşırıq 1 — Müştəri Ödəniş Çeki

**Fayl:** `src/utils/printShiftReport.ts`  
**Dəyişiklik:** Mövcud faylın sonuna `printOrderReceipt` funksiyasını əlavə et.

```typescript
// src/utils/printShiftReport.ts — faylın SONUNA əlavə et

export function printOrderReceipt(order: import('@/types').Order, restaurantName = 'FoodZone', thermal = true) {
  const pageSize = thermal ? '@page{size:80mm auto;margin:4mm}' : '@page{size:A4;margin:20mm}';
  const bodyWidth = thermal ? 'max-width:72mm' : 'max-width:210mm';

  const itemRows = order.items.map(item => {
    const extras = item.extras?.length
      ? `<div style="color:#888;font-size:10px;padding-left:8px">+ ${item.extras.map(e => e.name).join(', ')}</div>`
      : '';
    const size = item.selectedSizeId ? `<div style="color:#888;font-size:10px;padding-left:8px">Ölçü: ${item.selectedSizeId}</div>` : '';
    const note = item.specialNote ? `<div style="color:#888;font-size:10px;padding-left:8px;font-style:italic">* ${item.specialNote}</div>` : '';

    return `
      <tr>
        <td style="vertical-align:top;padding:3px 0">
          <div>${item.product?.nameAz || item.productId} x${item.quantity}</div>
          ${size}${extras}${note}
        </td>
        <td style="text-align:right;vertical-align:top;font-weight:600;padding:3px 0;white-space:nowrap">
          ${fmt(item.totalPrice)}
        </td>
      </tr>`;
  }).join('');

  const payMethod: Record<string, string> = { cash: 'Nağd', card: 'Kart', online: 'Online', payriff: 'Bank kartı', m10: 'M10' };

  const html = `<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <title>Çek #${order.receiptNumber ?? order.orderNumber}</title>
  <style>
    ${pageSize}
    * { box-sizing:border-box;margin:0;padding:0; }
    body { font-family:'Courier New',monospace;font-size:12px;color:#000;${bodyWidth}; }
    .center { text-align:center; }
    .divider { border:none;border-top:1px dashed #000;margin:6px 0; }
    table { width:100%;border-collapse:collapse; }
    .total-row { font-size:14px;font-weight:700; }
    .footer { margin-top:12px;text-align:center;font-size:10px;color:#555; }
    @media print { body { margin:0; } }
  </style>
</head>
<body>
  <div class="center" style="margin-bottom:8px">
    <div style="font-size:16px;font-weight:700">${restaurantName}</div>
    ${order.table ? `<div style="font-size:11px">Masa: ${order.table.number}</div>` : ''}
    <div style="font-size:11px">Sifariş: #${order.orderNumber}</div>
    <div style="font-size:10px;color:#555">${new Date(order.createdAt).toLocaleString('az-AZ')}</div>
  </div>

  <hr class="divider">

  <table>
    <tbody>${itemRows}</tbody>
  </table>

  <hr class="divider">

  <table>
    <tr><td>Ara cəm</td><td style="text-align:right">${fmt(order.subtotal)}</td></tr>
    ${order.serviceFee > 0 ? `<tr><td>Xidmət haqqı</td><td style="text-align:right">${fmt(order.serviceFee)}</td></tr>` : ''}
    ${order.discount > 0 ? `<tr><td style="color:#dc2626">Endirim</td><td style="text-align:right;color:#dc2626">-${fmt(order.discount)}</td></tr>` : ''}
    ${order.promoDiscount > 0 ? `<tr><td style="color:#dc2626">Promo endirim</td><td style="text-align:right;color:#dc2626">-${fmt(order.promoDiscount)}</td></tr>` : ''}
    ${order.tip > 0 ? `<tr><td>Bahşiş</td><td style="text-align:right">${fmt(order.tip)}</td></tr>` : ''}
  </table>

  <hr class="divider">

  <table>
    <tr class="total-row">
      <td>CƏMİ</td>
      <td style="text-align:right">${fmt(order.total)}</td>
    </tr>
    <tr><td style="color:#555">Ödəniş</td><td style="text-align:right">${payMethod[order.paymentMethod] ?? order.paymentMethod}</td></tr>
    ${order.paymentStatus === 'paid' ? '<tr><td style="color:#16a34a">✓ Ödənilib</td><td></td></tr>' : ''}
  </table>

  ${order.receiptNumber ? `
  <hr class="divider">
  <div class="center" style="font-size:10px;color:#555">Çek: ${order.receiptNumber}</div>` : ''}

  <div class="footer">
    <p>Təşəkkür edirik!</p>
    <p style="margin-top:2px">FoodZone POS Sistemi</p>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=400,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}
```

---

## Tapşırıq 2 — Mətbəx Çeki

**Fayl:** `src/utils/printShiftReport.ts`  
**Dəyişiklik:** Faylın SONUNA `printKitchenTicket` əlavə et.

```typescript
export function printKitchenTicket(order: import('@/types').Order | import('@/types').KitchenOrder) {
  const items = (order as any).items ?? [];
  const tableLabel = (order as any).table?.number ?? (order as any).tableNumber ?? '—';
  const fulfillmentLabels: Record<string, string> = {
    dine_in:  '🍽 Masada',
    takeaway: '🥡 Aparma',
    delivery: '🛵 Çatdırılma',
  };

  const itemRows = items.map((item: any) => {
    const name    = item.product?.nameAz ?? item.productName ?? item.productId;
    const extras  = (item.extras ?? item.selectedExtras ?? []);
    const extrasStr = Array.isArray(extras) && extras.length
      ? (typeof extras[0] === 'string' ? extras : extras.map((e: any) => e.name ?? e)).join(', ')
      : '';
    const note = item.specialNote ? `  * ${item.specialNote}` : '';

    return `
    <tr style="border-bottom:1px dashed #ccc">
      <td style="font-size:16px;font-weight:700;padding:6px 0">${item.quantity}x</td>
      <td style="padding:6px 4px">
        <div style="font-size:14px;font-weight:700">${name}</div>
        ${item.selectedSize ? `<div style="font-size:11px;color:#555">Ölçü: ${item.selectedSize}</div>` : ''}
        ${extrasStr ? `<div style="font-size:11px;color:#555">+ ${extrasStr}</div>` : ''}
        ${note ? `<div style="font-size:11px;color:#dc2626;font-style:italic">${note}</div>` : ''}
      </td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <title>Mətbəx Çeki #${(order as any).orderNumber}</title>
  <style>
    @page { size:80mm auto;margin:4mm }
    * { box-sizing:border-box;margin:0;padding:0; }
    body { font-family:'Courier New',monospace;font-size:12px;max-width:72mm; }
    .divider { border:none;border-top:2px dashed #000;margin:6px 0; }
    @media print { body { margin:0; } }
  </style>
</head>
<body>
  <div style="text-align:center;font-size:14px;font-weight:700;margin-bottom:4px">
    ── MƏTBƏx ──
  </div>
  <div style="font-size:20px;font-weight:900;text-align:center">
    #${(order as any).orderNumber}
  </div>
  <div style="text-align:center;font-size:12px;margin:4px 0">
    ${fulfillmentLabels[(order as any).fulfillmentType ?? 'dine_in']}
    ${(order as any).fulfillmentType === 'dine_in' ? ` — Masa ${tableLabel}` : ''}
  </div>
  <div style="text-align:center;font-size:10px;color:#555">
    ${new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
  </div>

  <hr class="divider">

  <table style="width:100%;border-collapse:collapse">
    <tbody>${itemRows}</tbody>
  </table>

  ${(order as any).specialRequest ? `
  <hr class="divider">
  <div style="font-size:11px;color:#dc2626">
    <strong>Xüsusi qeyd:</strong> ${(order as any).specialRequest}
  </div>` : ''}
</body>
</html>`;

  const win = window.open('', '_blank', 'width=400,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 200);
}
```

---

## Tapşırıq 3 — Admin: Sifariş Çeki Düyməsi

**Fayl:** `src/components/admin/views/OrdersView.tsx`  
**Dəyişiklik:** Sifariş sırasına çap düyməsi əlavə et.

```tsx
import { printOrderReceipt, printKitchenTicket } from '@/utils/printShiftReport';
import { Printer } from 'lucide-react';

// Sifariş sırasında (hər order üçün):
<div className="flex items-center gap-2">
  <button
    onClick={() => printOrderReceipt(order, restaurantName)}
    title="Müştəri çeki"
    className="p-2 rounded-lg hover:bg-surface border border-border transition-colors"
  >
    <Printer className="w-4 h-4" />
  </button>
  <button
    onClick={() => printKitchenTicket(order)}
    title="Mətbəx çeki"
    className="p-2 rounded-lg hover:bg-surface border border-border transition-colors text-orange-500"
  >
    <ChefHat className="w-4 h-4" />
  </button>
</div>
```

---

## Tapşırıq 4 — Kitchen Panel: Manual Çap Düyməsi

**Fayl:** `src/components/kitchen/OrderCard.tsx`  
**Dəyişiklik:** Kart header-ına çap ikonası əlavə et.

```tsx
import { printKitchenTicket } from '@/utils/printShiftReport';
import { Printer } from 'lucide-react';

// Kart başlığında:
<button
  onClick={(e) => { e.stopPropagation(); printKitchenTicket(order); }}
  className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
  title="Çap et"
>
  <Printer className="w-4 h-4 opacity-60" />
</button>
```

---

## Tapşırıq 5 — Auto-Print: Yeni Sifariş Gəlincə

**Fayl:** `src/components/kitchen/KitchenPanel.tsx`  
**Dəyişiklik:** `useKitchenStore`-da yeni sifariş event-i tutulur — orada çap et.

```tsx
import { printKitchenTicket } from '@/utils/printShiftReport';
import { useSoundSettings } from '@/hooks/useSoundSettings';

// KitchenPanel-in içindəki socket listener-a əlavə et:
// Mövcud "new_order" socket handler-ı tapıb aşağıdakını əlavə et:

socket.on('new_order', (order) => {
  // Mövcud kod (səs, bildiriş) dəyişdirilmir
  // ...mövcud kod...

  // Auto-print əlavə et:
  const settings = JSON.parse(localStorage.getItem('kitchen_settings') ?? '{}');
  if (settings.autoPrint) {
    setTimeout(() => printKitchenTicket(order), 500);
  }
});
```

---

## Tapşırıq 6 — Settings: Auto-print Toggle

**Fayl:** `src/components/admin/views/SettingsView.tsx`  
**Dəyişiklik:** "Mətbəx" bölməsindəki `kitchenAutoPrint` toggle-ı `kitchen_settings` localStorage-a da yazsın.

```tsx
// Mövcud kitchenAutoPrint toggle handler-ında:
const handleToggleAutoPrint = async (value: boolean) => {
  await updateSettings({ kitchenAutoPrint: value });
  // Lokal da saxla ki, KitchenPanel oxuya bilsin:
  const current = JSON.parse(localStorage.getItem('kitchen_settings') ?? '{}');
  localStorage.setItem('kitchen_settings', JSON.stringify({ ...current, autoPrint: value }));
};
```

---

## Tapşırıq 7 — Çap Önizləməsi (Print Preview)

**Yeni fayl:** `src/components/common/PrintPreviewModal.tsx`

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer } from 'lucide-react';

interface Props {
  isOpen:    boolean;
  onClose:   () => void;
  onPrint:   () => void;
  title:     string;
  children:  React.ReactNode;
}

export function PrintPreviewModal({ isOpen, onClose, onPrint, title, children }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold">{title}</h3>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-elevated"><X className="w-4 h-4" /></button>
            </div>

            {/* Preview */}
            <div className="p-4 max-h-96 overflow-y-auto bg-white text-black text-xs font-mono">
              {children}
            </div>

            {/* Actions */}
            <div className="p-4 flex gap-3 border-t border-border">
              <button onClick={onClose} className="flex-1 py-3 border border-border rounded-2xl font-medium">Ləğv et</button>
              <button onClick={() => { onPrint(); onClose(); }} className="flex-1 py-3 btn-primary flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" />
                Çap et
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## Tapşırıq 8 — Network Printer Server Route (İsteğe Bağlı)

**Yeni fayl:** `server/src/routes/print.ts`  
**Qeyd:** Bu yalnız serverlə eyni LAN-da ESC/POS printer varsa istifadə edilir.

```typescript
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Test endpoint — printer bağlı olub-olmadığını yoxla
router.get('/test', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  try {
    // node-escpos mövcuddursa:
    // const escpos = await import('node-escpos');
    // const device = new escpos.Network(process.env.PRINTER_IP, 9100);
    // device.open(() => { ... });
    res.json({ success: true, message: 'Printer endpoint hazırdır' });
  } catch (err) {
    res.status(503).json({ success: false, message: 'Printer bağlantısı yoxdur' });
  }
});

// Sifariş çeki
router.post('/order/:orderId', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: { items: { include: { product: true, extras: true } }, table: true },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Sifariş tapılmadı' });

    // Bu endpoint frontend-ə HTML göndərir — frontend window.print() çağırır
    // Alternativ: ESC/POS əmrləri birbaşa printerə göndərilir
    res.json({ success: true, message: 'Çap əmri göndərildi', data: { orderId: order.id } });
  } catch (err) { next(err); }
});

export { router as printRoutes };
```

**`server/src/index.ts`-ə qoş:**
```typescript
import { printRoutes } from './routes/print';
app.use('/api/print', printRoutes);
```

---

## Çap Növləri Xülasəsi

| Çek növü | Funksiya | Tetikleyici | Ölçü |
|----------|----------|-------------|------|
| Smena hesabatı | `printShiftReport()` | Mövcuddur (CashierView) | A4 + 80mm |
| Dövr hesabatı | `printRangeReport()` | Mövcuddur (ReportsView) | A4 |
| Müştəri çeki | `printOrderReceipt()` | **YENİ** — OrdersView + ödəniş | 80mm |
| Mətbəx çeki | `printKitchenTicket()` | **YENİ** — KitchenPanel + auto | 80mm |
| Çap önizləməsi | `PrintPreviewModal` | **YENİ** — istənilən yerdən | — |

---

## Tamamlanma Vəziyyəti

- [ ] `printOrderReceipt()` `printShiftReport.ts`-ə əlavə edildi
- [ ] `printKitchenTicket()` `printShiftReport.ts`-ə əlavə edildi
- [ ] `OrdersView.tsx` — çap düyməsi əlavə edildi
- [ ] `OrderCard.tsx` (Kitchen) — manual çap düyməsi
- [ ] `KitchenPanel.tsx` — auto-print socket listener
- [ ] `SettingsView.tsx` — auto-print localStorage sync
- [ ] `PrintPreviewModal.tsx` yaradıldı
- [ ] (İsteğe bağlı) `server/src/routes/print.ts` yaradıldı

---

## Növbəti Sprint

Sprint 3 tamamlandıqdan sonra **SPRINT_4_STOCK.md** faylına keç.
