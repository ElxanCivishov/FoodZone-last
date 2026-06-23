import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ChefHat,
  ChevronDown,
  CheckCircle2,
  Flame,
  LayoutGrid,
  List,
  Play,
  Printer,
  RefreshCw,
  ShoppingBag,
  Soup,
  Truck,
  Utensils,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import { DEFAULT_SETTINGS, useAppSettings } from "@/hooks/useAppSettings";
import { useKitchenStore } from "@/stores/kitchenStore";
import { useThemeStore } from "@/stores/themeStore";
import { useSocketContext } from "@/services/socket";
import { useOrders } from "@/hooks/useDashboard";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import { Order, OrderFulfillmentType, OrderStatus } from "@/types";
import { cn } from "@/utils/cn";
import {
  getOrderFulfillmentLabel,
  getOrderFulfillmentTone,
  getOrderFulfillmentType,
  orderFulfillmentTypes,
} from "@/utils/orderDisplay";
import {
  COLUMN_DROP_STATUS,
  VALID_DRAG_TRANSITIONS,
  ColumnId,
  ColDef,
} from "./constants";
import { useTick } from "./hooks";
import { useFullscreen } from "@/hooks/useFullscreen";
import { playNewOrderSound, printOrder } from "./utils";
import { KanbanColumn } from "./KanbanColumn";
import { OrderCard } from "./OrderCard";
import { EmptyState } from "./ProductSummaryView";
import { ConfirmCancelModal } from "./ConfirmCancelModal";
import { Tooltip } from "@/components/common/Tooltip";
import {
  PanelConnectionBadge,
  PanelControlScroller,
  PanelFullscreenToggle,
  PanelHeaderBrand,
  PanelIconButton,
  PanelLanguageSelect,
  PanelRefreshButton,
  PanelSoundDurationSelect,
  PanelSoundToggle,
  PanelThemeToggle,
} from "@/components/common/PanelControls";
import {
  DEFAULT_PANEL_FILTERS,
  PanelFilterState,
  PanelFilters,
  countPanelFilters,
} from "@/components/common/PanelFilters";
import { orderMatchesPanelFilters } from "@/components/common/panelFiltering";
import { useSoundSettings } from "@/hooks/useSoundSettings";

