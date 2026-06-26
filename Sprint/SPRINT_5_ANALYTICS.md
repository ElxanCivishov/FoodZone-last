# Sprint 5 — Advanced Analytics & Export

**Məqsəd:** Dashboard 2.0, yeni analitika qrafiklər, PDF/Excel export, müqayisəli hesabatlar.  
**Ön şərt:** Sprint 1 tamamlanmış olmalıdır.

---

## Cari Vəziyyət

**Mövcud olan:**
- `AnalyticsView.tsx` — revenue, products (ABC), heatmap, operations tabları — artıq mövcuddur
- `ReportsView.tsx` — range report, shift history — artıq mövcuddur
- `DashboardView.tsx` — metric kartlar, son sifarişlər, xəbərdarlıqlar — artıq mövcuddur
- `printShiftReport.ts` — HTML → `window.print()` metodu
- Backend: `/api/dashboard/stats`, `/api/dashboard/revenue-trend`, `/api/dashboard/hourly` mövcuddur

**Mövcud olmayan:**
- Excel (XLSX) export
- PDF export (browser print-dan fərqli olaraq server-side)
- Müqayisəli hesabat (bu həftə vs ötən həftə)
- Funnel analitikası (QR scan → order konversiyası)
- Dashboard live table map (masalar üzərindəki canlı statuslar)
- Scheduled email hesabatı

---

## Paket Qurulması

```bash
# Server tərəfindən:
cd server && npm install exceljs

# Client tərəfindən (browser-side XLSX):
npm install xlsx file-saver
npm install --save-dev @types/file-saver
```

---

## Tapşırıq 1 — Excel Export Servisi (Server)

**Yeni fayl:** `server/src/lib/excelExport.ts`

```typescript
import ExcelJS from 'exceljs';

interface ReportData {
  title:         string;
  dateRange:     { from: string; to: string };
  summary:       Record<string, number | string>;
  orders:        any[];
  topProducts:   { name: string; count: number; revenue: number }[];
  dailyBreakdown: Record<string, { orders: number; revenue: number }>;
}

export async function generateRangeReportXLSX(data: ReportData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'FoodZone POS';
  wb.created  = new Date();

  // ── Xülasə Vərəqi ─────────────────────────────────────────────────────────
  const summary = wb.addWorksheet('Xülasə');
  summary.addRow([data.title]);
  summary.addRow([`Dövr: ${data.dateRange.from} — ${data.dateRange.to}`]);
  summary.addRow([]);

  const headerRow = summary.addRow(['Göstərici', 'Dəyər']);
  headerRow.font = { bold: true };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF7B1C' } };

  Object.entries(data.summary).forEach(([key, val]) => {
    summary.addRow([key, val]);
  });

  summary.getColumn(1).width = 30;
  summary.getColumn(2).width = 20;

  // ── Günlük Breakdown ──────────────────────────────────────────────────────
  const daily = wb.addWorksheet('Günlük');
  const dh = daily.addRow(['Tarix', 'Sifarişlər', 'Gəlir (₼)']);
  dh.font = { bold: true };
  dh.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF7B1C' } };

  Object.entries(data.dailyBreakdown)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, d]) => {
      const row = daily.addRow([new Date(date).toLocaleDateString('az-AZ'), d.orders, d.revenue.toFixed(2)]);
      row.getCell(3).numFmt = '#,##0.00 ₼';
    });

  daily.getColumn(1).width = 15;
  daily.getColumn(2).width = 15;
  daily.getColumn(3).width = 18;

  // ── Top Məhsullar ─────────────────────────────────────────────────────────
  const products = wb.addWorksheet('Top Məhsullar');
  const ph = products.addRow(['#', 'Məhsul', 'Miqdar', 'Gəlir (₼)']);
  ph.font = { bold: true };
  ph.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF7B1C' } };

  data.topProducts.forEach((p, i) => {
    const row = products.addRow([i + 1, p.name, p.count, p.revenue.toFixed(2)]);
    row.getCell(4).numFmt = '#,##0.00 ₼';
  });

  products.getColumn(2).width = 35;

  // ── Sifarişlər (ətraflı) ─────────────────────────────────────────────────
  if (data.orders?.length) {
    const orders = wb.addWorksheet('Sifarişlər');
    const oh = orders.addRow(['Sifariş #', 'Tarix', 'Masa', 'Status', 'Ödəniş', 'Cəmi (₼)']);
    oh.font = { bold: true };

    data.orders.forEach(o => {
      orders.addRow([
        o.orderNumber,
        new Date(o.createdAt).toLocaleString('az-AZ'),
        o.table?.number ?? '—',
        o.status,
        o.paymentMethod,
        o.total.toFixed(2),
      ]);
    });

    orders.getColumn(1).width = 15;
    orders.getColumn(2).width = 20;
  }

  return wb.xlsx.writeBuffer() as Promise<Buffer>;
}
```

