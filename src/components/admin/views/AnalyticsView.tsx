import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import {
  TrendingUp, Package, Clock, Flame,
  BarChart3, ChefHat, Star, Table2, Filter, TrendingDown,
} from 'lucide-react';
import api from '@/services/api';
import { useActiveBranch } from '../hooks/useActiveBranch';
import { SectionTitle } from '../components/SectionTitle';
import type { RevenueBreakdown, HourlyBreakdown } from '@/types';

type Tab = 'revenue' | 'products' | 'heatmap' | 'operations' | 'funnel';
type Period = '7' | '30' | '90';

const PERIOD_LABELS: Record<Period, string> = { '7': 'Son 7 gün', '30': 'Son 30 gün', '90': 'Son 90 gün' };

interface AbcProduct {
  productId: string;
  name: string;
  categoryName: string;
  count: number;
  revenue: number;
  revenuePct: number;
  abc: 'A' | 'B' | 'C';
}

interface HeatmapCell { hour: number; day: number; count: number; }

interface KitchenStat {
  date: string;
  avgPrepTime: number;
  totalOrders: number;
  cancelledOrders: number;
  completionRate: number;
}

interface PaymentTrend {
  date: string;
  cash: number;
  card: number;
  online: number;
}

interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  orders: number;
  revenue: number;
  revenuePct: number;
}

interface TableOccupancy {
  date: string;
  uniqueTablesUsed: number;
  totalTables: number;
  occupancyPct: number;
  cancellations: number;
  totalOrders: number;
  cancellationRate: number;
}

const DAY_LABELS = ['Baz', 'Ber', 'Çər', 'Cüm.ə', 'Cüm', 'Şnb', 'Baz.ə'];

interface ComparisonData {
  week: {
    current: { revenue: number; orders: number };
    previous: { revenue: number; orders: number };
    revenuePct: number;
    ordersPct: number;
  };
  month: {
    current: { revenue: number; orders: number };
    previous: { revenue: number; orders: number };
    revenuePct: number;
    ordersPct: number;
  };
}

const ABC_COLORS: Record<string, string> = {
  A: 'bg-success-500/15 text-success-600 border-success-500/30',
  B: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
  C: 'bg-danger-500/15 text-danger-500 border-danger-500/30',
};

const PIE_COLORS = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const TT: object = {
  contentStyle: {
    background: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    fontSize: 12,
    color: '#fff',
  },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
};

