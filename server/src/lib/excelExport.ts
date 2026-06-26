import ExcelJS from 'exceljs';

interface ReportData {
  title: string;
  dateRange: { from: string; to: string };
  summary: Record<string, number | string>;
  orders: any[];
  topProducts: { name: string; count: number; revenue: number }[];
  dailyBreakdown: Record<string, { orders: number; revenue: number }>;
}

const ORANGE = 'FFFF7B1C';

function headerRow(ws: ExcelJS.Worksheet, values: string[]) {
  const row = ws.addRow(values);
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE } };
  row.alignment = { vertical: 'middle' };
  return row;
}

export async function generateRangeReportXLSX(data: ReportData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'FoodZone POS';
  wb.created = new Date();

  // ── Xülasə ────────────────────────────────────────────────────────────────
  const summary = wb.addWorksheet('Xülasə');
  summary.addRow([data.title]).font = { bold: true, size: 14 };
  summary.addRow([`Dövr: ${data.dateRange.from} — ${data.dateRange.to}`]).font = { italic: true };
  summary.addRow([]);

  headerRow(summary, ['Göstərici', 'Dəyər']);
  Object.entries(data.summary).forEach(([key, val]) => {
    summary.addRow([key, val]);
  });
  summary.getColumn(1).width = 32;
  summary.getColumn(2).width = 22;

  // ── Günlük ────────────────────────────────────────────────────────────────
  const daily = wb.addWorksheet('Günlük');
  headerRow(daily, ['Tarix', 'Sifarişlər', 'Gəlir (₼)']);
  Object.entries(data.dailyBreakdown)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, d]) => {
      const row = daily.addRow([new Date(date).toLocaleDateString('az-AZ'), d.orders, parseFloat(d.revenue.toFixed(2))]);
      row.getCell(3).numFmt = '#,##0.00 ₼';
    });
  daily.getColumn(1).width = 15;
  daily.getColumn(2).width = 15;
  daily.getColumn(3).width = 18;

  // ── Top Məhsullar ─────────────────────────────────────────────────────────
  const products = wb.addWorksheet('Top Məhsullar');
  headerRow(products, ['#', 'Məhsul', 'Miqdar', 'Gəlir (₼)']);
  data.topProducts.forEach((p, i) => {
    const row = products.addRow([i + 1, p.name, p.count, parseFloat(p.revenue.toFixed(2))]);
    row.getCell(4).numFmt = '#,##0.00 ₼';
  });
  products.getColumn(2).width = 38;

  // ── Sifarişlər ────────────────────────────────────────────────────────────
  if (data.orders?.length) {
    const orders = wb.addWorksheet('Sifarişlər');
    headerRow(orders, ['Sifariş #', 'Tarix', 'Masa', 'Status', 'Ödəniş', 'Cəmi (₼)']);
    data.orders.forEach(o => {
      const row = orders.addRow([
        o.orderNumber,
        new Date(o.createdAt).toLocaleString('az-AZ'),
        o.table?.number ?? '—',
        o.status,
        o.paymentMethod,
        parseFloat(o.total.toFixed(2)),
      ]);
      row.getCell(6).numFmt = '#,##0.00 ₼';
    });
    orders.getColumn(1).width = 15;
    orders.getColumn(2).width = 22;
    orders.getColumn(3).width = 8;
    orders.getColumn(5).width = 12;
  }

  return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
}