---

## Tapşırıq 2 — Excel Export Route

**Fayl:** `server/src/routes/shifts.ts` (mövcud fayldır)  
**Dəyişiklik:** Faylın sonuna export endpoint əlavə et.

```typescript
import { generateRangeReportXLSX } from '../lib/excelExport';

// Mövcud routes-ın sonuna:

// XLSX export
router.get('/reports/export/xlsx', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, from, to } = req.query;
    if (!branchId || !from || !to) return res.status(400).json({ success: false, message: 'Parametrlər çatışmır' });

    const fromDate = new Date(from as string);
    const toDate   = new Date(to as string);
    toDate.setHours(23, 59, 59, 999);

    const [orders, topRaw] = await Promise.all([
      prisma.order.findMany({
        where:   { branchId: branchId as string, createdAt: { gte: fromDate, lte: toDate }, status: { not: 'cancelled' } },
        include: { table: { select: { number: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.$queryRaw<any[]>`
        SELECT p."nameAz" as name, COUNT(oi.id)::int as count, SUM(oi."totalPrice")::float as revenue
        FROM "OrderItem" oi
        JOIN "Order" o ON o.id = oi."orderId"
        JOIN "Product" p ON p.id = oi."productId"
        WHERE o."branchId" = ${branchId} AND o."createdAt" >= ${fromDate} AND o."createdAt" <= ${toDate}
        GROUP BY p.id, p."nameAz"
        ORDER BY count DESC
        LIMIT 20
      `,
    ]);

    const totalRevenue  = orders.reduce((s, o) => s + o.total, 0);
    const totalCash     = orders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);
    const totalCard     = orders.filter(o => o.paymentMethod === 'card').reduce((s, o) => s + o.total, 0);
    const totalOnline   = orders.filter(o => ['online', 'payriff', 'm10'].includes(o.paymentMethod)).reduce((s, o) => s + o.total, 0);

    const dailyBreakdown: Record<string, { orders: number; revenue: number }> = {};
    orders.forEach(o => {
      const key = o.createdAt.toISOString().split('T')[0];
      if (!dailyBreakdown[key]) dailyBreakdown[key] = { orders: 0, revenue: 0 };
      dailyBreakdown[key].orders++;
      dailyBreakdown[key].revenue += o.total;
    });

    const buffer = await generateRangeReportXLSX({
      title:         'FoodZone Gəlir Hesabatı',
      dateRange:     { from: from as string, to: to as string },
      summary:       {
        'Ümumi sifariş': orders.length,
        'Cəmi gəlir':    `${totalRevenue.toFixed(2)} ₼`,
        'Nağd':          `${totalCash.toFixed(2)} ₼`,
        'Kart':          `${totalCard.toFixed(2)} ₼`,
        'Online':        `${totalOnline.toFixed(2)} ₼`,
        'Orta çek':      orders.length ? `${(totalRevenue / orders.length).toFixed(2)} ₼` : '0.00 ₼',
      },
      orders,
      topProducts:   topRaw,
      dailyBreakdown,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="foodzone-report-${from}-${to}.xlsx"`);
    res.send(buffer);
  } catch (err) { next(err); }
});
```

---

## Tapşırıq 3 — Frontend: Export Düymələri

**Fayl:** `src/components/admin/views/ReportsView.tsx`  
**Dəyişiklik:** Mövcud "Çap et" düyməsinin yanına "Excel" düyməsi əlavə et.

```tsx
import { Download, FileSpreadsheet, Printer } from 'lucide-react';

// Export funksiyası:
const handleXLSXExport = () => {
  const url = `/api/shifts/reports/export/xlsx?branchId=${branchId}&from=${from}&to=${to}`;
  const link = document.createElement('a');
  link.href = url;
  link.download = `foodzone-report-${from}-${to}.xlsx`;
  // Authorization header lazımdır — fetch ilə et:
  fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    .then(r => r.blob())
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    });
};

// UI:
<div className="flex items-center gap-2">
  <button onClick={() => report && printRangeReport(report, restaurantName, from, to)}
    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-surface-elevated transition-colors text-sm">
    <Printer className="w-4 h-4" />
    Çap et
  </button>
  <button onClick={handleXLSXExport}
    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success-500 text-white hover:bg-success-600 transition-colors text-sm font-medium">
    <FileSpreadsheet className="w-4 h-4" />
    Excel
  </button>
