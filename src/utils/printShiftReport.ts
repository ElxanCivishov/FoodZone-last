import type { Order, Shift } from '@/types';

function fmt(n?: number) {
  return `${(n ?? 0).toFixed(2)} ₼`;
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('az-AZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function duration(from: string, to?: string) {
  const ms = new Date(to ?? new Date()).getTime() - new Date(from).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}s ${m}d`;
}

function hourlyTable(breakdown?: Record<string, number>) {
  if (!breakdown || Object.keys(breakdown).length === 0) return '';
  const max = Math.max(...Object.values(breakdown), 1);
  const rows = Array.from({ length: 24 }, (_, h) => {
    const count = breakdown[String(h)] ?? 0;
    const bar = '█'.repeat(Math.round((count / max) * 20));
    return `<tr>
      <td style="color:#888;width:40px">${String(h).padStart(2, '0')}:00</td>
      <td style="font-family:monospace;letter-spacing:1px;color:#3b82f6">${bar}</td>
      <td style="text-align:right;width:30px">${count}</td>
    </tr>`;
  }).filter((_, i) => (breakdown[String(i)] ?? 0) > 0).join('');
  return `
    <section>
      <h3>Saatlara görə sifariş paylanması</h3>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        ${rows}
      </table>
    </section>`;
}

function topProductsTable(products?: Shift['topProducts']) {
  if (!products?.length) return '';
  const rows = products.slice(0, 10).map((p, i) => `
    <tr>
      <td style="color:#888;width:24px">${i + 1}</td>
      <td>${p.name}</td>
      <td style="text-align:right">${p.count} əd.</td>
      <td style="text-align:right;font-weight:600;color:#16a34a">${fmt(p.revenue)}</td>
    </tr>`).join('');
  return `
    <section>
      <h3>Ən çox satan məhsullar</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr style="border-bottom:1px solid #e5e7eb">
            <th style="text-align:left;padding:4px 0;color:#888">#</th>
            <th style="text-align:left;padding:4px 0;color:#888">Məhsul</th>
            <th style="text-align:right;padding:4px 0;color:#888">Miqdar</th>
            <th style="text-align:right;padding:4px 0;color:#888">Gəlir</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
}

function openPrint(html: string) {
  openPrint(html);
}

export function printOrderReceipt(order: Order, restaurantName = 'FoodZone', thermal = false) {
  const pageSize = thermal ? '@page{size:80mm auto;margin:4mm}' : '@page{size:A4;margin:20mm}';
  const bodyWidth = thermal ? 'max-width:72mm' : 'max-width:148mm';

  const itemRows = order.items.map(item => {
    const name = item.product?.name ?? item.productId;
    const price = (item.totalPrice ?? (item.unitPrice ?? 0) * item.quantity).toFixed(2);
    return `<tr>
      <td>${name}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right;font-weight:600">${price} ₼</td>
    </tr>`;
  }).join('');

  const tableLabel = order.table ? `Masa ${order.table.number}` : order.fulfillmentType === 'takeaway' ? 'Aparma' : 'Çatdırılma';

  const html = `<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <title>Qəbz #${order.orderNumber}</title>
  <style>
    ${pageSize}
    * { box-sizing:border-box;margin:0;padding:0; }
    body { font-family:'Segoe UI',Arial,sans-serif;font-size:${thermal ? '12px' : '13px'};color:#111;${bodyWidth}; }
    .center { text-align:center; }
    .divider { border:none;border-top:1px dashed #ccc;margin:8px 0; }
    table { width:100%;border-collapse:collapse; }
    td,th { padding:3px 4px;vertical-align:middle; }
    th { font-size:10px;color:#888;text-align:left; }
    .total-row { font-size:${thermal ? '13px' : '15px'};font-weight:700;display:flex;justify-content:space-between;padding:5px 0; }
    .row { display:flex;justify-content:space-between;padding:2px 0;font-size:${thermal ? '11px' : '12px'}; }
    .footer { margin-top:20px;text-align:center;font-size:10px;color:#aaa; }
    @media print { body { margin:0; } }
  </style>
</head>
<body>
  <div class="center" style="margin-bottom:12px">
    <p style="font-size:${thermal ? '14px' : '18px'};font-weight:700">${restaurantName}</p>
    <p style="font-size:11px;color:#666">Müştəri Qəbzi</p>
  </div>

  <hr class="divider">

  <div class="row"><span>Sifariş #</span><span style="font-weight:600">${order.orderNumber}</span></div>
  <div class="row"><span>Növ</span><span>${tableLabel}</span></div>
  ${order.customerName ? `<div class="row"><span>Müştəri</span><span>${order.customerName}</span></div>` : ''}
  <div class="row"><span>Tarix</span><span>${new Date(order.createdAt).toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>

  <hr class="divider">

  <table>
    <thead>
      <tr>
        <th>Məhsul</th>
        <th style="text-align:center">Miqdar</th>
        <th style="text-align:right">Məbləğ</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <hr class="divider">

  <div class="row"><span>Aralıq cəm</span><span>${order.subtotal.toFixed(2)} ₼</span></div>
  ${order.discount > 0 ? `<div class="row"><span>Endirim</span><span style="color:#dc2626">-${order.discount.toFixed(2)} ₼</span></div>` : ''}
  ${order.promoDiscount > 0 ? `<div class="row"><span>Promo endirim</span><span style="color:#dc2626">-${order.promoDiscount.toFixed(2)} ₼</span></div>` : ''}
  ${order.serviceFee > 0 ? `<div class="row"><span>Servis haqqı</span><span>${order.serviceFee.toFixed(2)} ₼</span></div>` : ''}
  ${order.tip > 0 ? `<div class="row"><span>Bahşiş</span><span>${order.tip.toFixed(2)} ₼</span></div>` : ''}
  <hr class="divider">
  <div class="total-row"><span>CƏMİ</span><span style="color:#16a34a">${order.total.toFixed(2)} ₼</span></div>
  <div class="row"><span>Ödəniş üsulu</span><span>${order.paymentMethod === 'cash' ? 'Nağd' : order.paymentMethod === 'card' ? 'Kart' : 'Online'}</span></div>
  <div class="row"><span>Ödəniş statusu</span><span style="color:${order.paymentStatus === 'paid' ? '#16a34a' : '#d97706'}">${order.paymentStatus === 'paid' ? 'Ödənildi' : 'Gözlənilir'}</span></div>

  ${order.specialRequest ? `<hr class="divider"><div class="row"><span>Xüsusi qeyd:</span><span>${order.specialRequest}</span></div>` : ''}

  <div class="footer">
    <p>Təşəkkür edirik!</p>
    <p style="margin-top:4px">FoodZone POS Sistemi</p>
    <p style="margin-top:2px">${new Date().toLocaleString('az-AZ')}</p>
  </div>
</body>
</html>`;

  openPrint(html);
}

