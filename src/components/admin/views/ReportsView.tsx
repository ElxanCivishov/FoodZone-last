import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, TrendingUp, Banknote, CreditCard, Globe,
  Calendar, ShoppingBag, Tag, Printer
} from 'lucide-react';
import api from '@/services/api';
import { useActiveBranch } from '../hooks/useActiveBranch';
import { SectionTitle } from '../components/SectionTitle';
import { printRangeReport } from '@/utils/printShiftReport';
import type { RangeReport, RevenueBreakdown, HourlyBreakdown } from '@/types';

export function ReportsView() {
  const { activeBranch } = useActiveBranch();
  const branchId = activeBranch?.id;

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const [from, setFrom] = useState(weekAgo);
  const [to, setTo] = useState(today);

  const { data: report, isLoading } = useQuery<RangeReport>({
    queryKey: ['range-report', branchId, from, to],
    queryFn: () => api.get(`/shifts/reports/range?branchId=${branchId}&from=${from}&to=${to}`).then((r: any) => r.data.data),
    enabled: !!branchId,
  });

  const { data: trend = [] } = useQuery<RevenueBreakdown[]>({
    queryKey: ['revenue-trend', branchId],
    queryFn: () => api.get(`/dashboard/revenue-trend?branchId=${branchId}`).then((r: any) => r.data.data),
    enabled: !!branchId,
  });

  const { data: hourly = [] } = useQuery<HourlyBreakdown[]>({
    queryKey: ['hourly', branchId],
    queryFn: () => api.get(`/dashboard/hourly?branchId=${branchId}`).then((r: any) => r.data.data),
    enabled: !!branchId,
  });

  const fmtMoney = (n: number) => `${n.toFixed(2)} ₼`;
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit' });

  const maxRevenue = Math.max(...trend.map(d => d.revenue), 1);
  const maxHourly = Math.max(...hourly.map(h => h.orders), 1);

  return (
    <div className="space-y-8">
      <SectionTitle title="Hesabatlar" subtitle="Gəlir analitikası və statistika" />

      {/* Tarix Seçimi */}
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-2.5">
          <Calendar className="h-4 w-4 text-foreground-muted" />
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="text-sm bg-transparent outline-none" />
          <span className="text-foreground-muted">—</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="text-sm bg-transparent outline-none" />
        </div>
        {[
          { label: 'Bu gün', days: 0 },
          { label: 'Son 7 gün', days: 7 },
          { label: 'Son 30 gün', days: 30 },
        ].map(({ label, days }) => (
          <button key={label} onClick={() => {
            const t2 = new Date().toISOString().split('T')[0];
            const f2 = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
            setFrom(days === 0 ? t2 : f2); setTo(t2);
          }}
            className="px-3 py-2 rounded-xl text-sm border border-border hover:bg-surface-elevated transition-colors">
            {label}
          </button>
        ))}
        {report && (
          <button
            onClick={() => printRangeReport(report, activeBranch?.restaurant?.name, from, to)}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm font-medium text-foreground-muted hover:bg-surface-elevated hover:text-foreground transition-colors"
          >
            <Printer className="h-4 w-4" /> Çap et (A4)
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-sm text-foreground-muted">Yüklənir...</div>
      ) : report ? (
        <>
          {/* Xülasə Kartları */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Ümumi gəlir', value: fmtMoney(report.summary.totalRevenue), icon: TrendingUp, color: 'text-success-600', bg: 'bg-success-500/10' },
              { label: 'Sifarişlər', value: report.summary.totalOrders.toString(), icon: ShoppingBag, color: 'text-primary-500', bg: 'bg-primary-500/10' },
              { label: 'Orta çek', value: fmtMoney(report.summary.avgOrderValue), icon: BarChart3, color: 'text-warning-600', bg: 'bg-warning-500/10' },
              { label: 'Endirim', value: fmtMoney(report.summary.totalDiscount), icon: Tag, color: 'text-danger-500', bg: 'bg-danger-500/10' },
            ].map(item => (
              <div key={item.label} className="rounded-2xl border border-border bg-surface-elevated p-5">
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${item.bg} mb-3`}>
                  <item.icon className={`h-4.5 w-4.5 ${item.color}`} />
                </div>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-foreground-muted mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Ödəniş Breakdown */}
          <div className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h3 className="text-sm font-semibold mb-4">Ödəniş Metodları</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Nağd', value: report.summary.totalCash, icon: Banknote, color: 'text-success-600', bg: 'bg-success-500/10' },
                { label: 'Kart', value: report.summary.totalCard, icon: CreditCard, color: 'text-primary-500', bg: 'bg-primary-500/10' },
                { label: 'Online', value: report.summary.totalOnline, icon: Globe, color: 'text-info-500', bg: 'bg-info-500/10' },
              ].map(item => {
                const pct = report.summary.totalRevenue > 0 ? (item.value / report.summary.totalRevenue * 100).toFixed(0) : '0';
                return (
                  <div key={item.label} className="text-center">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.bg} mb-2`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <p className={`text-xl font-bold ${item.color}`}>{fmtMoney(item.value)}</p>
                    <p className="text-xs text-foreground-muted">{item.label} · {pct}%</p>
                    <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${item.bg.replace('bg-', 'bg-').replace('/10', '')}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Günlük gəlir qrafiki */}
          <div className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h3 className="text-sm font-semibold mb-4">Günlük gəlir (son 7 gün)</h3>
            <div className="flex items-end gap-2 h-32">
              {trend.map(d => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs text-foreground-muted">{fmtMoney(d.revenue)}</p>
                  <div className="w-full rounded-t-lg bg-primary-500/20 transition-all hover:bg-primary-500/40 relative"
                    style={{ height: `${Math.max(8, (d.revenue / maxRevenue) * 100)}px` }}>
                    <div className="absolute inset-x-0 bottom-0 rounded-t-lg bg-primary-500"
                      style={{ height: `${Math.max(8, (d.revenue / maxRevenue) * 100)}px` }} />
                  </div>
                  <p className="text-xs text-foreground-muted">{fmtDate(d.date)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Saatlara görə paylanma */}
          <div className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h3 className="text-sm font-semibold mb-4">Bu günün saatlara görə sifariş paylanması</h3>
            <div className="flex items-end gap-1 h-24">
              {hourly.map(h => (
                <div key={h.hour} className="flex-1 flex flex-col items-center">
                  <div className="w-full rounded-t bg-warning-500 transition-all"
                    style={{ height: `${Math.max(2, (h.orders / maxHourly) * 80)}px` }} />
                  {h.hour % 4 === 0 && <p className="text-xs text-foreground-muted mt-1">{h.hour}:00</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Ən çox satan məhsullar */}
          <div className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h3 className="text-sm font-semibold mb-4">Ən çox satan məhsullar</h3>
            <div className="space-y-3">
              {report.topProducts.slice(0, 10).map((p, i) => (
                <div key={p.productId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground-muted w-6">#{i + 1}</span>
                    <p className="text-sm font-medium">{p.name}</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-foreground-muted">{p.count} ədəd</span>
                    <span className="font-semibold text-success-600">{fmtMoney(p.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Smenalar */}
          {report.shifts.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface-elevated p-6">
              <h3 className="text-sm font-semibold mb-4">Bu dövrün smenaları</h3>
              <div className="space-y-2">
                {report.shifts.map(s => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{new Date(s.openedAt).toLocaleDateString('az-AZ')}</p>
                      <p className="text-xs text-foreground-muted">{s.openedBy?.name}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {s.totalRevenue !== undefined && <span className="font-semibold text-success-600">{fmtMoney(s.totalRevenue)}</span>}
                      {s.totalOrders !== undefined && <span className="text-foreground-muted">{s.totalOrders} sifariş</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
