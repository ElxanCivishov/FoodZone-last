import api from "@/services/api";
import type { RangeReport } from "@/types";
import { printRangeReport } from "@/utils/printShiftReport";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  Calendar,
  CreditCard,
  FileSpreadsheet,
  Globe,
  Printer,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionTitle } from "../components/SectionTitle";
import { useActiveBranch } from "../hooks/useActiveBranch";

const TT: object = {
  contentStyle: {
    background: "#1a1a1a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    fontSize: 12,
    color: "#fff",
  },
  cursor: { fill: "rgba(255,255,255,0.04)" },
};

export function ReportsView() {
  const { activeBranch } = useActiveBranch();
  const branchId = activeBranch?.id;

  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .split("T")[0];

  const [from, setFrom] = useState(weekAgo);
  const [to, setTo] = useState(today);

  const { data: report, isLoading } = useQuery<RangeReport>({
    queryKey: ["range-report", branchId, from, to],
    queryFn: () =>
      api
        .get(`/shifts/reports/range?branchId=${branchId}&from=${from}&to=${to}`)
        .then((r: any) => r.data),
    enabled: !!branchId,
  });

  const fmtMoney = (n: number | null | undefined) => `${(n ?? 0).toFixed(2)} ₼`;

  // Period summary helpers
  const dailyEntries = report ? Object.entries(report.dailyBreakdown) : [];
  const bestDay = dailyEntries.reduce<{ date: string; revenue: number } | null>(
    (best, [date, d]) =>
      !best || d.revenue > best.revenue ? { date, revenue: d.revenue } : best,
    null,
  );
  const activeDays = dailyEntries.filter(([, d]) => d.orders > 0).length;
  const avgDailyRevenue =
    activeDays > 0 ? (report?.summary.totalRevenue ?? 0) / activeDays : 0;
  const totalWithCancelled =
    (report?.summary.totalOrders ?? 0) + (report?.summary.cancelledOrders ?? 0);
  const cancelRate =
    totalWithCancelled > 0
      ? Math.round(
          ((report?.summary.cancelledOrders ?? 0) / totalWithCancelled) * 100,
        )
      : 0;
  const netRevenue =
    (report?.summary.totalRevenue ?? 0) - (report?.summary.totalDiscount ?? 0);

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Hesabatlar"
        subtitle="Gəlir analitikası və statistika"
      />

      {/* Tarix Seçimi */}
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-2.5">
          <Calendar className="h-4 w-4 text-foreground-muted" />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="text-sm bg-transparent outline-none"
          />
          <span className="text-foreground-muted">—</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="text-sm bg-transparent outline-none"
          />
        </div>
        {[
          { label: "Bu gün", days: 0 },
          { label: "Son 7 gün", days: 7 },
          { label: "Son 30 gün", days: 30 },
        ].map(({ label, days }) => (
          <button
            key={label}
            onClick={() => {
              const t2 = new Date().toISOString().split("T")[0];
              const f2 = new Date(Date.now() - days * 86400000)
                .toISOString()
                .split("T")[0];
              setFrom(days === 0 ? t2 : f2);
              setTo(t2);
            }}
            className="px-3 py-2 rounded-xl text-sm border border-border hover:bg-surface-elevated transition-colors"
          >
            {label}
          </button>
        ))}
        {report && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() =>
                printRangeReport(
                  report,
                  activeBranch?.restaurant?.name,
                  from,
                  to,
                )
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm font-medium text-foreground-muted hover:bg-surface-elevated hover:text-foreground transition-colors"
            >
              <Printer className="h-4 w-4" /> Çap et
            </button>
            <button
              onClick={() => {
                const url = `/api/shifts/reports/export/xlsx?branchId=${branchId}&from=${from}&to=${to}`;
                fetch(url, {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                })
                  .then((r) => r.blob())
                  .then((blob) => {
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `foodzone-report-${from}-${to}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  });
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-success-500 text-white text-sm font-medium hover:bg-success-600 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-sm text-foreground-muted">
          Yüklənir...
        </div>
      ) : report ? (
        <>
          {/* ── Dövrün Xülasəsi ── */}
          <div className="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <p className="font-semibold">Dövrün Xülasəsi</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {new Date(from).toLocaleDateString("az-AZ", {
                    day: "2-digit",
                    month: "long",
                  })}{" "}
                  —{" "}
                  {new Date(to).toLocaleDateString("az-AZ", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-primary-500/10 text-primary-500 font-medium">
                  {report.summary.totalOrders} sifariş
                </span>
                {report.summary.cancelledOrders > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-danger-500/10 text-danger-500 font-medium">
                    {report.summary.cancelledOrders} ləğv
                  </span>
                )}
              </div>
            </div>

            {/* 3-column body */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
              {/* Col 1 — Gəlir */}
              <div className="p-6">
                <p className="text-xs text-foreground-muted mb-1">Cəmi Gəlir</p>
                <p className="text-3xl font-bold text-success-600">
                  {fmtMoney(report.summary.totalRevenue)}
                </p>
                <p className="text-xs text-foreground-muted mt-1">
                  Xalis:{" "}
                  <span className="text-foreground font-medium">
                    {fmtMoney(netRevenue)}
                  </span>
                  {report.summary.totalDiscount > 0 && (
                    <span className="ml-1 text-danger-500">
                      (-{fmtMoney(report.summary.totalDiscount)})
                    </span>
                  )}
                </p>

                {/* Payment method breakdown */}
                <div className="mt-5 space-y-2.5">
                  {[
                    {
                      label: "Nağd",
                      value: report.summary.totalCash,
                      color: "#22c55e",
                      icon: Banknote,
                    },
                    {
                      label: "Kart",
                      value: report.summary.totalCard,
                      color: "#3b82f6",
                      icon: CreditCard,
                    },
                    {
                      label: "Online",
                      value: report.summary.totalOnline,
                      color: "#a855f7",
                      icon: Globe,
                    },
                  ].map((pm) => {
                    const pct =
                      report.summary.totalRevenue > 0
                        ? Math.round(
                            (pm.value / report.summary.totalRevenue) * 100,
                          )
                        : 0;
                    return (
                      <div key={pm.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: pm.color }}
                            />
                            <span className="text-foreground-muted">
                              {pm.label}
                            </span>
                          </div>
                          <span className="font-medium">
                            {fmtMoney(pm.value)}{" "}
                            <span className="text-foreground-muted">
                              · {pct}%
                            </span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: pm.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Col 2 — Sifarişlər */}
              <div className="p-6">
                <p className="text-xs text-foreground-muted mb-1">
                  Sifariş Statistikası
                </p>
                <p className="text-3xl font-bold">
                  {report.summary.totalOrders}
                </p>
                <p className="text-xs text-foreground-muted mt-1">
                  Orta çek:{" "}
                  <span className="text-foreground font-medium">
                    {fmtMoney(report.summary.avgOrderValue)}
                  </span>
                </p>

                <div className="mt-5 space-y-3">
                  {/* Cancellation rate */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-foreground-muted">
                        Ləğvetmə faizi
                      </span>
                      <span
                        className={`font-medium ${cancelRate >= 20 ? "text-danger-500" : cancelRate >= 10 ? "text-yellow-500" : "text-success-600"}`}
                      >
                        {cancelRate}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${cancelRate}%`,
                          backgroundColor:
                            cancelRate >= 20
                              ? "#ef4444"
                              : cancelRate >= 10
                                ? "#eab308"
                                : "#22c55e",
                        }}
                      />
                    </div>
                  </div>

                  {/* Key numbers */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {[
                      {
                        label: "Aktiv gün",
                        value: activeDays > 0 ? `${activeDays}` : "—",
                      },
                      {
                        label: "Smena",
                        value:
                          report.shifts.length > 0
                            ? `${report.shifts.length}`
                            : "—",
                      },
                      {
                        label: "Endirim",
                        value: fmtMoney(report.summary.totalDiscount),
                      },
                      {
                        label: "Ləğv",
                        value: `${report.summary.cancelledOrders}`,
                      },
                    ].map((kv) => (
                      <div
                        key={kv.label}
                        className="rounded-xl bg-surface border border-border px-3 py-2"
                      >
                        <p className="text-[10px] text-foreground-muted leading-tight">
                          {kv.label}
                        </p>
                        <p className="text-sm font-semibold leading-tight mt-0.5">
                          {kv.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Col 3 — Dövrün göstəriciləri */}
              <div className="p-6">
                <p className="text-xs text-foreground-muted mb-1">
                  Dövrün Göstəriciləri
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {fmtMoney(avgDailyRevenue)}
                </p>
                <p className="text-xs text-foreground-muted mt-1">
                  gündəlik orta gəlir
                </p>

                <div className="mt-5 space-y-3">
                  {bestDay && (
                    <div className="rounded-xl bg-success-500/8 border border-success-500/20 px-4 py-3">
                      <p className="text-[10px] text-success-600 font-medium uppercase tracking-wide mb-1">
                        Ən yaxşı gün
                      </p>
                      <p className="text-sm font-bold">
                        {new Date(bestDay.date).toLocaleDateString("az-AZ", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                        })}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {fmtMoney(bestDay.revenue)} gəlir
                      </p>
                    </div>
                  )}

                  {report.summary.totalRevenue > 0 && (
                    <div className="rounded-xl bg-primary-500/8 border border-primary-500/20 px-4 py-3">
                      <p className="text-[10px] text-primary-500 font-medium uppercase tracking-wide mb-1">
                        Xalis gəlir nisbəti
                      </p>
                      <p className="text-sm font-bold">
                        {Math.round(
                          (netRevenue / report.summary.totalRevenue) * 100,
                        )}
                        %
                      </p>
                      <p className="text-xs text-foreground-muted">
                        endirimdən sonra
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ən çox satan məhsullar */}
          <div className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h3 className="text-sm font-semibold mb-5">
              Ən çox satan məhsullar
            </h3>
            {report.topProducts.length === 0 ? (
              <p className="text-sm text-foreground-muted text-center py-4">
                Məlumat yoxdur
              </p>
            ) : (
              <>
                <ResponsiveContainer
                  width="100%"
                  height={Math.min(
                    report.topProducts.slice(0, 10).length * 36,
                    360,
                  )}
                >
                  <BarChart
                    data={report.topProducts.slice(0, 10).map((p) => ({
                      ...p,
                      name:
                        p.name.length > 20 ? p.name.slice(0, 20) + "…" : p.name,
                    }))}
                    layout="vertical"
                    margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.07)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}₼`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      width={140}
                    />
                    <Tooltip
                      {...TT}
                      formatter={(v: unknown) => [fmtMoney(Number(v)), "Gəlir"]}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#f97316"
                      radius={[0, 4, 4, 0]}
                      opacity={0.85}
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {report.topProducts.slice(0, 10).map((p, i) => (
                    <div
                      key={p.productId}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-foreground-muted w-6">
                          #{i + 1}
                        </span>
                        <span className="font-medium truncate max-w-[200px]">
                          {p.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm shrink-0">
                        <span className="text-foreground-muted">
                          {p.count} ədəd
                        </span>
                        <span className="font-semibold text-success-600">
                          {fmtMoney(p.revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Smenalar */}
          {report.shifts.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface-elevated p-6">
              <h3 className="text-sm font-semibold mb-4">
                Bu dövrün smenaları
              </h3>
              <div className="space-y-2">
                {report.shifts.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(s.openedAt).toLocaleDateString("az-AZ")}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {s.openedBy?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {s.totalRevenue !== undefined && (
                        <span className="font-semibold text-success-600">
                          {fmtMoney(s.totalRevenue)}
                        </span>
                      )}
                      {s.totalOrders !== undefined && (
                        <span className="text-foreground-muted">
                          {s.totalOrders} sifariş
                        </span>
                      )}
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