export function AnalyticsView() {
  const { activeBranch } = useActiveBranch();
  const branchId = activeBranch?.id;
  const [activeTab, setActiveTab] = useState<Tab>('revenue');
  const [period, setPeriod] = useState<Period>('7');

  /* ─── Queries ─── */
  const { data: trend = [] } = useQuery<RevenueBreakdown[]>({
    queryKey: ['revenue-trend', branchId, period],
    queryFn: () => api.get(`/dashboard/revenue-trend?branchId=${branchId}&days=${period}`).then((r: any) => r.data),
    enabled: !!branchId && activeTab === 'revenue',
  });

  const { data: hourly = [] } = useQuery<HourlyBreakdown[]>({
    queryKey: ['hourly', branchId],
    queryFn: () => api.get(`/dashboard/hourly?branchId=${branchId}`).then((r: any) => r.data),
    enabled: !!branchId && activeTab === 'revenue',
  });

  const { data: paymentTrend = [] } = useQuery<PaymentTrend[]>({
    queryKey: ['payment-trend', branchId, period],
    queryFn: () => api.get(`/dashboard/payment-trend?branchId=${branchId}&days=${period}`).then((r: any) => r.data),
    enabled: !!branchId && activeTab === 'revenue',
  });

  const { data: comparison } = useQuery<ComparisonData>({
    queryKey: ['comparison', branchId],
    queryFn: () => api.get(`/dashboard/comparison?branchId=${branchId}`).then((r: any) => r.data),
    enabled: !!branchId && activeTab === 'revenue',
    staleTime: 60000,
    refetchInterval: 300000,
  });

  const { data: abcResult } = useQuery<{ data: AbcProduct[]; totalRevenue: number }>({
    queryKey: ['product-abc', branchId, period],
    queryFn: () => api.get(`/dashboard/product-abc?branchId=${branchId}&days=${period}`).then((r: any) => r),
    enabled: !!branchId && activeTab === 'products',
  });

  const { data: categoryResult } = useQuery<{ data: CategoryBreakdown[]; totalRevenue: number }>({
    queryKey: ['category-breakdown', branchId, period],
    queryFn: () => api.get(`/dashboard/category-breakdown?branchId=${branchId}&days=${period}`).then((r: any) => r),
    enabled: !!branchId && activeTab === 'products',
  });

  const { data: heatmapData } = useQuery<{ data: HeatmapCell[]; max: number }>({
    queryKey: ['weekly-heatmap', branchId],
    queryFn: () => api.get(`/dashboard/weekly-heatmap?branchId=${branchId}&weeks=4`).then((r: any) => r),
    enabled: !!branchId && activeTab === 'heatmap',
  });

  const { data: kitchenData } = useQuery<KitchenStat[]>({
    queryKey: ['kitchen-stats', branchId, period],
    queryFn: () => api.get(`/dashboard/kitchen-stats?branchId=${branchId}&days=${period}`).then((r: any) => r.data),
    enabled: !!branchId && activeTab === 'operations',
  });

  const { data: occupancyResult } = useQuery<{ data: TableOccupancy[]; totalTables: number }>({
    queryKey: ['table-occupancy', branchId, period],
    queryFn: () => api.get(`/dashboard/table-occupancy?branchId=${branchId}&days=${period}`).then((r: any) => r),
    enabled: !!branchId && activeTab === 'operations',
  });

  const { data: funnelData } = useQuery<Array<{ stage: string; count: number; pct: number }>>({
    queryKey: ['funnel', branchId, period],
    queryFn: () => api.get(`/dashboard/funnel?branchId=${branchId}&days=${period}`).then((r: any) => r.data),
    enabled: !!branchId && activeTab === 'funnel',
  });

  /* ─── Helpers ─── */
  const fmtMoney = (n: number | null | undefined) => `${(n ?? 0).toFixed(2)} ₼`;
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit' });

  const trendWithLabel = trend.map(d => ({ ...d, label: fmtDate(d.date) }));
  const paymentWithLabel = paymentTrend.map(d => ({ ...d, label: fmtDate(d.date) }));
  const totalRevenue = trend.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = trend.reduce((s, d) => s + (d.orders ?? 0), 0);
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const tabs: { id: Tab; label: string; icon: typeof TrendingUp }[] = [
    { id: 'revenue', label: 'Gəlir', icon: TrendingUp },
    { id: 'products', label: 'Məhsullar', icon: Package },
    { id: 'heatmap', label: 'Pik Saatlar', icon: Flame },
    { id: 'operations', label: 'Əməliyyat', icon: ChefHat },
    { id: 'funnel', label: 'Konversiya', icon: Filter },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle title="Analitika" subtitle="Dərin biznes analizi" />

      {/* Tab Bar */}
      <div className="flex gap-1 rounded-2xl border border-border bg-surface-elevated p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Period Selector — show on all tabs except heatmap */}
      {activeTab !== 'heatmap' && (
        <div className="flex gap-1 self-start rounded-xl border border-border bg-surface-elevated p-1 w-fit">
          {(['7', '30', '90'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                period === p
                  ? 'bg-primary-500/20 text-primary-500'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      )}

      {/* ═══════ GƏLİR ═══════ */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: `${PERIOD_LABELS[period]} gəlir`, value: fmtMoney(totalRevenue), icon: TrendingUp, color: 'text-success-600', bg: 'bg-success-500/10' },
              { label: 'Ümumi sifarişlər', value: totalOrders.toString(), icon: BarChart3, color: 'text-primary-500', bg: 'bg-primary-500/10' },
              { label: 'Orta çek (AOV)', value: fmtMoney(aov), icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
            ].map(item => (
              <div key={item.label} className="rounded-2xl border border-border bg-surface-elevated p-5">
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${item.bg} mb-3`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-foreground-muted mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          {comparison && <ComparisonWidget data={comparison} fmtMoney={fmtMoney} />}

          {/* Revenue Area Chart */}
          <ChartCard title={`Gəlir Trendi (${PERIOD_LABELS[period]})`}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendWithLabel} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  interval={Number(period) > 14 ? Math.floor(Number(period) / 8) : 0} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${v}₼`} width={52} />
                <Tooltip {...TT} formatter={(v: unknown) => [fmtMoney(Number(v)), 'Gəlir']} />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5}
                  fill="url(#revGrad)" dot={false} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Orders Bar */}
          <ChartCard title="Sifariş Sayı Trendi">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={trendWithLabel} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  interval={Number(period) > 14 ? Math.floor(Number(period) / 8) : 0} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
                <Tooltip {...TT} formatter={(v: unknown) => [Number(v), 'Sifariş']} />
                <Bar dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Payment Method Trend */}
          <ChartCard title="Ödəniş Metodu Trendi">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={paymentWithLabel} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  interval={Number(period) > 14 ? Math.floor(Number(period) / 8) : 0} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${v}₼`} width={52} />
                <Tooltip {...TT} formatter={(v: unknown) => [fmtMoney(Number(v))]} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(val) => <span style={{ fontSize: 11, color: '#9ca3af' }}>{val}</span>} />
                <Line type="monotone" dataKey="cash" name="Nağd" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="card" name="Kart" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="online" name="Online" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Hourly distribution */}
          <ChartCard title="Bu günün saat paylanması">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={hourly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={h => h % 4 === 0 ? `${h}:00` : ''} />
                <YAxis hide allowDecimals={false} />
                <Tooltip {...TT} formatter={(v: unknown) => [Number(v), 'Sifariş']} labelFormatter={h => `${h}:00`} />
                <Bar dataKey="orders" fill="#f59e0b" radius={[3, 3, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ═══════ MƏHSULLAR (ABC) ═══════ */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Category Pie + table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title={`Kateqoriya Gəlir Paylanması (${PERIOD_LABELS[period]})`}>
              {!categoryResult ? (
                <Loading />
              ) : categoryResult.data.filter(c => c.revenue > 0).length === 0 ? (
                <Empty />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={categoryResult.data.filter(c => c.revenue > 0).slice(0, 8)}
                        dataKey="revenue"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                      >
                        {categoryResult.data.filter(c => c.revenue > 0).slice(0, 8).map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12, color: '#fff' }}
                        formatter={(v: unknown) => [fmtMoney(Number(v)), 'Gəlir']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {categoryResult.data.filter(c => c.revenue > 0).slice(0, 6).map((c, i) => (
                      <div key={c.categoryId} className="flex items-center gap-2 text-xs">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="flex-1 truncate text-foreground-muted">{c.categoryName}</span>
                        <span className="font-medium">{c.revenuePct}%</span>
                        <span className="text-foreground-muted w-16 text-right">{fmtMoney(c.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </ChartCard>

            {/* Category bar chart */}
            <ChartCard title="Kateqoriya Sifarişləri">
              {!categoryResult ? (
                <Loading />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={categoryResult.data.filter(c => c.orders > 0).slice(0, 8).map(c => ({ ...c, name: c.categoryName.length > 12 ? c.categoryName.slice(0, 12) + '…' : c.categoryName }))}
                    layout="vertical"
                    margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip {...TT} formatter={(v: unknown) => [Number(v), 'Sifariş']} />
                    <Bar dataKey="orders" fill="#f97316" radius={[0, 4, 4, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* ABC Legend */}
          <div className="flex flex-wrap gap-3">
            {[
              { cls: 'A', label: 'A Sinif — Ümumi gəlirin 70%-i (ulduz məhsullar)', color: 'text-success-600 bg-success-500/10 border-success-500/30' },
              { cls: 'B', label: 'B Sinif — Sonrakı 20%', color: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/30' },
              { cls: 'C', label: 'C Sinif — Qalan 10% (zəif məhsullar)', color: 'text-danger-500 bg-danger-500/10 border-danger-500/30' },
            ].map(item => (
              <span key={item.cls} className={`rounded-full border px-3 py-1 text-xs font-semibold ${item.color}`}>
                {item.label}
              </span>
            ))}
          </div>

          {/* ABC Table */}
          <div className="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">ABC Məhsul Analizi</h3>
              {abcResult && (
                <span className="text-xs text-foreground-muted">Ümumi: {fmtMoney(abcResult.totalRevenue)}</span>
              )}
            </div>
            {!abcResult ? (
              <div className="p-8 text-center text-sm text-foreground-muted">Yüklənir...</div>
            ) : abcResult.data.length === 0 ? (
              <div className="p-8 text-center text-sm text-foreground-muted">Məlumat yoxdur</div>
            ) : (
              <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
                {abcResult.data.map((p, i) => (
                  <div key={p.productId} className="flex items-center gap-4 px-5 py-3 hover:bg-surface/50 transition-colors">
                    <span className="w-6 text-xs font-bold text-foreground-muted shrink-0">#{i + 1}</span>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold ${ABC_COLORS[p.abc]}`}>{p.abc}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-foreground-muted truncate">{p.categoryName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-success-600">{fmtMoney(p.revenue)}</p>
                      <p className="text-xs text-foreground-muted">{p.count} ədəd · {p.revenuePct}%</p>
                    </div>
                    <div className="hidden sm:block w-20">
                      <div className="h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className={`h-full rounded-full ${p.abc === 'A' ? 'bg-success-500' : p.abc === 'B' ? 'bg-yellow-500' : 'bg-danger-500'}`}
                          style={{ width: `${Math.min(100, p.revenuePct * 3)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Satılmayan məhsullar */}
          {abcResult && abcResult.data.filter(p => p.revenue === 0).length > 0 && (
            <div className="rounded-2xl border border-danger-500/30 bg-danger-500/5 p-5">
              <h3 className="text-sm font-semibold text-danger-500 mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Satılmayan məhsullar — menyudan çıxarılsın? ({abcResult.data.filter(p => p.revenue === 0).length} məhsul)
              </h3>
              <div className="flex flex-wrap gap-2">
                {abcResult.data.filter(p => p.revenue === 0).map(p => (
                  <span key={p.productId} className="rounded-lg border border-danger-500/20 bg-surface px-3 py-1 text-xs">{p.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ PİK SAATLAR HEATMAP ═══════ */}
      {activeTab === 'heatmap' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface-elevated p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold">Həftəlik Sifariş Intensivliyi (son 4 həftə)</h3>
              <div className="flex items-center gap-2 text-xs text-foreground-muted">
                <span>Az</span>
                <div className="flex gap-0.5">
                  {[0.1, 0.3, 0.5, 0.7, 1].map(o => (
                    <div key={o} className="h-3 w-3 rounded-sm bg-primary-500" style={{ opacity: o }} />
                  ))}
                </div>
                <span>Çox</span>
              </div>
            </div>

            {!heatmapData ? (
              <div className="py-12 text-center text-sm text-foreground-muted">Yüklənir...</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[480px]">
                  <div className="flex mb-1 ml-12">
                    {DAY_LABELS.map(d => (
                      <div key={d} className="flex-1 text-center text-xs text-foreground-muted font-medium">{d}</div>
                    ))}
                  </div>
                  {Array.from({ length: 24 }, (_, h) => {
                    const rowCells = heatmapData.data.filter(c => c.hour === h);
                    return (
                      <div key={h} className="flex items-center gap-0.5 mb-0.5">
                        <div className="w-11 shrink-0 text-right pr-2 text-xs text-foreground-muted">
                          {h % 3 === 0 ? `${h.toString().padStart(2, '0')}:00` : ''}
                        </div>
                        {Array.from({ length: 7 }, (_, d) => {
                          const count = rowCells.find(c => c.day === d)?.count ?? 0;
                          const intensity = count / heatmapData.max;
                          return (
                            <div
                              key={d}
                              title={`${DAY_LABELS[d]} ${h}:00 — ${count} sifariş`}
                              className="flex-1 h-5 rounded-sm cursor-default hover:ring-1 hover:ring-primary-500"
                              style={{
                                backgroundColor: count === 0
                                  ? 'rgba(255,255,255,0.05)'
                                  : `rgba(249, 115, 22, ${(0.15 + intensity * 0.85).toFixed(2)})`,
                              }}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {heatmapData && (() => {
            const byHour = Array.from({ length: 24 }, (_, h) => ({
              hour: h,
              total: heatmapData.data.filter(c => c.hour === h).reduce((s, c) => s + c.count, 0),
            })).sort((a, b) => b.total - a.total).slice(0, 5);

            return (
              <ChartCard title="Top 5 Pik Saat" icon={<Flame className="h-4 w-4 text-yellow-500" />}>
                <div className="space-y-2">
                  {byHour.map((h, i) => (
                    <div key={h.hour} className="flex items-center gap-3">
                      <span className="w-5 text-xs font-bold text-foreground-muted">#{i + 1}</span>
                      <span className="w-14 text-sm font-medium">{h.hour.toString().padStart(2, '0')}:00</span>
                      <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                        <div className="h-full rounded-full bg-yellow-500"
                          style={{ width: `${byHour[0].total > 0 ? (h.total / byHour[0].total) * 100 : 0}%` }} />
                      </div>
                      <span className="w-16 text-right text-xs text-foreground-muted">{h.total} sifariş</span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            );
          })()}
        </div>
      )}

      {/* ═══════ KONVERSİYA FUNNEL ═══════ */}
      {activeTab === 'funnel' && (
        <div className="space-y-6">
          <ChartCard title={`Sifariş Konversiya Hunisi (${PERIOD_LABELS[period]})`} icon={<Filter className="h-4 w-4 text-primary-500" />}>
            {!funnelData ? (
              <Loading />
            ) : funnelData[0]?.count === 0 ? (
              <Empty />
            ) : (
              <div className="space-y-4 py-2">
                {funnelData.map((stage, i) => {
                  const colors = ['#f97316', '#3b82f6', '#22c55e'];
                  const dropColors = ['text-primary-500', 'text-blue-500', 'text-success-500'];
                  const bgColors = ['bg-primary-500/10', 'bg-blue-500/10', 'bg-success-500/10'];
                  return (
                    <div key={stage.stage}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${bgColors[i]} ${dropColors[i]}`}>
                            {i + 1}
                          </span>
                          <span className="font-medium">{stage.stage}</span>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                          <span className={`text-base font-bold ${dropColors[i]}`}>{stage.count}</span>
                          <span className="text-xs text-foreground-muted w-12">{stage.pct}%</span>
                        </div>
                      </div>
                      <div className="h-3 rounded-full bg-foreground-muted/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${stage.pct}%`, backgroundColor: colors[i] }}
                        />
                      </div>
                      {i < funnelData.length - 1 && (
                        <p className="text-[11px] text-foreground-muted mt-1 pl-8">
                          ↓ {funnelData[i + 1].count} keçdi ({funnelData[i + 1].pct}%)
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ChartCard>

          {funnelData && funnelData[0]?.count > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {funnelData.map((stage, i) => {
                const colors = ['text-primary-500', 'text-blue-500', 'text-success-500'];
                const bgs = ['bg-primary-500/10', 'bg-blue-500/10', 'bg-success-500/10'];
                const dropoff = i > 0
                  ? `${(funnelData[i - 1].count - stage.count)} itkisi`
                  : 'Başlanğıc';
                return (
                  <div key={stage.stage} className="rounded-2xl border border-border bg-surface-elevated p-5">
                    <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${bgs[i]} mb-3`}>
                      <Filter className={`h-4 w-4 ${colors[i]}`} />
                    </div>
                    <p className={`text-2xl font-bold ${colors[i]}`}>{stage.count}</p>
                    <p className="text-xs text-foreground-muted mt-1">{stage.stage}</p>
                    <p className="text-xs text-foreground-muted/60 mt-0.5">{dropoff}</p>
                  </div>
                );
              })}
            </div>
          )}

          {funnelData && funnelData[0]?.count > 0 && (
            <ChartCard title="Dönüşüm Faizi Müqayisəsi" icon={<BarChart3 className="h-4 w-4 text-primary-500" />}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={funnelData}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${v}%`} domain={[0, 100]} width={36} />
                  <Tooltip {...TT} formatter={(v: unknown) => [`${Number(v)}%`, 'Konversiya']} />
                  <Bar dataKey="pct" radius={[6, 6, 0, 0]} opacity={0.9}>
                    {funnelData.map((_, i) => (
                      <Cell key={i} fill={['#f97316', '#3b82f6', '#22c55e'][i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {/* ═══════ ƏMƏLİYYAT ═══════ */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          {/* KPI */}
          {kitchenData && kitchenData.length > 0 && (() => {
            const withPrep = kitchenData.filter(d => d.avgPrepTime > 0);
            const avgPrep = withPrep.length > 0 ? Math.round(withPrep.reduce((s, d) => s + d.avgPrepTime, 0) / withPrep.length) : 0;
            const avgCompletion = Math.round(kitchenData.reduce((s, d) => s + d.completionRate, 0) / kitchenData.length);
            const totalOrd = kitchenData.reduce((s, d) => s + d.totalOrders, 0);
            const totalCanc = kitchenData.reduce((s, d) => s + d.cancelledOrders, 0);
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Ort. hazırlıq vaxtı', value: avgPrep > 0 ? `${avgPrep} dəq` : '—', icon: Clock, color: 'text-primary-500', bg: 'bg-primary-500/10' },
                  { label: 'Ümumi sifariş', value: totalOrd.toString(), icon: BarChart3, color: 'text-success-600', bg: 'bg-success-500/10' },
                  { label: 'Ləğv edildi', value: totalCanc.toString(), icon: ChefHat, color: 'text-danger-500', bg: 'bg-danger-500/10' },
                  { label: 'Ort. tamamlanma', value: `${avgCompletion}%`, icon: Table2, color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
                ].map(item => (
                  <div key={item.label} className="rounded-2xl border border-border bg-surface-elevated p-4">
                    <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${item.bg} mb-2`}>
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-foreground-muted mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Masa dolulluğu */}
          {occupancyResult && occupancyResult.data.length > 0 && (
            <ChartCard title={`Masa Dolulluq Faizi (${PERIOD_LABELS[period]})`} icon={<Table2 className="h-4 w-4 text-blue-400" />}>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart
                  data={occupancyResult.data.map(d => ({ ...d, label: fmtDate(d.date) }))}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                    interval={Number(period) > 14 ? Math.floor(Number(period) / 8) : 0} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${v}%`} domain={[0, 100]} width={36} />
                  <Tooltip {...TT} formatter={(v: unknown) => [`${Number(v)}%`, 'Dolulluq']} />
                  <Area type="monotone" dataKey="occupancyPct" stroke="#3b82f6" strokeWidth={2}
                    fill="url(#occGrad)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-xs text-foreground-muted mt-2">
                Ümumi masa sayı: <strong>{occupancyResult.totalTables}</strong>
              </p>
            </ChartCard>
          )}

          {/* Hazırlıq vaxtı */}
          <ChartCard title={`Orta Hazırlıq Vaxtı (${PERIOD_LABELS[period]}, dəqiqə)`}>
            {!kitchenData ? (
              <Loading />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={kitchenData.map(d => ({ ...d, label: fmtDate(d.date) }))}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                    interval={Number(period) > 14 ? Math.floor(Number(period) / 8) : 0} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${v}dq`} width={40} />
                  <Tooltip {...TT} formatter={(v: unknown) => [`${Number(v)} dəqiqə`, 'Ort. hazırlıq']} />
                  <Bar dataKey="avgPrepTime" fill="#f97316" radius={[4, 4, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Ləğvetmə vs Tamamlanma */}
          <ChartCard title="Tamamlandı vs Ləğv Edildi">
            {!kitchenData ? (
              <Loading />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={kitchenData.map(d => ({
                    ...d,
                    label: fmtDate(d.date),
                    completed: d.totalOrders - d.cancelledOrders,
                  }))}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                    interval={Number(period) > 14 ? Math.floor(Number(period) / 8) : 0} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
                  <Tooltip {...TT} />
                  <Legend iconType="circle" iconSize={8}
                    formatter={(val) => <span style={{ fontSize: 11, color: '#9ca3af' }}>{val}</span>} />
                  <Bar dataKey="completed" name="Tamamlandı" stackId="a" fill="#22c55e" opacity={0.85} />
                  <Bar dataKey="cancelledOrders" name="Ləğv edildi" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Ləğvetmə faizi */}
          {occupancyResult && occupancyResult.data.some(d => d.totalOrders > 0) && (
            <ChartCard title={`Ləğvetmə Faizi Trendi (${PERIOD_LABELS[period]})`}>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart
                  data={occupancyResult.data.map(d => ({ ...d, label: fmtDate(d.date) }))}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                    interval={Number(period) > 14 ? Math.floor(Number(period) / 8) : 0} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${v}%`} domain={[0, 100]} width={36} />
                  <Tooltip {...TT} formatter={(v: unknown) => [`${Number(v)}%`, 'Ləğvetmə faizi']} />
                  <Line type="monotone" dataKey="cancellationRate" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Shared layout helpers ─── */
function ComparisonWidget({ data, fmtMoney }: { data: ComparisonData; fmtMoney: (n: number | null | undefined) => string }) {
  const rows: Array<{ label: string; key: 'week' | 'month'; period: string }> = [
    { label: 'Bu həftə', key: 'week', period: 'keçən həftə' },
    { label: 'Bu ay', key: 'month', period: 'keçən ay' },
  ];

  return (
    <ChartCard title="Müqayisəli Analiz" icon={<TrendingUp className="h-4 w-4 text-primary-500" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rows.map(({ label, key, period }) => {
          const d = data[key];
          return (
            <div key={key} className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold text-foreground-muted mb-3">{label}</p>
              <div className="grid grid-cols-2 gap-3">
                <ComparisonMetric
                  label="Gəlir"
                  value={fmtMoney(d.current.revenue)}
                  change={d.revenuePct}
                  positive={d.revenuePct >= 0}
                  period={period}
                />
                <ComparisonMetric
                  label="Sifariş"
                  value={String(d.current.orders)}
                  change={d.ordersPct}
                  positive={d.ordersPct >= 0}
                  period={period}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

function ComparisonMetric({
  label,
  value,
  change,
  positive,
  period,
}: {
  label: string;
  value: string;
  change: number;
  positive: boolean;
  period: string;
}) {
  return (
    <div>
      <p className="text-[11px] text-foreground-muted mb-1">{label}</p>
      <p className="text-lg font-bold">{value}</p>
      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${positive ? 'text-success-500' : 'text-danger-500'}`}>
        {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(change)}%
        <span className="text-foreground-muted font-normal">{period}</span>
      </span>
    </div>
  );
}

function ChartCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-6">
      <div className="flex items-center gap-2 mb-5">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Loading() {
  return <div className="py-8 text-center text-sm text-foreground-muted">Yüklənir...</div>;
}

function Empty() {
  return <div className="py-8 text-center text-sm text-foreground-muted">Məlumat yoxdur</div>;
}