export function printKitchenTicket(order: Order) {
  const itemRows = order.items.map(item => {
    const name = item.product?.name ?? item.productId;
    return `<tr style="border-bottom:1px dashed #ccc">
      <td style="padding:6px 4px;font-size:14px;font-weight:600">${item.quantity}×</td>
      <td style="padding:6px 4px;font-size:14px">${name}</td>
    </tr>`;
  }).join('');

  const tableLabel = order.table ? `MASA ${order.table.number}` : order.fulfillmentType === 'takeaway' ? 'APARMA' : 'ÇATDIRMA';

  const html = `<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <title>Mətbəx #${order.orderNumber}</title>
  <style>
    @page { size:80mm auto;margin:3mm }
    * { box-sizing:border-box;margin:0;padding:0; }
    body { font-family:'Courier New',monospace;font-size:13px;color:#000;max-width:72mm; }
    .center { text-align:center; }
    .divider { border:none;border-top:2px solid #000;margin:6px 0; }
    table { width:100%;border-collapse:collapse; }
    @media print { body { margin:0; } }
  </style>
</head>
<body>
  <div class="center" style="margin-bottom:8px">
    <p style="font-size:20px;font-weight:900">MƏTBƏX</p>
    <p style="font-size:24px;font-weight:900">${tableLabel}</p>
  </div>

  <hr class="divider">

  <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:6px">
    <span>Sifariş #${order.orderNumber}</span>
    <span>${new Date(order.createdAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}</span>
  </div>

  <hr class="divider">

  <table>
    <tbody>${itemRows}</tbody>
  </table>

  ${order.specialRequest ? `<hr class="divider"><p style="font-size:11px;font-weight:600">QEYD: ${order.specialRequest}</p>` : ''}

  <hr class="divider">
  <div class="center" style="font-size:10px;color:#555;margin-top:4px">
    ${new Date().toLocaleString('az-AZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
  </div>
</body>
</html>`;

  openPrint(html);
}