export function KitchenPanel() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocketContext();
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const isDark = resolvedTheme === "dark";
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const { data: settingsData } = useAppSettings();
  const panelSettings = settingsData?.data ?? DEFAULT_SETTINGS;
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
  const [activeFulfillment, setActiveFulfillment] =
    useState<OrderFulfillmentType>(() => {
      const stored = localStorage.getItem("kitchen-fulfillment-tab");
      return orderFulfillmentTypes.includes(stored as OrderFulfillmentType)
        ? (stored as OrderFulfillmentType)
        : "dine_in";
    });
  const [fulfillmentSwitcherOpen, setFulfillmentSwitcherOpen] =
    useState(false);
  const [panelFilters, setPanelFilters] =
    useState<PanelFilterState>(DEFAULT_PANEL_FILTERS);
  const {
    soundEnabled,
    setSoundEnabled,
    soundDuration,
    setSoundDuration,
    soundEnabledRef,
    soundDurationRef,
  } = useSoundSettings("kitchen");

  const [viewMode, setViewMode] = useState<"cards" | "products">("cards");
  const [autoPrint, setAutoPrint] = useState(() => {
    const stored = localStorage.getItem("kitchen-autoprint");
    return stored !== null ? stored === "on" : panelSettings.kitchenAutoPrint;
  });
  const autoPrintRef = useRef(autoPrint);
  useEffect(() => {
    autoPrintRef.current = autoPrint;
    localStorage.setItem("kitchen-autoprint", autoPrint ? "on" : "off");
  }, [autoPrint]);

  useEffect(() => {
    localStorage.setItem("kitchen-fulfillment-tab", activeFulfillment);
  }, [activeFulfillment]);

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

  useEffect(() => {
    if (!servedData?.data) return;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const fromApi = servedData.data.filter(
      (o) => new Date(o.updatedAt) >= startOfDay,
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
      return [
        { ...order, status: "served" as OrderStatus, updatedAt: now },
        ...prev,
      ];
    });
  }, []);

  const { data: cancelledData } = useOrders(
    { status: "cancelled", limit: 80 },
    { refetchInterval: 120_000, staleTime: 60_000 },
  );
  const [localCancelledOrders, setLocalCancelledOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!cancelledData?.data) return;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const fromApi = cancelledData.data.filter(
      (o) => new Date(o.updatedAt) >= startOfDay,
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
      return [
        { ...order, status: "cancelled" as OrderStatus, updatedAt: now },
        ...prev,
      ];
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
      queryClient.invalidateQueries({ queryKey: ["orders", { limit: 150 }] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    };

    const onNewOrder = (order: Order) => {
      addOrder(order);
      invalidate();
      if (soundEnabledRef.current) {
        playNewOrderSound(soundDurationRef.current);
      }
      if (autoPrintRef.current) printOrder(order);
      const type = getOrderFulfillmentType(order);
      const orderLabel =
        type === "dine_in"
          ? `${t("kitchen.table")} ${order.table?.number ?? order.tableId?.slice(-4) ?? "-"}`
          : getOrderFulfillmentLabel(type, t);
      if (!hasKitchenTable(order)) {
        toast.success(`${orderLabel} - ${t("kitchen.newOrders")}`);
        return;
      }
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
  }, [
    socket,
    addOrder,
    updateOrder,
    removeOrder,
    addToServed,
    addToCancelled,
    removeCancelled,
    queryClient,
    t,
  ]);

  const columns = useMemo<ColDef[]>(
    () => [
      {
        id: "new",
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
        id: "preparing",
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
        id: "ready",
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
        id: "served",
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
        id: "cancelled",
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

  const matchesKitchenFilters = useCallback(
    (order: Order) =>
      orderMatchesPanelFilters(order, panelFilters, {
        includeCancelReason: true,
      }),
    [panelFilters],
  );
  const matchesFulfillment = useCallback(
    (order: Order) => getOrderFulfillmentType(order) === activeFulfillment,
    [activeFulfillment],
  );

  const counts = useMemo(
    () => ({
      new: columns[0].orders.filter((order) => matchesFulfillment(order) && matchesKitchenFilters(order)).length,
      preparing: columns[1].orders.filter((order) => matchesFulfillment(order) && matchesKitchenFilters(order)).length,
      ready: columns[2].orders.filter((order) => matchesFulfillment(order) && matchesKitchenFilters(order)).length,
      served: columns[3].orders.filter((order) => matchesFulfillment(order) && matchesKitchenFilters(order)).length,
      cancelled: columns[4].orders.filter((order) => matchesFulfillment(order) && matchesKitchenFilters(order)).length,
    }),
    [columns, matchesFulfillment, matchesKitchenFilters],
  );

  const filteredColumns = useMemo<ColDef[]>(
    () =>
      columns.map((col) => ({
        ...col,
        orders: col.orders.filter(
          (order) => matchesFulfillment(order) && matchesKitchenFilters(order),
        ),
      })),
    [columns, matchesFulfillment, matchesKitchenFilters],
  );

  const busyOrderId = updateStatus.isPending
    ? (updateStatus.variables?.orderId ?? null)
    : null;

  const doUpdate = useCallback(
    (
      order: Order,
      status: OrderStatus,
      options?: { estimatedTime?: number; cancelReason?: string },
    ) => {
      updateStatus.mutate(
        { orderId: order.id, status, ...options },
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
              addToCancelled({ ...order, cancelReason: options?.cancelReason });
            } else if (status === "pending") {
              removeCancelled(order.id);
              addOrder({ ...order, status: "pending" as OrderStatus });
            }
            queryClient.invalidateQueries({
              queryKey: ["orders", { limit: 150 }],
            });
          },
          onError: (err: Error) => {
            toast.error(err.message);
            refetch();
          },
        },
      );
    },
    [
      updateStatus,
      acceptOrder,
      markReady,
      markServed,
      addToServed,
      addToCancelled,
      removeOrder,
      removeCancelled,
      addOrder,
      queryClient,
      refetch,
    ],
  );

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
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;
      const targetStatus = COLUMN_DROP_STATUS[colId];
      if (!targetStatus || order.status === targetStatus) return;
      const allowed = VALID_DRAG_TRANSITIONS[order.status] ?? [];
      if (!allowed.includes(targetStatus)) return;
      doUpdate(order, targetStatus);
    },
    [orders, doUpdate],
  );

  const activeFilterCount = countPanelFilters({ ...panelFilters, type: "all" });
  const mobileOrders =
    filteredColumns.find((c) => c.id === mobileTab)?.orders ?? [];

  return (
    <div className="min-h-screen bg-surface text-foreground flex flex-col">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface-elevated/95 backdrop-blur-md">
        <div className="px-4 lg:px-6 py-3 flex items-center gap-3 overflow-hidden">
          <PanelHeaderBrand
            icon={ChefHat}
            title={t("kitchen.title")}
            subtitle={t("kitchen.liveBoard")}
            iconWrapClassName="bg-primary-500/10"
            iconClassName="text-primary-500"
          />

          <ActiveFulfillmentBadge active={activeFulfillment} t={t} />

          {/* Controls — scrollable on mobile so nothing wraps or clips */}
          <PanelControlScroller>
            <PanelLanguageSelect
              value={i18n.language}
              onChange={(lang) => i18n.changeLanguage(lang)}
            />

            <PanelFilters
              filters={panelFilters}
              onChange={setPanelFilters}
              onReset={() => setPanelFilters(DEFAULT_PANEL_FILTERS)}
              activeCount={activeFilterCount}
              t={t}
            />

            <div className="flex items-center gap-0.5 bg-surface border border-border rounded-xl p-1">
              <Tooltip content={t("kitchen.cardView")} side="bottom">
                <button
                  onClick={() => setViewMode("cards")}
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                    viewMode === "cards"
                      ? "bg-primary-500 text-white"
                      : "text-foreground-muted hover:text-foreground",
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content={t("kitchen.productView")} side="bottom">
                <button
                  onClick={() => setViewMode("products")}
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                    viewMode === "products"
                      ? "bg-primary-500 text-white"
                      : "text-foreground-muted hover:text-foreground",
                  )}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </div>

            <div className="flex items-center gap-1">
              {soundEnabled && (
                <>
                  <PanelSoundDurationSelect
                    value={soundDuration}
                    onChange={setSoundDuration}
                    tooltip={t("kitchen.tooltip.soundDuration", {
                      seconds: soundDuration,
                    })}
                  />
                  <PanelIconButton
                    tooltip={t("kitchen.tooltip.testSound")}
                    onClick={() => playNewOrderSound(soundDuration)}
                  >
                    <Play className="w-3.5 h-3.5" />
                  </PanelIconButton>
                </>
              )}
              <PanelSoundToggle
                enabled={soundEnabled}
                onToggle={() => setSoundEnabled((s) => !s)}
                muteLabel={t("kitchen.tooltip.muteSound")}
                unmuteLabel={t("kitchen.tooltip.unmuteSound")}
              />
            </div>

            <PanelIconButton
              tooltip={t(
                autoPrint
                  ? "kitchen.tooltip.autoPrintOn"
                  : "kitchen.tooltip.autoPrintOff",
              )}
              onClick={() => setAutoPrint((s) => !s)}
              active={autoPrint}
            >
              <Printer className="w-4 h-4" />
            </PanelIconButton>

            <PanelThemeToggle
              isDark={isDark}
              onToggle={toggleTheme}
              lightLabel={t("common.lightMode")}
              darkLabel={t("common.darkMode")}
            />
            <PanelFullscreenToggle
              isFullscreen={isFullscreen}
              onToggle={toggleFullscreen}
              enterLabel={t("kitchen.fullscreen")}
              exitLabel={t("kitchen.exitFullscreen")}
            />
            <PanelRefreshButton
              onRefresh={() => refetch()}
              loading={isFetching}
              label={t("kitchen.tooltip.refresh")}
            />
            <PanelConnectionBadge
              connected={isConnected}
              connectedLabel="Live"
              disconnectedLabel="Offline"
            />
          </PanelControlScroller>
        </div>

        {/* Metrics strip */}
        <div className="px-4 lg:px-6 py-3 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-5">
          {filteredColumns.map((col) => (
            <button
              key={col.id}
              onClick={() => setMobileTab(col.id)}
              className={cn(
                "shrink-0 min-w-[110px] lg:min-w-0 rounded-xl border p-2.5 flex items-center gap-2 text-left transition-all cursor-pointer lg:cursor-default",
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
        <div className="lg:hidden px-4 pb-2 flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {filteredColumns.map((col) => (
            <button
              key={col.id}
              onClick={() => setMobileTab(col.id)}
              className={cn(
                "shrink-0 cursor-pointer px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
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
              {filteredColumns.map((col) => (
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

      {/* Cancel confirm modal */}
      {cancelConfirm && (
        <ConfirmCancelModal
          order={cancelConfirm}
          onConfirm={(cancelReason) => {
            doUpdate(cancelConfirm, "cancelled", { cancelReason });
            setCancelConfirm(null);
          }}
          onClose={() => setCancelConfirm(null)}
          t={t}
        />
      )}

      <FulfillmentSwitcher
        active={activeFulfillment}
        open={fulfillmentSwitcherOpen}
        onToggle={() => setFulfillmentSwitcherOpen((value) => !value)}
        onChange={(type) => {
          setActiveFulfillment(type);
          setFulfillmentSwitcherOpen(false);
        }}
        t={t}
      />
    </div>
  );
}

function hasKitchenTable(order: Order): order is Order & { tableId: string } {
  return !!order.table?.number || !!order.tableId;
}

function ActiveFulfillmentBadge({
  active,
  t,
}: {
  active: OrderFulfillmentType;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const Icon =
    active === "delivery"
      ? Truck
      : active === "takeaway"
        ? ShoppingBag
        : Utensils;

  return (
    <div
      className={cn(
        "flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border px-2 text-xs font-bold sm:px-3",
        getOrderFulfillmentTone(active),
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="hidden max-w-24 truncate sm:inline">
        {getOrderFulfillmentLabel(active, t)}
      </span>
    </div>
  );
}

function FulfillmentSwitcher({
  active,
  open,
  onToggle,
  onChange,
  t,
}: {
  active: OrderFulfillmentType;
  open: boolean;
  onToggle: () => void;
  onChange: (type: OrderFulfillmentType) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const tabs: Array<{ value: OrderFulfillmentType; Icon: typeof Truck }> = [
    { value: "delivery", Icon: Truck },
    { value: "takeaway", Icon: ShoppingBag },
    { value: "dine_in", Icon: Utensils },
  ];
  const activeTab = tabs.find((tab) => tab.value === active) ?? tabs[2];
  const ActiveIcon = activeTab.Icon;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-5 sm:right-5">
      {open && (
        <div className="w-48 rounded-2xl border border-border bg-surface-elevated p-1.5 shadow-2xl">
          {tabs.map(({ value, Icon }) => {
            const selected = value === active;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange(value)}
                className={cn(
                  "flex h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold transition-colors",
                  selected
                    ? cn(getOrderFulfillmentTone(value), "bg-opacity-100")
                    : "text-foreground-muted hover:bg-foreground-muted/10 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">
                  {getOrderFulfillmentLabel(value, t)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex h-12 min-w-40 items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated px-4 text-sm font-bold shadow-2xl transition-colors hover:border-primary-500/40",
          getOrderFulfillmentTone(active),
        )}
      >
        <span className="flex items-center gap-2">
          <ActiveIcon className="h-4 w-4" />
          {getOrderFulfillmentLabel(active, t)}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>
    </div>
  );
}