</div>
```

---

## Tapşırıq 4 — Müqayisəli Hesabat Widget

**Fayl:** `src/components/admin/views/DashboardView.tsx`  
**Dəyişiklik:** Mövcud DashboardView-ə müqayisə widget-i əlavə et.

```typescript
// Yeni backend endpoint — server/src/routes/dashboard.ts sonuna:

router.get('/comparison', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId } = req.query;

    const now           = new Date();
    const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - now.getDay());
    const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd   = new Date(thisWeekStart);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0);

    const branchFilter = branchId ? { branchId: branchId as string } : {};

    const [thisWeek, lastWeek, thisMonth, lastMonth] = await Promise.all([
      prisma.order.aggregate({
        where: { ...branchFilter, createdAt: { gte: thisWeekStart }, status: { not: 'cancelled' } },
        _sum:   { total: true }, _count: { id: true },
      }),
      prisma.order.aggregate({
        where: { ...branchFilter, createdAt: { gte: lastWeekStart, lt: lastWeekEnd }, status: { not: 'cancelled' } },
        _sum:   { total: true }, _count: { id: true },
      }),
      prisma.order.aggregate({
        where: { ...branchFilter, createdAt: { gte: thisMonthStart }, status: { not: 'cancelled' } },
        _sum:   { total: true }, _count: { id: true },
      }),
      prisma.order.aggregate({
        where: { ...branchFilter, createdAt: { gte: lastMonthStart, lt: lastMonthEnd }, status: { not: 'cancelled' } },
        _sum:   { total: true }, _count: { id: true },
      }),
    ]);

    const pctChange = (cur: number, prev: number) => prev === 0 ? 100 : ((cur - prev) / prev) * 100;

    res.json({
      success: true,
      data: {
        week: {
          current:    { revenue: thisWeek._sum.total ?? 0, orders: thisWeek._count.id },
          previous:   { revenue: lastWeek._sum.total ?? 0, orders: lastWeek._count.id },
          revenuePct: pctChange(thisWeek._sum.total ?? 0, lastWeek._sum.total ?? 0),
          ordersPct:  pctChange(thisWeek._count.id, lastWeek._count.id),
        },
        month: {
          current:    { revenue: thisMonth._sum.total ?? 0, orders: thisMonth._count.id },
          previous:   { revenue: lastMonth._sum.total ?? 0, orders: lastMonth._count.id },
          revenuePct: pctChange(thisMonth._sum.total ?? 0, lastMonth._sum.total ?? 0),
          ordersPct:  pctChange(thisMonth._count.id, lastMonth._count.id),
        },
      },
    });
  } catch (err) { next(err); }
});
```

**Frontend widget:**
```tsx
// DashboardView-ə əlavə et:
function ComparisonWidget({ data }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[
        { label: 'Bu həftə', ...data.week },
        { label: 'Bu ay', ...data.month },
      ].map((item) => (
        <div key={item.label} className="bg-surface-elevated rounded-2xl p-4 border border-border">
          <p className="text-xs text-foreground-muted mb-3">{item.label}</p>
          <p className="text-xl font-bold">{item.current.revenue.toFixed(2)} ₼</p>
          <div className={cn(
            'flex items-center gap-1 text-xs mt-1 font-medium',
            item.revenuePct >= 0 ? 'text-success-600' : 'text-danger-500',
          )}>
            {item.revenuePct >= 0 ? '↑' : '↓'}
            {Math.abs(item.revenuePct).toFixed(1)}% ötən dövrdən
          </div>
          <p className="text-xs text-foreground-muted mt-1">{item.current.orders} sifariş</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Tapşırıq 5 — Konversiya Funnel (Yeni API)

**Fayl:** `server/src/routes/dashboard.ts`  
**Dəyişiklik:** Funnel məlumatları üçün yeni endpoint.

```typescript
router.get('/funnel', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, days = '7' } = req.query;
    const since = new Date(Date.now() - Number(days) * 86400000);

    // QR skan sayı (sessions cədvəlindən — əgər varsa, yoxsa orders-dən)
    // Hələlik order-based funnel:
    const [total, confirmed, paid] = await Promise.all([
      prisma.order.count({ where: { branchId: branchId as string, createdAt: { gte: since } } }),
      prisma.order.count({ where: { branchId: branchId as string, createdAt: { gte: since }, status: { not: 'cancelled' } } }),
      prisma.order.count({ where: { branchId: branchId as string, createdAt: { gte: since }, paymentStatus: 'paid' } }),
    ]);

    res.json({
      success: true,
      data: [
        { stage: 'Sifariş verildi',  count: total,     pct: 100 },
        { stage: 'Qəbul edildi',     count: confirmed, pct: total ? (confirmed / total) * 100 : 0 },
        { stage: 'Ödənilib',         count: paid,      pct: total ? (paid / total) * 100 : 0 },
      ],
    });
  } catch (err) { next(err); }
});
```

**Frontend (AnalyticsView-ə yeni tab):**
```tsx
// "Konversiya" tab-ı:
// Hər stage üçün bar + faiz göstər
{funnelData.map((stage, i) => (
  <div key={stage.stage} className="space-y-1">
    <div className="flex justify-between text-sm">
      <span>{stage.stage}</span>
      <span className="font-semibold">{stage.count} ({stage.pct.toFixed(1)}%)</span>
    </div>
    <motion.div
      className="h-8 rounded-lg bg-primary-500/80"
      initial={{ width: 0 }}
      animate={{ width: `${stage.pct}%` }}
      transition={{ delay: i * 0.1, duration: 0.6, type: 'spring' }}
    />
  </div>
))}
```

---

## Tapşırıq 6 — Dashboard: Live Table Map

**Fayl:** `src/components/admin/views/DashboardView.tsx`  
**Dəyişiklik:** Masa planını widget olaraq əlavə et.

```tsx
// Masa statuslarını real-time göstər:
// Hər masa üçün: status rəngi + aktif sifariş məbləği

const TABLE_STATUS_COLORS = {
  free:     'bg-success-500/20 border-success-500/40 text-success-600',
  occupied: 'bg-orange-500/20 border-orange-500/40 text-orange-600',
  payment:  'bg-blue-500/20  border-blue-500/40  text-blue-600',
  reserved: 'bg-purple-500/20 border-purple-500/40 text-purple-600',
};

function LiveTableGrid({ tables }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
      {tables.map((table) => (
        <motion.div
          key={table.id}
          whileHover={{ scale: 1.05 }}
          className={cn(
            'rounded-xl border-2 p-2 text-center cursor-pointer transition-colors',
            TABLE_STATUS_COLORS[table.liveStatus ?? 'free'],
          )}
        >
          <div className="text-xs font-bold">{table.number}</div>
          {table.activeRevenue > 0 && (
            <div className="text-[10px] mt-0.5">{table.activeRevenue.toFixed(0)} ₼</div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
```

---

## Tapşırıq 7 — Scheduled Email Hesabatı (Scheduler)

**Fayl:** `server/src/jobs/scheduler.ts`  
**Dəyişiklik:** Günlük gündəlik hesabat emaili (isteğe bağlı, SMTP konfiqurasiyası lazımdır).

```typescript
// scheduler.ts-ə əlavə et:

// Hər gün saat 23:50-də günlük hesabat (isteğe bağlı):
cron.schedule('50 23 * * *', async () => {
  try {
    const branches = await prisma.branch.findMany({ where: { status: 'active' } });
    // Hər filial üçün günlük stats topla + email göndər
    // Hal-hazırda: sadəcə console.log, SMTP sonraya
    for (const branch of branches) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const stats = await prisma.order.aggregate({
        where: { branchId: branch.id, createdAt: { gte: today }, status: { not: 'cancelled' } },
        _sum: { total: true }, _count: { id: true },
      });
      console.log(`[Daily Report] ${branch.name}: ${stats._count.id} sifariş, ${(stats._sum.total ?? 0).toFixed(2)} ₼`);
    }
  } catch { /* silent */ }
});

console.log('⏰ Scheduler started (SLA: 2 min, Daily report: 23:50)');
```

---

## Tamamlanma Vəziyyəti

- [x] `cd server && npm install exceljs` işə salındı
- [x] `server/src/lib/excelExport.ts` yaradıldı (4 worksheet: Xülasə, Günlük, Top Məhsullar, Sifarişlər)
- [x] `server/src/routes/shifts.ts` — `/reports/export/xlsx` əlavə edildi
- [x] `ReportsView.tsx` — Excel export düyməsi əlavə edildi; xülasə kartlar zəngin panel ilə əvəz edildi
- [x] `server/src/routes/dashboard.ts` — `/comparison` endpoint əlavə edildi
- [x] `DashboardView.tsx` — `ComparisonWidget` əlavə edildi (həftə/ay müqayisəsi)
- [x] `server/src/routes/dashboard.ts` — `/funnel` endpoint əlavə edildi
- [x] `AnalyticsView.tsx` — "Konversiya" tab + funnel qrafiki əlavə edildi
- [x] `DashboardView.tsx` — `LiveTableGrid` widget əlavə edildi (canlı masa xəritəsi)
- [x] `scheduler.ts` — Günlük hesabat cron əlavə edildi (23:50, notification ilə)

---

## Növbəti Sprint

Sprint 5 tamamlandıqdan sonra **SPRINT_6_FEATURES.md** faylına keç.
