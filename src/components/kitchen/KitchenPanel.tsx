import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChefHat,
  Clock,
  Flame,
  Globe,
  GripVertical,
  ListChecks,
  Maximize2,
  Minimize2,
  Moon,
  Play,
  RefreshCw,
  RotateCcw,
  Soup,
  Sun,
  TimerReset,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  X,
  XCircle,
  Printer,
  LayoutGrid,
  List,
} from "lucide-react";
import { useKitchenStore } from "@/stores/kitchenStore";
import { useSocketContext } from "@/services/socket";
import { useOrders } from "@/hooks/useDashboard";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import { Order, OrderStatus } from "@/types";
import { cn } from "@/utils/cn";

// ─── Theme hook ────────────────────────────────────────────────────────────────
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("kitchen-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("kitchen-theme", isDark ? "dark" : "light");
  }, [isDark]);
  return { isDark, toggle: () => setIsDark((d) => !d) };
}

// ─── Fullscreen hook ───────────────────────────────────────────────────────────
function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    // ESC is handled natively by the browser; fullscreenchange fires on exit
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  return { isFullscreen, toggle };
}

// ─── Live tick — forces re-render so timers stay current ───────────────────────
function useTick(ms = 60_000) {
  const [, set] = useState(0);
  useEffect(() => {
    const id = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

// ─── Sound ─────────────────────────────────────────────────────────────────────
function playNewOrderSound() {
  try {
    const ctx = new AudioContext();

    // Realistic bell tone: fundamental + non-harmonic overtones
    function bell(freq: number, startTime: number, duration: number, vol: number) {
      const partials: [number, number][] = [
        [1,     1.0],
        [2.756, 0.5],
        [5.404, 0.25],
        [8.933, 0.1],
      ];
      partials.forEach(([ratio, weight]) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq * ratio;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol * weight, startTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * (ratio === 1 ? 1 : 0.5));
        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    }

    // A major arpeggio: A4 → C#5 → E5  (pleasant ascending chime)
    const t = ctx.currentTime;
    bell(440.00, t,        2.2, 0.28);
    bell(554.37, t + 0.38, 2.2, 0.28);
    bell(659.25, t + 0.76, 2.8, 0.32);

    setTimeout(() => ctx.close(), 4000);
  } catch {}
}

// ─── Print receipt ─────────────────────────────────────────────────────────────
function printOrder(order: Order) {
  const tableNum = order.table?.number ?? order.tableId.slice(-4);
  const win = window.open('', '_blank', 'width=320,height=600,toolbar=0,menubar=0');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;font-size:12px;padding:10px;width:280px}
.c{text-align:center}.b{font-weight:bold}
hr{border:none;border-top:1px dashed #000;margin:6px 0}
.row{display:flex;justify-content:space-between;margin:2px 0}
.sm{font-size:10px;color:#555;padding-left:8px;margin:2px 0}
</style></head><body>
<div class="c b" style="font-size:18px">FoodZone</div>
<div class="c" style="margin:2px 0">Masa ${tableNum}</div>
<div class="c b">#${order.orderNumber}</div>
<div class="c sm">${new Date().toLocaleString()}</div>
<hr/>
${order.items.map(i => `
<div class="row"><span class="b">${i.quantity}×</span><span style="padding-left:6px">${i.product?.name ?? i.productId}</span></div>
${i.specialNote ? `<div class="sm">* ${i.specialNote}</div>` : ''}
${(i as any).extras?.length ? `<div class="sm">+ ${((i as any).extras as any[]).map((e: any) => e.name).join(', ')}</div>` : ''}
`).join('')}
<hr/>
${order.specialRequest ? `<div class="b sm">⚠ ${order.specialRequest}</div><hr/>` : ''}
<div class="row b"><span>Ödəniş:</span><span>${order.paymentMethod === 'cash' ? 'Nağd' : order.paymentMethod === 'card' ? 'Kart' : 'Online'}</span></div>
</body></html>`);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 300);
}

// ─── Group preparing orders by product for summary view ────────────────────────
function groupByProduct(orders: Order[]) {
  const map = new Map<string, { name: string; qty: number; tables: string[]; notes: string[] }>();
  orders.forEach((order) => {
    const tbl = String(order.table?.number ?? order.tableId.slice(-4));
    order.items.forEach((item) => {
      const existing = map.get(item.productId) ?? {
        name: item.product?.name ?? item.productId,
        qty: 0,
        tables: [] as string[],
        notes: [] as string[],
      };
      existing.qty += item.quantity;
      if (!existing.tables.includes(tbl)) existing.tables.push(tbl);
      if (item.specialNote && !existing.notes.includes(item.specialNote))
        existing.notes.push(item.specialNote);
      map.set(item.productId, existing);
    });
  });
  return [...map.values()].sort((a, b) => b.qty - a.qty);
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const COLUMN_DROP_STATUS: Record<string, OrderStatus> = {
  preparing: "preparing",
  ready: "ready",
  served: "served",
};

// Which drag-and-drop moves are allowed (mirrors backend transitions, excluding cancel)
const VALID_DRAG_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending:   ["preparing"],
  confirmed: ["preparing"],
  preparing: ["ready"],
  ready:     ["served", "preparing"],
};

const LANGS = ["az", "en", "ru", "tr"] as const;
type ColumnId = "new" | "preparing" | "ready" | "served" | "cancelled";

// ─── Main component ────────────────────────────────────────────────────────────
export function KitchenPanel() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocketContext();
  const { isDark, toggle: toggleTheme } = useTheme();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const {
    orders,
    setOrders,
    addOrder,
    updateOrder,
    removeOrder,
    acceptOrder,
    markReady,
    markServed,
  } = useKitchenStore();
  const updateStatus = useUpdateOrderStatus();

  const [mobileTab, setMobileTab] = useState<ColumnId>("new");
  const [dragOrderId, setDragOrderId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem("kitchen-sound") !== "off"
  );
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    localStorage.setItem("kitchen-sound", soundEnabled ? "on" : "off");
  }, [soundEnabled]);

  const [viewMode, setViewMode] = useState<"cards" | "products">("cards");
  const [autoPrint, setAutoPrint] = useState(
    () => localStorage.getItem("kitchen-autoprint") === "on",
  );
  const autoPrintRef = useRef(autoPrint);
  useEffect(() => {
    autoPrintRef.current = autoPrint;
    localStorage.setItem("kitchen-autoprint", autoPrint ? "on" : "off");
  }, [autoPrint]);

  useTick(30_000);

  const {
    data: allOrders,
    isLoading,
    refetch,
    isFetching,
  } = useOrders({ limit: 150 }, { refetchInterval: 30_000, staleTime: 15_000 });
  const { data: servedData } = useOrders(
    { status: "served", limit: 80 },
    { refetchInterval: 120_000, staleTime: 60_000 },
  );

  useEffect(() => {
    if (!allOrders?.data) return;
    setOrders(
      allOrders.data.filter((o) =>
        ["pending", "confirmed", "preparing", "ready"].includes(o.status),
      ),
    );
  }, [allOrders, setOrders]);

  const [localServedOrders, setLocalServedOrders] = useState<Order[]>([]);

  // Sync served from periodic API refetch — merge to preserve optimistic adds
  useEffect(() => {
    if (!servedData?.data) return;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const fromApi = servedData.data.filter(
      (o) => new Date(o.updatedAt) >= startOfDay
    );
    setLocalServedOrders((prev) => {
      const apiIds = new Set(fromApi.map((o) => o.id));
      return [...fromApi, ...prev.filter((o) => !apiIds.has(o.id))];
    });
  }, [servedData]);

  const addToServed = useCallback((order: Order) => {
    const now = new Date().toISOString();
    setLocalServedOrders((prev) => {
      if (prev.some((o) => o.id === order.id)) return prev;
      return [{ ...order, status: "served" as OrderStatus, updatedAt: now }, ...prev];
    });
  }, []);

  // Cancelled today — same pattern
  const { data: cancelledData } = useOrders(
    { status: "cancelled", limit: 80 },
    { refetchInterval: 120_000, staleTime: 60_000 }
  );
  const [localCancelledOrders, setLocalCancelledOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!cancelledData?.data) return;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const fromApi = cancelledData.data.filter(
      (o) => new Date(o.updatedAt) >= startOfDay
    );
    setLocalCancelledOrders((prev) => {
      const apiIds = new Set(fromApi.map((o) => o.id));
      return [...fromApi, ...prev.filter((o) => !apiIds.has(o.id))];
    });
  }, [cancelledData]);

  const addToCancelled = useCallback((order: Order) => {
    const now = new Date().toISOString();
    setLocalCancelledOrders((prev) => {
      if (prev.some((o) => o.id === order.id)) return prev;
      return [{ ...order, status: "cancelled" as OrderStatus, updatedAt: now }, ...prev];
    });
  }, []);

  const removeCancelled = useCallback((orderId: string) => {
    setLocalCancelledOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  const [cancelConfirm, setCancelConfirm] = React.useState<Order | null>(null);

  // Socket
  useEffect(() => {
    if (!socket) return;
    socket.emit("room:join", { room: "kitchen", role: "kitchen" });

    const invalidate = () => {
      // Only invalidate active orders; served orders have their own 2-min schedule
      queryClient.invalidateQueries({ queryKey: ["orders", { limit: 150 }] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    };

    const onNewOrder = (order: Order) => {
      addOrder(order);
      invalidate();
      if (soundEnabledRef.current) playNewOrderSound();
      if (autoPrintRef.current) printOrder(order);
      toast.success(
        `${t("kitchen.table")} ${order.table?.number ?? order.tableId.slice(-4)} — ${t("kitchen.newOrders")}`,
      );
    };

    const onStatusChanged = (payload: any) => {
      const next: Order | undefined = payload.order;
      const orderId = payload.orderId ?? next?.id;
      const status = payload.status ?? next?.status;
      if (!orderId || !status) return;
      if (status === "served" || status === "cancelled") removeOrder(orderId);
      else if (next) addOrder(next);
      else updateOrder(orderId, { status });
      invalidate();
      if (status === "served" && next) addToServed(next);
      if (status === "cancelled" && next) addToCancelled(next);
      if (status === "pending") removeCancelled(orderId);
    };

    socket.on("kitchen:new:order", onNewOrder);
    socket.on("order:status:changed", onStatusChanged);
    return () => {
      socket.off("kitchen:new:order", onNewOrder);
      socket.off("order:status:changed", onStatusChanged);
      socket.emit("room:leave", { room: "kitchen" });
    };
  }, [socket, addOrder, updateOrder, removeOrder, addToServed, addToCancelled, removeCancelled, queryClient, t]);

  // Columns
  const columns = useMemo(
    () => [
      {
        id: "new" as ColumnId,
        label: t("kitchen.newOrders"),
        Icon: Flame,
        orders: orders.filter(
          (o) => o.status === "pending" || o.status === "confirmed",
        ),
        colorBorder: "border-orange-500/30",
        colorBg: "bg-orange-500/5",
        colorText: "text-orange-500",
        metricTone: "text-orange-500",
        allowDrop: false,
      },
      {
        id: "preparing" as ColumnId,
        label: t("kitchen.preparing"),
        Icon: Soup,
        orders: orders.filter((o) => o.status === "preparing"),
        colorBorder: "border-yellow-500/30",
        colorBg: "bg-yellow-500/5",
        colorText: "text-yellow-500",
        metricTone: "text-yellow-500",
        allowDrop: true,
      },
      {
        id: "ready" as ColumnId,
        label: t("kitchen.ready"),
        Icon: CheckCircle2,
        orders: orders.filter((o) => o.status === "ready"),
        colorBorder: "border-success-500/30",
        colorBg: "bg-success-500/5",
        colorText: "text-success-500",
        metricTone: "text-success-500",
        allowDrop: true,
      },
      {
        id: "served" as ColumnId,
        label: t("kitchen.servedToday"),
        Icon: UtensilsCrossed,
        orders: localServedOrders,
        colorBorder: "border-blue-500/30",
        colorBg: "bg-blue-500/5",
        colorText: "text-blue-500",
        metricTone: "text-blue-500",
        allowDrop: true,
      },
      {
        id: "cancelled" as ColumnId,
        label: t("kitchen.cancelledToday"),
        Icon: XCircle,
        orders: localCancelledOrders,
        colorBorder: "border-danger-500/30",
        colorBg: "bg-danger-500/5",
        colorText: "text-danger-500",
        metricTone: "text-danger-500",
        allowDrop: false,
      },
    ],
    [t, orders, localServedOrders, localCancelledOrders],
  );

  const counts = useMemo(
    () => ({
      new: columns[0].orders.length,
      preparing: columns[1].orders.length,
      ready: columns[2].orders.length,
      served: columns[3].orders.length,
      cancelled: columns[4].orders.length,
    }),
    [columns],
  );

  // Only mark as busy while the mutation is actually in-flight
  const busyOrderId = updateStatus.isPending
    ? (updateStatus.variables?.orderId ?? null)
    : null;

  const doUpdate = useCallback(
    (order: Order, status: OrderStatus) => {
      updateStatus.mutate(
        { orderId: order.id, status },
        {
          onSuccess: () => {
            if (status === "preparing") {
              acceptOrder(order.id);
            } else if (status === "ready") {
              markReady(order.id);
            } else if (status === "served") {
              markServed(order.id);
              addToServed(order);
            } else if (status === "cancelled") {
              removeOrder(order.id);
              addToCancelled(order);
            } else if (status === "pending") {
              // Restore from cancelled — add back to active store
              removeCancelled(order.id);
              addOrder({ ...order, status: "pending" as OrderStatus });
            }
            queryClient.invalidateQueries({ queryKey: ["orders", { limit: 150 }] });
          },
          onError: (err: Error) => {
            toast.error(err.message);
            refetch();
          },
        },
      );
    },
    [updateStatus, acceptOrder, markReady, markServed, addToServed, addToCancelled, removeOrder, removeCancelled, addOrder, queryClient, refetch],
  );

  // Drag handlers
  const onDragStart = useCallback((e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData("orderId", orderId);
    e.dataTransfer.effectAllowed = "move";
    setDragOrderId(orderId);
  }, []);

  const onDragEnd = useCallback(() => {
    setDragOrderId(null);
    setDragOverCol(null);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colId);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent, colId: string) => {
      e.preventDefault();
      setDragOrderId(null);
      setDragOverCol(null);
      const orderId = e.dataTransfer.getData("orderId");
      if (!orderId || colId === "new" || colId === "cancelled") return;
      // Only active orders are draggable (served/cancelled have isDraggable=false)
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;
      const targetStatus = COLUMN_DROP_STATUS[colId];
      if (!targetStatus || order.status === targetStatus) return;
      // Validate against allowed drag moves — block invalid drops silently
      const allowed = VALID_DRAG_TRANSITIONS[order.status] ?? [];
      if (!allowed.includes(targetStatus)) return;
      doUpdate(order, targetStatus);
    },
    [orders, doUpdate],
  );

  const mobileOrders = columns.find((c) => c.id === mobileTab)?.orders ?? [];

  return (
    <div className="min-h-screen bg-surface text-foreground flex flex-col">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface-elevated/95 backdrop-blur-md">
        <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center shrink-0">
              <ChefHat className="w-5 h-5 text-primary-500" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg leading-tight">
                {t("kitchen.title")}
              </h1>
              <p className="text-xs text-foreground-muted">
                {t("kitchen.liveBoard")}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Language selector */}
            <div className="flex items-center gap-0.5 bg-surface border border-border rounded-xl p-1">
              <Globe className="w-3.5 h-3.5 text-foreground-muted mx-1" />
              {LANGS.map((lang) => (
                <button
                  key={lang}
                  onClick={() => i18n.changeLanguage(lang)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-xs font-bold uppercase transition-colors",
                    i18n.language === lang
                      ? "bg-primary-500 text-white"
                      : "text-foreground-muted hover:text-foreground",
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* View mode toggle (cards ↔ product summary) */}
            <div className="flex items-center gap-0.5 bg-surface border border-border rounded-xl p-1">
              <button
                onClick={() => setViewMode("cards")}
                title={t("kitchen.cardView")}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                  viewMode === "cards"
                    ? "bg-primary-500 text-white"
                    : "text-foreground-muted hover:text-foreground",
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("products")}
                title={t("kitchen.productView")}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                  viewMode === "products"
                    ? "bg-primary-500 text-white"
                    : "text-foreground-muted hover:text-foreground",
                )}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sound toggle + test */}
            <div className="flex items-center gap-1">
              {soundEnabled && (
                <button
                  onClick={playNewOrderSound}
                  title="Test sound"
                  className="w-9 h-9 rounded-xl border border-border bg-surface flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setSoundEnabled((s) => !s)}
                title={soundEnabled ? "Mute" : "Unmute"}
                className="w-9 h-9 rounded-xl border border-border bg-surface flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4 text-danger-500" />
                )}
              </button>
            </div>

            {/* Auto-print toggle */}
            <button
              onClick={() => setAutoPrint((s) => !s)}
              title={t("kitchen.autoPrint") + (autoPrint ? " ON" : " OFF")}
              className={cn(
                "w-9 h-9 rounded-xl border flex items-center justify-center transition-colors",
                autoPrint
                  ? "bg-primary-500/10 border-primary-500/30 text-primary-500"
                  : "border-border bg-surface text-foreground-muted hover:text-foreground",
              )}
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? t("common.lightMode") : t("common.darkMode")}
              className="w-9 h-9 rounded-xl border border-border bg-surface flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              title={
                isFullscreen
                  ? t("kitchen.exitFullscreen")
                  : t("kitchen.fullscreen")
              }
              className="w-9 h-9 rounded-xl border border-border bg-surface flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={() => refetch()}
              className="w-9 h-9 rounded-xl border border-border bg-surface flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
            >
              <RefreshCw
                className={cn("w-4 h-4", isFetching && "animate-spin")}
              />
            </button>

            {/* Connection badge */}
            <div
              className={cn(
                "hidden sm:flex px-3 py-1.5 rounded-xl text-xs font-semibold items-center gap-1.5 border",
                isConnected
                  ? "bg-success-500/10 text-success-500 border-success-500/20"
                  : "bg-danger-500/10 text-danger-500 border-danger-500/20",
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  isConnected
                    ? "bg-success-500 animate-pulse"
                    : "bg-danger-500",
                )}
              />
              {isConnected ? "Live" : "Offline"}
            </div>
          </div>
        </div>

        {/* Metrics strip (also acts as mobile tabs) */}
        <div className="px-4 lg:px-6 pb-3 grid grid-cols-5 gap-2">
          {columns.map((col) => (
            <button
              key={col.id}
              onClick={() => setMobileTab(col.id)}
              className={cn(
                "rounded-xl border p-2.5 flex items-center gap-2 text-left transition-all lg:cursor-default",
                col.colorBorder,
                col.colorBg,
                mobileTab === col.id &&
                  "ring-2 ring-primary-500 ring-offset-1 lg:ring-0",
              )}
            >
              <col.Icon className={cn("w-4 h-4 shrink-0", col.colorText)} />
              <div>
                <p className="text-xs text-foreground-muted truncate hidden sm:block leading-tight">
                  {col.label}
                </p>
                <p
                  className={cn(
                    "text-2xl font-bold leading-none",
                    col.metricTone,
                  )}
                >
                  {counts[col.id as keyof typeof counts]}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Mobile tab pills */}
        <div className="lg:hidden px-4 pb-2 flex gap-1.5 overflow-x-auto">
          {columns.map((col) => (
            <button
              key={col.id}
              onClick={() => setMobileTab(col.id)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                mobileTab === col.id
                  ? "bg-primary-500 text-white border-primary-500"
                  : "border-border text-foreground-muted hover:text-foreground",
              )}
            >
              {col.label}
            </button>
          ))}
        </div>
      </header>

      {/* ─── Board ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-foreground-muted" />
          </div>
        ) : (
          <>
            {/* Desktop: Kanban */}
            <div className="hidden lg:flex h-[calc(100vh-160px)] gap-3 p-4 overflow-x-auto">
              {columns.map((col) => (
                <KanbanColumn
                  key={col.id}
                  col={col}
                  isDragOver={dragOverCol === col.id}
                  draggingId={dragOrderId}
                  busyId={busyOrderId}
                  viewMode={viewMode}
                  onDragOver={(e) => onDragOver(e, col.id)}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={(e) => onDrop(e, col.id)}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onAction={doUpdate}
                  onCancelRequest={(o) => setCancelConfirm(o)}
                  t={t}
                />
              ))}
            </div>

            {/* Mobile: Single column */}
            <div className="lg:hidden p-4 space-y-3">
              {mobileOrders.length === 0 ? (
                <EmptyState columnId={mobileTab} t={t} />
              ) : (
                mobileOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    busy={busyOrderId === order.id}
                    dragging={false}
                    onAction={doUpdate}
                    onCancelRequest={(o) => setCancelConfirm(o)}
                    t={t}
                  />
                ))
              )}
            </div>
          </>
        )}
      </main>

      {/* ─── Cancel confirm modal ─────────────────────────────────────────────── */}
      {cancelConfirm && (
        <ConfirmCancelModal
          order={cancelConfirm}
          onConfirm={() => { doUpdate(cancelConfirm, "cancelled"); setCancelConfirm(null); }}
          onClose={() => setCancelConfirm(null)}
          t={t}
        />
      )}
    </div>
  );
}

// ─── Kanban column ─────────────────────────────────────────────────────────────
interface ColDef {
  id: ColumnId;
  label: string;
  Icon: React.ElementType;
  orders: Order[];
  colorBorder: string;
  colorBg: string;
  colorText: string;
  allowDrop: boolean;
}

function KanbanColumn({
  col,
  isDragOver,
  draggingId,
  busyId,
  viewMode,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
  onAction,
  onCancelRequest,
  t,
}: {
  col: ColDef;
  isDragOver: boolean;
  draggingId: string | null;
  busyId: string | null;
  viewMode: "cards" | "products";
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onAction: (order: Order, status: OrderStatus) => void;
  onCancelRequest: (order: Order) => void;
  t: (key: string) => string;
}) {
  return (
    <div
      className={cn(
        "w-72 min-w-[280px] max-w-[340px] flex-shrink-0 flex flex-col rounded-2xl border-2 transition-all duration-200",
        col.colorBorder,
        col.colorBg,
        isDragOver &&
          col.allowDrop &&
          "ring-2 ring-primary-500 scale-[1.01] border-primary-500/50",
      )}
      onDragOver={col.allowDrop ? onDragOver : undefined}
      onDragLeave={col.allowDrop ? onDragLeave : undefined}
      onDrop={col.allowDrop ? onDrop : undefined}
    >
      {/* Column header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <col.Icon className={cn("w-4 h-4", col.colorText)} />
          <span className="font-bold text-sm">{col.label}</span>
        </div>
        <span
          className={cn(
            "min-w-[24px] h-6 px-2 rounded-full flex items-center justify-center text-xs font-bold",
            col.colorText,
            "bg-current/10",
          )}
        >
          {col.orders.length}
        </span>
      </div>

      {/* Drop hint */}
      {isDragOver && col.allowDrop && (
        <div className="mx-3 mt-3 border-2 border-dashed border-primary-500/60 rounded-xl py-3 text-center text-xs font-semibold text-primary-500">
          {t("kitchen.dropHere")}
        </div>
      )}

      {/* Scrollable cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {col.id === "preparing" && viewMode === "products" ? (
          <ProductSummaryView orders={col.orders} t={t} />
        ) : col.orders.length === 0 ? (
          <EmptyState columnId={col.id} t={t} />
        ) : (
          col.orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              busy={busyId === order.id}
              dragging={draggingId === order.id}
              onDragStart={(e) => onDragStart(e, order.id)}
              onDragEnd={onDragEnd}
              onAction={onAction}
              onCancelRequest={onCancelRequest}
              t={t}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Order card ────────────────────────────────────────────────────────────────
function OrderCard({
  order,
  busy,
  dragging,
  onDragStart,
  onDragEnd,
  onAction,
  onCancelRequest,
  t,
}: {
  order: Order;
  busy: boolean;
  dragging: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onAction: (order: Order, status: OrderStatus) => void;
  onCancelRequest: (order: Order) => void;
  t: (key: string) => string;
}) {
  const isServed = order.status === "served";
  const isCancelled = order.status === "cancelled";

  // Checklist state — reset when status changes
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setChecked({});
  }, [order.status]);

  const showChecklist = order.status === "preparing";
  const totalItems = order.items.length;
  const checkedCount = order.items.filter((i) => checked[i.id]).length;
  const allChecked = totalItems > 0 && checkedCount === totalItems;
  const progress = totalItems > 0 ? checkedCount / totalItems : 0;

  const isDraggable = !isServed && !isCancelled && (showChecklist ? allChecked : true);

  const toggleItem = useCallback(
    (itemId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (isServed) return;
      setChecked((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
    },
    [isServed],
  );

  // preparing/ready: measure elapsed from when order entered that state (updatedAt)
  const timerStart =
    order.status === "preparing" || order.status === "ready"
      ? new Date(order.updatedAt).getTime()
      : new Date(order.createdAt).getTime();
  const elapsed = Math.max(0, Math.floor((Date.now() - timerStart) / 60_000));
  const tableNum = order.table?.number ?? order.tableId.slice(-4);
  const urgency =
    order.status === "preparing"
      ? elapsed >= 15 ? "urgent" : elapsed >= 8 ? "warning" : "normal"
      : order.status === "ready"
        ? elapsed >= 10 ? "urgent" : elapsed >= 5 ? "warning" : "normal"
        : elapsed >= 20 ? "urgent" : elapsed >= 10 ? "warning" : "normal";

  const nextStatus: OrderStatus | null =
    order.status === "pending" || order.status === "confirmed"
      ? "preparing"
      : order.status === "preparing"
        ? "ready"
        : order.status === "ready"
          ? "served"
          : null;

  return (
    <article
      draggable={isDraggable}
      onDragStart={isDraggable ? onDragStart : undefined}
      onDragEnd={isDraggable ? onDragEnd : undefined}
      className={cn(
        "bg-surface-elevated border border-border rounded-2xl overflow-hidden transition-all duration-200 select-none",
        isDraggable && "cursor-grab active:cursor-grabbing hover:shadow-md",
        dragging && "opacity-40 scale-95 rotate-1",
        urgency === "urgent" && !isServed && "border-danger-500/40",
        urgency === "warning" && !isServed && "border-yellow-500/40",
      )}
    >
      {/* Card header */}
      <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {!isServed && !isCancelled && (
            <span title={!isDraggable ? t("kitchen.checkItems") : undefined}>
              <GripVertical
                className={cn(
                  "w-4 h-4 shrink-0 transition-opacity",
                  isDraggable
                    ? "text-foreground-muted/50"
                    : "text-foreground-muted/15",
                )}
              />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-[11px] text-foreground-muted leading-none">
              #{order.orderNumber}
            </p>
            <h3 className="font-bold text-base leading-tight truncate">
              {t("kitchen.table")} {tableNum}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); printOrder(order); }}
            title={t("kitchen.print")}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-foreground-muted/40 hover:text-foreground hover:bg-surface transition-colors"
          >
            <Printer className="w-3 h-3" />
          </button>
          <StatusBadge status={order.status} t={t} />
        </div>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Time chips */}
        <div className="grid grid-cols-3 gap-1.5">
          <InfoChip
            icon={<Clock className="w-3.5 h-3.5" />}
            label={`${elapsed}m`}
            tone={
              urgency === "urgent"
                ? "text-danger-500"
                : urgency === "warning"
                  ? "text-yellow-500"
                  : undefined
            }
          />
          <InfoChip
            icon={<ListChecks className="w-3.5 h-3.5" />}
            label={`${totalItems}`}
          />
          <InfoChip
            icon={<TimerReset className="w-3.5 h-3.5" />}
            label={new Date(timerStart).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
        </div>

        {/* Checklist items */}
        <div className="space-y-1.5">
          {order.items.map((item) => {
            const done = showChecklist ? !!checked[item.id] : false;
            return (
              <div
                key={item.id}
                onClick={
                  showChecklist ? (e) => toggleItem(item.id, e) : undefined
                }
                onDragStart={(e) => e.stopPropagation()}
                className={cn(
                  "flex gap-2 rounded-xl border p-2.5 transition-all duration-200",
                  showChecklist && "cursor-pointer",
                  done
                    ? "bg-success-500/5 border-success-500/20"
                    : "bg-surface border-border",
                  showChecklist && !done && "hover:border-primary-500/30",
                )}
              >
                {/* Checkbox — only in preparing */}
                {showChecklist && (
                  <div
                    className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200",
                      done
                        ? "bg-success-500 border-success-500"
                        : "border-border",
                    )}
                  >
                    {done && (
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    )}
                  </div>
                )}

                {/* Quantity badge */}
                <span
                  className={cn(
                    "w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors",
                    done
                      ? "bg-success-500/10 text-success-500"
                      : "bg-primary-500/10 text-primary-500",
                  )}
                >
                  {item.quantity}×
                </span>

                {/* Item info */}
                <div className={cn("min-w-0 flex-1", done && "opacity-60")}>
                  <p
                    className={cn(
                      "font-semibold text-sm leading-tight truncate",
                      done && "line-through",
                    )}
                  >
                    {item.product?.name ?? item.productId}
                  </p>
                  {item.extras && item.extras.length > 0 && (
                    <p className="text-[11px] text-primary-500/70 mt-0.5 truncate">
                      + {item.extras.map((e) => e.name).join(", ")}
                    </p>
                  )}
                  {item.specialNote && (
                    <p className="text-[11px] text-foreground-muted mt-0.5 truncate italic">
                      {item.specialNote}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Special request */}
        {order.specialRequest && (
          <div className="flex gap-2 p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <span className="text-yellow-500 shrink-0">⚠</span>
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              {order.specialRequest}
            </p>
          </div>
        )}

        {/* Progress bar — only for preparing */}
        {showChecklist && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-foreground-muted font-medium">
                {allChecked ? t("kitchen.allDone") : t("kitchen.progress")}
              </span>
              <span
                className={cn(
                  "font-bold tabular-nums",
                  allChecked ? "text-success-500" : "text-foreground-muted",
                )}
              >
                {checkedCount}/{totalItems}
              </span>
            </div>
            <div className="h-1.5 bg-foreground-muted/10 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300 ease-out",
                  allChecked ? "bg-success-500" : "bg-primary-500",
                )}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Restore button — only for cancelled orders */}
        {isCancelled && (
          <button
            onClick={() => onAction(order, "pending")}
            disabled={busy}
            className="w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border-2 border-primary-500/60 text-primary-500 hover:bg-primary-500/10 transition-all duration-200 disabled:opacity-50"
          >
            {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            {t("kitchen.restoreOrder")}
          </button>
        )}

        {/* Primary action button */}
        {nextStatus && (
          <ActionButton
            busy={busy}
            targetStatus={nextStatus}
            disabled={showChecklist && !allChecked}
            onClick={() => onAction(order, nextStatus)}
            t={t}
          />
        )}

        {/* Cancel button — shown below primary action for active orders */}
        {nextStatus && (
          <button
            onClick={() => onCancelRequest(order)}
            className="w-full h-8 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-danger-500/25 text-danger-500/60 hover:border-danger-500/60 hover:text-danger-500 hover:bg-danger-500/5 transition-all duration-200"
          >
            <X className="w-3.5 h-3.5" />
            {t("kitchen.cancelOrder")}
          </button>
        )}
      </div>
    </article>
  );
}

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({
  status,
  t,
}: {
  status: OrderStatus;
  t: (k: string) => string;
}) {
  const styles: Record<string, string> = {
    pending: "bg-orange-500/10 text-orange-500",
    confirmed: "bg-orange-600/10 text-orange-600",
    preparing: "bg-yellow-500/10 text-yellow-600",
    ready: "bg-success-500/10 text-success-500",
    served: "bg-blue-500/10 text-blue-500",
    cancelled: "bg-danger-500/10 text-danger-500",
  };
  const labels: Record<string, string> = {
    pending: "New",
    confirmed: t("kitchen.accepted"),
    preparing: t("kitchen.preparing"),
    ready: t("kitchen.ready"),
    served: t("kitchen.served"),
    cancelled: "Cancelled",
  };
  return (
    <span
      className={cn(
        "px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize whitespace-nowrap",
        styles[status] ?? "bg-foreground-muted/10 text-foreground-muted",
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}

// ─── Action button ─────────────────────────────────────────────────────────────
function ActionButton({
  busy,
  targetStatus,
  disabled,
  onClick,
  t,
}: {
  busy: boolean;
  targetStatus: OrderStatus;
  disabled: boolean;
  onClick: () => void;
  t: (k: string) => string;
}) {
  const config: Record<
    string,
    { label: string; icon: React.ReactNode; cls: string; disabledCls: string }
  > = {
    preparing: {
      label: t("kitchen.startPreparing"),
      icon: <Play className="w-4 h-4" />,
      cls: "bg-primary-500 hover:bg-primary-600",
      disabledCls:
        "bg-foreground-muted/10 text-foreground-muted cursor-not-allowed border border-border",
    },
    ready: {
      label: t("kitchen.markReady"),
      icon: <CheckCircle2 className="w-4 h-4" />,
      cls: "bg-success-500 hover:bg-success-600",
      disabledCls:
        "bg-foreground-muted/10 text-foreground-muted cursor-not-allowed border border-border",
    },
    served: {
      label: t("kitchen.markServed"),
      icon: <UtensilsCrossed className="w-4 h-4" />,
      cls: "bg-blue-500 hover:bg-blue-600",
      disabledCls:
        "bg-foreground-muted/10 text-foreground-muted cursor-not-allowed border border-border",
    },
  };
  const c = config[targetStatus];
  if (!c) return null;

  const isDisabled = busy || disabled;

  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      title={disabled ? t("kitchen.checkItems") : undefined}
      className={cn(
        "w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200",
        isDisabled ? c.disabledCls : cn("text-white shadow-sm", c.cls),
      )}
    >
      {busy ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : disabled ? (
        <ListChecks className="w-4 h-4" />
      ) : (
        c.icon
      )}
      {c.label}
    </button>
  );
}

// ─── Info chip ─────────────────────────────────────────────────────────────────
function InfoChip({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone?: string;
}) {
  return (
    <div
      className={cn(
        "h-7 rounded-lg bg-foreground-muted/5 border border-border flex items-center justify-center gap-1 px-1.5 text-xs",
        tone ?? "text-foreground-muted",
      )}
    >
      {icon}
      <span className="truncate font-medium">{label}</span>
    </div>
  );
}

// ─── Cancel confirm modal ──────────────────────────────────────────────────────
function ConfirmCancelModal({
  order,
  onConfirm,
  onClose,
  t,
}: {
  order: Order;
  onConfirm: () => void;
  onClose: () => void;
  t: (k: string) => string;
}) {
  const tableNum = order.table?.number ?? order.tableId.slice(-4);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface-elevated border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon + order info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-danger-500/10 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6 text-danger-500" />
          </div>
          <div>
            <h3 className="font-bold text-base">{t("kitchen.cancelOrder")}</h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              {t("kitchen.table")} {tableNum} &mdash; #{order.orderNumber}
            </p>
          </div>
        </div>

        {/* Items summary */}
        <div className="bg-surface rounded-xl border border-border p-3 mb-4 space-y-1 max-h-32 overflow-y-auto">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-md bg-primary-500/10 text-primary-500 text-xs font-bold flex items-center justify-center shrink-0">
                {item.quantity}
              </span>
              <span className="text-foreground truncate">
                {item.product?.name ?? item.productId}
              </span>
            </div>
          ))}
        </div>

        <p className="text-sm text-foreground-muted mb-5">
          {t("kitchen.cancelConfirmMessage")}
        </p>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold hover:bg-surface transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl bg-danger-500 hover:bg-danger-600 text-white text-sm font-semibold transition-all"
          >
            {t("kitchen.cancelOrder")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Product summary view ──────────────────────────────────────────────────────
function ProductSummaryView({
  orders,
  t,
}: {
  orders: Order[];
  t: (k: string) => string;
}) {
  const groups = groupByProduct(orders);
  if (groups.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center gap-2 text-foreground-muted">
        <AlertCircle className="w-8 h-8 opacity-25" />
        <p className="text-sm font-medium">{t("kitchen.noOrders")}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-foreground-muted font-medium px-0.5">
        {t("kitchen.productView")} — {orders.length} sifariş
      </p>
      {groups.map((g) => (
        <div
          key={g.name}
          className="bg-surface-elevated border border-border rounded-xl p-3 flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-bold text-xl flex items-center justify-center shrink-0">
            {g.qty}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{g.name}</p>
            <p className="text-xs text-foreground-muted">
              {t("kitchen.table")}: {g.tables.join(", ")}
            </p>
            {g.notes.map((n, i) => (
              <p
                key={i}
                className="text-[11px] text-yellow-600 dark:text-yellow-400 italic"
              >
                * {n}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({
  columnId,
  t,
}: {
  columnId: ColumnId;
  t: (k: string) => string;
}) {
  const msg =
    columnId === "served"
      ? t("kitchen.noServedToday")
      : columnId === "cancelled"
        ? t("kitchen.noCancelledToday")
        : t("kitchen.noOrders");
  return (
    <div className="py-12 flex flex-col items-center gap-2 text-foreground-muted">
      <AlertCircle className="w-8 h-8 opacity-25" />
      <p className="text-sm font-medium">{msg}</p>
    </div>
  );
}
