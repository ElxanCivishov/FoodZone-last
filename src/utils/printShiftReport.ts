import type { Shift } from '@/types';

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

  const win = window.open('', '_blank', 'width=800,height=900');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
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

  const win = window.open('', '_blank', 'width=800,height=900');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}