export function printRangeReport(
  report: import('@/types').RangeReport,
  restaurantName = 'FoodZone',
  from: string,
  to: string,
) {
  const topRows = report.topProducts.slice(0, 10).map((p, i) => `
    <tr>
      <td style="color:#888;width:24px">${i + 1}</td>
      <td>${p.name}</td>
      <td style="text-align:right">${p.count} əd.</td>
      <td style="text-align:right;font-weight:600;color:#16a34a">${fmt(p.revenue)}</td>
    </tr>`).join('');

  const dailyRows = Object.entries(report.dailyBreakdown)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => `
    <tr style="border-bottom:1px solid #f1f5f9">
      <td>${new Date(date).toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
      <td style="text-align:right">${d.orders}</td>
      <td style="text-align:right;font-weight:600;color:#16a34a">${fmt(d.revenue)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <title>Hesabat — ${from} / ${to}</title>
  <style>
    @page{size:A4;margin:20mm}
    * { box-sizing:border-box;margin:0;padding:0; }
    body { font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#111;max-width:210mm; }
    h1 { font-size:18px;font-weight:700;margin-bottom:2px; }
    h2 { font-size:15px;font-weight:600;margin:16px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px; }
    section { margin-bottom:16px; }
    .row { display:flex;justify-content:space-between;padding:3px 0;font-size:13px; }
    .row span:last-child { font-weight:600; }
    .divider { border:none;border-top:1px dashed #ccc;margin:10px 0; }
    .total-row { display:flex;justify-content:space-between;padding:5px 0;font-size:15px;font-weight:700; }
    table td, table th { padding:4px 6px;vertical-align:middle; }
    .footer { margin-top:24px;text-align:center;font-size:10px;color:#aaa; }
    @media print { body { margin:0; } }
  </style>
</head>
<body>
  <section style="margin-bottom:12px">
    <h1>${restaurantName}</h1>
    <p style="color:#666;font-size:11px">Dövr Hesabatı</p>
    <p style="margin-top:4px;font-size:12px;color:#374151">${from} — ${to}</p>
  </section>

  <hr class="divider">

  <section>
    <h2>Xülasə</h2>
    <div class="row"><span>Ümumi sifariş</span><span>${report.summary.totalOrders}</span></div>
    <div class="row"><span>Ləğv edilmiş</span><span style="color:#dc2626">${report.summary.cancelledOrders}</span></div>
    <div class="row"><span>Orta çek</span><span>${fmt(report.summary.avgOrderValue)}</span></div>
    <div class="row"><span>Endirim</span><span style="color:#dc2626">-${fmt(report.summary.totalDiscount)}</span></div>
    <hr class="divider">
    <div class="row"><span>Nağd</span><span style="color:#16a34a">${fmt(report.summary.totalCash)}</span></div>
    <div class="row"><span>Kart</span><span style="color:#2563eb">${fmt(report.summary.totalCard)}</span></div>
    <div class="row"><span>Online</span><span style="color:#7c3aed">${fmt(report.summary.totalOnline)}</span></div>
    <hr class="divider">
    <div class="total-row"><span>CƏMİ GƏLİR</span><span style="color:#16a34a">${fmt(report.summary.totalRevenue)}</span></div>
  </section>

  ${topRows ? `
  <hr class="divider">
  <section>
    <h2>Ən çox satan məhsullar</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="border-bottom:1px solid #e5e7eb">
          <th style="text-align:left;padding:4px 0;color:#888">#</th>
          <th style="text-align:left;padding:4px 0;color:#888">Məhsul</th>
          <th style="text-align:right;padding:4px 0;color:#888">Miqdar</th>
          <th style="text-align:right;padding:4px 0;color:#888">Gəlir</th>
        </tr>
      </thead>
      <tbody>${topRows}</tbody>
    </table>
  </section>` : ''}

  ${dailyRows ? `
  <hr class="divider">
  <section>
    <h2>Günlük breakdown</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="border-bottom:1px solid #e5e7eb">
          <th style="text-align:left;padding:4px 0;color:#888">Tarix</th>
          <th style="text-align:right;padding:4px 0;color:#888">Sifarişlər</th>
          <th style="text-align:right;padding:4px 0;color:#888">Gəlir</th>
        </tr>
      </thead>
      <tbody>${dailyRows}</tbody>
    </table>
  </section>` : ''}

  <div class="footer">
    <p>Çap tarixi: ${new Date().toLocaleString('az-AZ')}</p>
    <p style="margin-top:2px">FoodZone POS Sistemi</p>
  </div>
</body>
</html>`;

  openPrint(html);
}

