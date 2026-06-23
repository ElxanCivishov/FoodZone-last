import React, { useCallback, useEffect, useState } from "react";
import { Tooltip } from "@/components/common/Tooltip";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  GripVertical,
  ListChecks,
  Play,
  Printer,
  RefreshCw,
  RotateCcw,
  TimerReset,
  UtensilsCrossed,
  X,
  XCircle,
} from "lucide-react";
import { Order, OrderStatus } from "@/types";
import { cn } from "@/utils/cn";
import {
  getOrderFulfillmentType,
  getOrderPrimaryLabel,
} from "@/utils/orderDisplay";
import { ETA_OPTIONS } from "./constants";
import { printOrder } from "./utils";

// ─── Info chip ─────────────────────────────────────────────────────────────────
export function InfoChip({
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
        "w-full h-7 rounded-lg bg-foreground-muted/5 border border-border flex items-center justify-center gap-1 px-1.5 text-xs",
        tone ?? "text-foreground-muted",
      )}
    >
      {icon}
      <span className="truncate font-medium">{label}</span>
    </div>
  );
}

// ─── Status badge ──────────────────────────────────────────────────────────────
export function StatusBadge({
  status,
  t,
}: {
  status: OrderStatus;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const styles: Record<string, string> = {
    pending: "bg-orange-500/10 text-orange-500",
    confirmed: "bg-orange-600/10 text-orange-600",
    preparing: "bg-yellow-500/10 text-yellow-600",
    ready: "bg-success-500/10 text-success-500",
    served: "bg-blue-500/10 text-blue-500",
    cancelled: "bg-danger-500/10 text-danger-500",
  };
  const label = t(`order.status.${status}`);
  return (
    <span
      className={cn(
        "px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap",
        styles[status] ?? "bg-foreground-muted/10 text-foreground-muted",
      )}
    >
      {label === `order.status.${status}` ? status : label}
    </span>
  );
}

// ─── Action button ─────────────────────────────────────────────────────────────
export function ActionButton({
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
  t: (key: string, options?: Record<string, unknown>) => string;
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

// ─── Order card ────────────────────────────────────────────────────────────────
export function OrderCard({
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
  onAction: (
    order: Order,
    status: OrderStatus,
    options?: { estimatedTime?: number; cancelReason?: string },
  ) => void;
  onCancelRequest: (order: Order) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const isServed = order.status === "served";
  const isCancelled = order.status === "cancelled";

  // Items are expanded for active steps, collapsed for terminal ones
  const defaultExpanded =
    order.status === "pending" ||
    order.status === "confirmed" ||
    order.status === "preparing";
  const [expanded, setExpanded] = useState(defaultExpanded);
  useEffect(() => {
    setExpanded(
      order.status === "pending" ||
        order.status === "confirmed" ||
        order.status === "preparing",
    );
  }, [order.status]);

  // Checklist state — reset when status changes
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [selectedEta, setSelectedEta] = useState(order.estimatedTime ?? 15);
  useEffect(() => {
    setChecked({});
  }, [order.status]);

  const showChecklist = order.status === "preparing";
  const totalItems = order.items.length;
  const checkedCount = order.items.filter((i) => checked[i.id]).length;
  const allChecked = totalItems > 0 && checkedCount === totalItems;
  const progress = totalItems > 0 ? checkedCount / totalItems : 0;

  const isDraggable =
    !isServed && !isCancelled && (showChecklist ? allChecked : true);

  const toggleItem = useCallback(
    (itemId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (isServed) return;
      setChecked((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
    },
    [isServed],
  );

  const fulfillmentType = getOrderFulfillmentType(order);
  const primaryLabel =
    fulfillmentType === "dine_in"
      ? getOrderPrimaryLabel(order, t)
      : t("kitchen.order");
  const now = Date.now();

  // ── Elapsed since order was placed (for pending/confirmed urgency)
  const waitElapsed = Math.floor((now - new Date(order.createdAt).getTime()) / 60_000);

  // ── Preparing countdown: uses DB-persisted preparationStartedAt so it
  //    survives refresh and resumes from the correct point.
  const prepStartedAt = order.preparationStartedAt
    ? new Date(order.preparationStartedAt).getTime()
    : null;
  const eta = order.estimatedTime ?? 15;
  const elapsedSincePrepStart = prepStartedAt
    ? Math.floor((now - prepStartedAt) / 60_000)
    : 0;
  // positive → minutes remaining, negative → overdue by that many minutes
  const prepRemaining = eta - elapsedSincePrepStart;

  // ── Ready: time sitting ready waiting for pickup
  const readyElapsed = order.preparationCompletedAt
    ? Math.floor((now - new Date(order.preparationCompletedAt).getTime()) / 60_000)
    : Math.floor((now - new Date(order.updatedAt).getTime()) / 60_000);

  const urgency =
    order.status === "preparing"
      ? prepRemaining <= 0
        ? "urgent"
        : prepRemaining <= 3
          ? "warning"
          : "normal"
      : order.status === "pending" || order.status === "confirmed"
        ? waitElapsed >= 15
          ? "urgent"
          : waitElapsed >= 8
            ? "warning"
            : "normal"
        : order.status === "ready"
          ? readyElapsed >= 8
            ? "urgent"
            : readyElapsed >= 4
              ? "warning"
              : "normal"
          : "normal";

  const nextStatus: OrderStatus | null =
    order.status === "pending" || order.status === "confirmed"
      ? "preparing"
      : order.status === "preparing"
        ? "ready"
        : order.status === "ready"
          ? "served"
          : null;
  const showEtaPicker =
    order.status === "pending" || order.status === "confirmed";

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
              {primaryLabel}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Tooltip content={t("kitchen.tooltip.printOrder")} side="bottom">
            <button
              onClick={(e) => { e.stopPropagation(); printOrder(order); }}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-foreground-muted/40 hover:text-foreground hover:bg-surface transition-colors"
            >
              <Printer className="w-3 h-3" />
            </button>
          </Tooltip>
          <StatusBadge status={order.status} t={t} />
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-foreground-muted/40 hover:text-foreground hover:bg-surface transition-colors"
          >
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          </button>
        </div>
      </div>

      {/* Collapsed summary strip */}
      {!expanded && (
        <div
          onClick={() => setExpanded(true)}
          className="px-3 py-1.5 flex items-center gap-1.5 cursor-pointer hover:bg-surface transition-colors"
        >
          <ListChecks className="w-3.5 h-3.5 text-foreground-muted/50" />
          <span className="text-xs text-foreground-muted">
            {totalItems} {t("kitchen.items")}
          </span>
        </div>
      )}

      {expanded && (
        <div className="p-3 space-y-2.5">
          {/* Time chips */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* Chip 1: context-aware time indicator */}
            {order.status === "preparing" ? (
              <Tooltip
                className="w-full"
                content={
                  prepRemaining > 0
                    ? t("kitchen.tooltip.prepRemaining", { remaining: prepRemaining, eta })
                    : t("kitchen.tooltip.prepOverdue", { min: Math.abs(prepRemaining), eta })
                }
              >
                <InfoChip
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label={prepRemaining > 0 ? `+${prepRemaining}m` : `-${Math.abs(prepRemaining)}m`}
                  tone={
                    urgency === "urgent"
                      ? "text-danger-500"
                      : urgency === "warning"
                        ? "text-yellow-500"
                        : "text-success-500"
                  }
                />
              </Tooltip>
            ) : order.status === "ready" || order.status === "served" ? (
              <Tooltip
                className="w-full"
                content={
                  order.preparationDuration !== undefined
                    ? t("kitchen.tooltip.prepDuration", { min: order.preparationDuration })
                    : t("kitchen.tooltip.readySince", { min: readyElapsed })
                }
              >
                <InfoChip
                  icon={
                    (order.delayMinutes ?? 0) > 0 ? (
                      <TimerReset className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )
                  }
                  label={
                    order.preparationDuration !== undefined
                      ? `${order.preparationDuration}m`
                      : `${readyElapsed}m`
                  }
                  tone={
                    urgency === "urgent"
                      ? "text-danger-500"
                      : urgency === "warning"
                        ? "text-yellow-500"
                        : undefined
                  }
                />
              </Tooltip>
            ) : (
              <Tooltip
                className="w-full"
                content={t("kitchen.tooltip.waitTime", { min: waitElapsed })}
              >
                <InfoChip
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label={`${waitElapsed}m`}
                  tone={
                    urgency === "urgent"
                      ? "text-danger-500"
                      : urgency === "warning"
                        ? "text-yellow-500"
                        : undefined
                  }
                />
              </Tooltip>
            )}

            {/* Chip 2: item count */}
            <Tooltip
              className="w-full"
              content={t("kitchen.tooltip.itemCount", { count: totalItems })}
            >
              <InfoChip
                icon={<ListChecks className="w-3.5 h-3.5" />}
                label={`${totalItems}`}
              />
            </Tooltip>

            {/* Chip 3: delay badge (ready/served) or order time */}
            {(order.status === "ready" || order.status === "served") &&
            order.delayMinutes !== undefined ? (
              <Tooltip
                className="w-full"
                content={
                  order.delayMinutes > 0
                    ? t("kitchen.tooltip.lateBy", { min: order.delayMinutes, eta, actual: order.preparationDuration ?? "—" })
                    : order.delayMinutes < 0
                      ? t("kitchen.tooltip.earlyBy", { min: Math.abs(order.delayMinutes), eta, actual: order.preparationDuration ?? "—" })
                      : t("kitchen.tooltip.onTime", { eta })
                }
              >
                <InfoChip
                  icon={<TimerReset className="w-3.5 h-3.5" />}
                  label={
                    order.delayMinutes > 0
                      ? `-${order.delayMinutes}m`
                      : order.delayMinutes < 0
                        ? `+${Math.abs(order.delayMinutes)}m`
                        : "✓"
                  }
                  tone={
                    order.delayMinutes > 0
                      ? "text-danger-500"
                      : "text-success-500"
                  }
                />
              </Tooltip>
            ) : (
              <Tooltip
                className="w-full"
                content={t("kitchen.tooltip.orderTime", {
                  time: new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                })}
              >
                <InfoChip
                  icon={<TimerReset className="w-3.5 h-3.5" />}
                  label={new Date(order.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                />
              </Tooltip>
            )}
          </div>

          {/* Checklist items */}
          <div className="space-y-1.5">
            {order.items.map((item) => {
              const done = showChecklist ? !!checked[item.id] : false;
              return (
                <div
                  key={item.id}
                  onClick={showChecklist ? (e) => toggleItem(item.id, e) : undefined}
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
                  {showChecklist && (
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200",
                        done ? "bg-success-500 border-success-500" : "border-border",
                      )}
                    >
                      {done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                  )}
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

          {/* Cancel info */}
          {isCancelled && (order.cancelReason || order.cancelledBy) && (
            <div className="flex gap-2 p-2.5 bg-danger-500/10 border border-danger-500/20 rounded-xl">
              <XCircle className="w-4 h-4 text-danger-500 shrink-0 mt-0.5" />
              <div className="min-w-0 space-y-0.5">
                {order.cancelReason && (
                  <>
                    <p className="text-[11px] font-semibold text-danger-500">
                      {t("kitchen.cancelReason")}
                    </p>
                    <p className="text-xs text-danger-600 dark:text-danger-400 break-words">
                      {order.cancelReason}
                    </p>
                  </>
                )}
                {order.cancelledBy && (
                  <p className="text-[11px] text-foreground-muted">
                    {t("kitchen.cancelledBy")}: {order.cancelledBy.name}
                  </p>
                )}
              </div>
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

          {/* ETA picker */}
          {showEtaPicker && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-foreground-muted">
                {t("kitchen.estimatedTime")}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {ETA_OPTIONS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setSelectedEta(minutes)}
                    className={cn(
                      "h-8 rounded-lg border text-xs font-bold transition-colors",
                      selectedEta === minutes
                        ? "border-primary-500 bg-primary-500/10 text-primary-500"
                        : "border-border bg-surface text-foreground-muted hover:text-foreground",
                    )}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Restore button — cancelled orders only */}
          {isCancelled && (
            <button
              onClick={() => onAction(order, "pending")}
              disabled={busy}
              className="w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border-2 border-primary-500/60 text-primary-500 hover:bg-primary-500/10 transition-all duration-200 disabled:opacity-50"
            >
              {busy ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              {t("kitchen.restoreOrder")}
            </button>
          )}

          {/* Primary action button */}
          {nextStatus && (
            <ActionButton
              busy={busy}
              targetStatus={nextStatus}
              disabled={showChecklist && !allChecked}
              onClick={() =>
                onAction(
                  order,
                  nextStatus,
                  showEtaPicker ? { estimatedTime: selectedEta } : undefined,
                )
              }
              t={t}
            />
          )}

          {/* Cancel button */}
          {nextStatus && (
            <Tooltip content={t("kitchen.tooltip.cancelOrder")} side="top">
              <button
                onClick={() => onCancelRequest(order)}
                className="w-full h-8 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-danger-500/25 text-danger-500/60 hover:border-danger-500/60 hover:text-danger-500 hover:bg-danger-500/5 transition-all duration-200"
              >
                <X className="w-3.5 h-3.5" />
                {t("kitchen.cancelOrder")}
              </button>
            </Tooltip>
          )}
        </div>
      )}
    </article>
  );
}