export function printShiftReport(shift: Shift, restaurantName = 'FoodZone', thermal = false) {
  const pageSize = thermal ? '@page{size:80mm auto;margin:4mm}' : '@page{size:A4;margin:20mm}';
  const bodyWidth = thermal ? 'max-width:72mm' : 'max-width:210mm';

  const cashStatus = () => {
    if (shift.cashDifference === undefined || shift.cashDifference === null) return '';
    if (shift.cashDifference === 0) return '<p style="color:#16a34a">✓ Kassa balansı düzgündür</p>';
    if (shift.cashDifference < 0) return `<p style="color:#dc2626">✗ Kassa kəsiri: ${fmt(Math.abs(shift.cashDifference))}</p>`;
    return `<p style="color:#d97706">⚠ Artıq pul: ${fmt(shift.cashDifference)}</p>`;
  };

  const html = `<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <title>Smena Hesabatı — ${fmtDate(shift.openedAt)}</title>
  <style>
    ${pageSize}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #111; ${bodyWidth}; }
    h1 { font-size: ${thermal ? '14px' : '18px'}; font-weight: 700; margin-bottom: 2px; }
    h2 { font-size: ${thermal ? '12px' : '15px'}; font-weight: 600; margin: 16px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    h3 { font-size: ${thermal ? '11px' : '13px'}; font-weight: 600; margin: 14px 0 6px; }
    section { margin-bottom: 16px; }
    .row { display: flex; justify-content: space-between; padding: 3px 0; font-size: ${thermal ? '11px' : '13px'}; }
    .row span:last-child { font-weight: 600; }
    .divider { border: none; border-top: 1px dashed #ccc; margin: 10px 0; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-open { background: #dcfce7; color: #16a34a; }
    .badge-closed { background: #f1f5f9; color: #475569; }
    .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: ${thermal ? '13px' : '15px'}; font-weight: 700; }
    table td, table th { padding: 3px 6px; vertical-align: middle; }
    .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #aaa; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <section style="text-align:${thermal ? 'center' : 'left'};margin-bottom:12px">
    <h1>${restaurantName}</h1>
    <p style="color:#666;font-size:11px">Smena Hesabatı</p>
    <p style="margin-top:4px">
      <span class="badge ${shift.status === 'open' ? 'badge-open' : 'badge-closed'}">
        ${shift.status === 'open' ? 'Aktiv smena' : 'Bağlı smena'}
      </span>
    </p>
  </section>

  <hr class="divider">

  <section>
    <h2>Smena Məlumatları</h2>
    <div class="row"><span>Açılış</span><span>${fmtDate(shift.openedAt)}</span></div>
    <div class="row"><span>Bağlanış</span><span>${fmtDate(shift.closedAt)}</span></div>
    <div class="row"><span>Müddəti</span><span>${duration(shift.openedAt, shift.closedAt)}</span></div>
    <div class="row"><span>Açan</span><span>${shift.openedBy?.name ?? '—'}</span></div>
    ${shift.closedBy ? `<div class="row"><span>Bağlayan</span><span>${shift.closedBy.name}</span></div>` : ''}
    <div class="row"><span>Açılış kassası</span><span>${fmt(shift.openingCash)}</span></div>
  </section>

  <hr class="divider">

  <section>
    <h2>Gəlir Breakdown-u</h2>
    <div class="row"><span>Nağd</span><span style="color:#16a34a">${fmt(shift.totalCash)}</span></div>
    <div class="row"><span>Kart</span><span style="color:#2563eb">${fmt(shift.totalCard)}</span></div>
    <div class="row"><span>Online</span><span style="color:#7c3aed">${fmt(shift.totalOnline)}</span></div>
    <div class="row"><span>Bahşiş</span><span>${fmt(shift.totalTips)}</span></div>
    <div class="row"><span>Endirim</span><span style="color:#dc2626">-${fmt(shift.totalDiscount)}</span></div>
    <hr class="divider">
    <div class="total-row"><span>CƏMİ GƏLİR</span><span style="color:#16a34a">${fmt(shift.totalRevenue)}</span></div>
  </section>

  <hr class="divider">

  <section>
    <h2>Kassa Balansı</h2>
    ${cashStatus()}
    ${shift.notes ? `<p style="color:#666;font-size:11px;margin-top:6px">Qeyd: ${shift.notes}</p>` : ''}
  </section>

  <hr class="divider">

  <section>
    <h2>Sifariş Statistikası</h2>
    <div class="row"><span>Ümumi sifariş</span><span>${shift.totalOrders ?? 0}</span></div>
    <div class="row"><span>Ləğv edilmiş</span><span style="color:#dc2626">${shift.cancelledOrders ?? 0}</span></div>
    ${shift.avgPrepTime ? `<div class="row"><span>Ort. hazırlama vaxtı</span><span>${shift.avgPrepTime} dəq</span></div>` : ''}
  </section>

  ${topProductsTable(shift.topProducts)}
  ${!thermal ? hourlyTable(shift.hourlyBreakdown) : ''}

  <div class="footer">
    <p>Çap tarixi: ${new Date().toLocaleString('az-AZ')}</p>
    <p style="margin-top:2px">FoodZone POS Sistemi</p>
  </div>
</body>
</html>`;

  openPrint(html);
}
