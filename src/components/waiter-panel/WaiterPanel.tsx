import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Ban,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock,
  ClipboardList,
  CreditCard,
  Droplets,
  HelpCircle,
  ListChecks,
  RefreshCw,
  ScrollText,
  Sparkles,
  Table2,
  UtensilsCrossed,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useWaiterStore } from "@/stores/waiterStore";
import { useThemeStore } from "@/stores/themeStore";
import { useSocketContext } from "@/services/socket";
import { useWaiterRequests, useOrders } from "@/hooks/useDashboard";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import { useFullscreen } from "@/hooks/useFullscreen";
import { patch } from "@/services/api";
import { Order, WaiterRequest } from "@/types";
import { cn } from "@/utils/cn";
import { Tooltip } from "@/components/common/Tooltip";
import { InfoChip, StatusBadge } from "@/components/common/OrderUi";
import {
  DEFAULT_PANEL_FILTERS,
  PanelFilterState,
  PanelFilters,
  countPanelFilters,
} from "@/components/common/PanelFilters";
import {
  normalizePanelValue,
  orderMatchesPanelFilters,
  panelTableNumber as tableNumber,
} from "@/components/common/panelFiltering";
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
import { useSoundSettings } from "@/hooks/useSoundSettings";
import { playReadyOrderSound, playWaiterRequestSound } from "./sounds";

type WaiterTab = "orders" | "requests" | "accepted" | "rejected";

const requestTypeIcon: Record<WaiterRequest["type"], React.ElementType> = {
  call: Bell,
  water: Droplets,
  napkin: ScrollText,
  bill: CreditCard,
  clean: Sparkles,
  other: HelpCircle,
};

const requestTone: Record<WaiterRequest["type"], string> = {
  call: "text-primary-500",
  water: "text-blue-500",
  napkin: "text-yellow-500",
  bill: "text-success-500",
  clean: "text-danger-500",
  other: "text-foreground-muted",
};

const requestBg: Record<WaiterRequest["type"], string> = {
  call: "bg-primary-500/10 border-primary-500/25",
  water: "bg-blue-500/10 border-blue-500/25",
  napkin: "bg-yellow-500/10 border-yellow-500/25",
  bill: "bg-success-500/10 border-success-500/25",
  clean: "bg-danger-500/10 border-danger-500/25",
  other: "bg-foreground-muted/10 border-border",
};

const requestAccentBorder: Record<WaiterRequest["type"], string> = {
  call: "border-l-primary-500",
  water: "border-l-blue-500",
  napkin: "border-l-yellow-500",
  bill: "border-l-success-500",
  clean: "border-l-danger-500",
  other: "border-l-foreground-muted",
};

function elapsedMinutes(date: string) {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 60_000),
  );
}

function formatTime(date: string) {
  const d = new Date(date);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function requestMatchesFilters(request: WaiterRequest, filters: PanelFilterState) {
  const table = String(tableNumber(request));
  const query = normalizePanelValue(filters.query);
  const tableQuery = normalizePanelValue(filters.table);
  const searchable = normalizePanelValue(
    [
      request.type,
      table,
      request.message,
      request.acceptedBy?.name,
      request.rejectedBy?.name,
      request.rejectionNote,
    ]
      .filter(Boolean)
      .join(" "),
  );

  return (
    (!query || searchable.includes(query)) &&
    (!tableQuery || normalizePanelValue(table).includes(tableQuery)) &&
    (filters.type === "all" || request.type === filters.type) &&
    (!filters.notesOnly || !!request.message || !!request.rejectionNote)
  );
}

function ConfirmRejectModal({
  open,
  onClose,
  onConfirm,
  loading,
  t,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  loading?: boolean;
  t: (k: string) => string;
}) {
  const [note, setNote] = useState("");

  const handleConfirm = () => {
    onConfirm(note.trim());
    setNote("");
  };
  const handleClose = () => {
    if (loading) return;
    setNote("");
    onClose();
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </TransitionChild>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="bg-surface-elevated border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-danger-500/10 flex items-center justify-center shrink-0">
                  <Ban className="w-6 h-6 text-danger-500" />
                </div>
                <DialogTitle className="font-bold text-base">
                  {t("waiterPanel.rejectTitle")}
                </DialogTitle>
              </div>
              <p className="text-sm text-foreground-muted mb-3">
                {t("waiterPanel.rejectionNoteLabel")}
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("waiterPanel.rejectionNotePlaceholder")}
                maxLength={300}
                disabled={loading}
                className="w-full min-h-[80px] resize-none rounded-xl border border-border bg-surface p-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary-500 focus:outline-none mb-4 disabled:opacity-60"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold hover:bg-surface transition-colors disabled:opacity-60"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 h-10 rounded-xl bg-danger-500 hover:bg-danger-600 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-80"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4" />
                  )}
                  {t("waiterPanel.reject")}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

function ConfirmCancelOrderModal({
  order,
  onClose,
  onConfirm,
  loading,
  t,
}: {
  order: Order | null;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  loading?: boolean;
  t: (k: string, options?: Record<string, unknown>) => string;
}) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
    setReason("");
  };
  const handleClose = () => {
    if (loading) return;
    setReason("");
    onClose();
  };

  return (
    <Transition appear show={!!order} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </TransitionChild>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="bg-surface-elevated border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              {order && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-danger-500/10 flex items-center justify-center shrink-0">
                      <XCircle className="w-6 h-6 text-danger-500" />
                    </div>
                    <div>
                      <DialogTitle className="font-bold text-base">
                        {t("waiterPanel.cancelReadyOrder")}
                      </DialogTitle>
                      <p className="text-xs text-foreground-muted mt-0.5">
                        {t("waiterPanel.table")} {tableNumber(order)} — #
                        {order.orderNumber}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground-muted mb-4">
                    {t("waiterPanel.cancelOrderConfirm")}
                  </p>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t("kitchen.cancelReasonPlaceholder")}
                    maxLength={300}
                    disabled={loading}
                    className="w-full min-h-[76px] resize-none rounded-xl border border-border bg-surface p-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary-500 focus:outline-none mb-4 disabled:opacity-60"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleClose}
                      disabled={loading}
                      className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold hover:bg-surface transition-colors disabled:opacity-60"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={loading}
                      className="flex-1 h-10 rounded-xl bg-danger-500 hover:bg-danger-600 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-80"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      {t("waiterPanel.cancelReadyOrder")}
                    </button>
                  </div>
                </>
              )}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

function ReadyOrderCard({
  order,
  busy,
  onServe,
  onCancel,
  t,
}: {
  order: Order;
  busy: boolean;
  onServe: (order: Order) => void;
  onCancel: (order: Order) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const [expanded, setExpanded] = useState(true);
  const table = tableNumber(order);
  const readyAt = order.preparationCompletedAt ?? order.updatedAt;
  const readyFor = elapsedMinutes(readyAt);
  const shownItems = order.items.slice(0, 4);

  return (
    <article className="bg-surface-elevated border border-success-500/25 rounded-2xl overflow-hidden">
      <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-success-500/10 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-success-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-success-500 font-bold leading-none">
            {t("waiterPanel.orderReady", { orderNumber: order.orderNumber })}
          </p>
          <h3 className="font-bold text-base leading-tight truncate">
            {t("waiterPanel.table")} {table}
          </h3>
        </div>
        <StatusBadge status={order.status} t={t} />
        <Tooltip
          content={
            expanded
              ? t("waiterPanel.tooltip.collapse")
              : t("waiterPanel.tooltip.expand")
          }
          side="bottom"
        >
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground-muted/50 hover:text-foreground hover:bg-surface transition-colors"
          >
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          </button>
        </Tooltip>
      </div>

      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full px-3 py-2.5 flex items-center gap-2.5 text-left hover:bg-surface/50 transition-colors"
        >
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg shrink-0 tabular-nums",
              readyFor >= 8
                ? "bg-danger-500/15 text-danger-500"
                : readyFor >= 4
                  ? "bg-yellow-500/15 text-yellow-500"
                  : "bg-success-500/15 text-success-500",
            )}
          >
            <Clock className="w-3 h-3" />
            {readyFor}m
          </span>
          <p className="text-xs text-foreground-muted flex-1 truncate">
            {order.items
              .slice(0, 3)
              .map((i) => `${i.quantity}× ${i.product?.name ?? i.productId}`)
              .join(" · ")}
            {order.items.length > 3 && (
              <span className="text-foreground-muted/50">
                {" "}+{order.items.length - 3}
              </span>
            )}
          </p>
        </button>
      )}

      {expanded && (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-3 gap-1.5">
            <Tooltip
              className="w-full"
              content={t("waiterPanel.tooltip.readySince", { min: readyFor })}
            >
              <InfoChip
                icon={<Clock className="w-3.5 h-3.5" />}
                label={`${readyFor}m`}
                tone={
                  readyFor >= 8
                    ? "text-danger-500"
                    : readyFor >= 4
                      ? "text-yellow-500"
                      : "text-success-500"
                }
              />
            </Tooltip>
            <Tooltip
              className="w-full"
              content={t("waiterPanel.tooltip.itemCount", {
                count: order.items.length,
              })}
            >
              <InfoChip
                icon={<ListChecks className="w-3.5 h-3.5" />}
                label={`${order.items.length}`}
              />
            </Tooltip>
            <Tooltip
              className="w-full"
              content={t("waiterPanel.tooltip.orderNumber", {
                orderNumber: order.orderNumber,
              })}
            >
              <InfoChip
                icon={<Table2 className="w-3.5 h-3.5" />}
                label={`#${order.orderNumber}`}
              />
            </Tooltip>
          </div>

          <div className="space-y-1.5">
            {shownItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface p-2.5"
              >
                <span className="w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 bg-primary-500/10 text-primary-500">
                  {item.quantity}x
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm leading-tight truncate">
                    {item.product?.name ?? item.productId}
                  </p>
                  {item.extras && item.extras.length > 0 && (
                    <p className="text-[11px] text-primary-500/70 truncate">
                      + {item.extras.map((extra) => extra.name).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {order.items.length > shownItems.length && (
              <p className="text-xs text-foreground-muted px-1">
                +{order.items.length - shownItems.length}{" "}
                {t("waiterPanel.moreItems")}
              </p>
            )}
          </div>

          {order.specialRequest && (
            <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                {order.specialRequest}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Tooltip
              className="flex-1"
              content={t("waiterPanel.tooltip.cancelOrder")}
              side="top"
            >
              <button
                onClick={() => onCancel(order)}
                disabled={busy}
                className="w-full h-10 rounded-xl border border-danger-500/30 text-danger-500 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-danger-500/10 active:scale-[.98] transition-all disabled:opacity-60"
              >
                <XCircle className="w-4 h-4" />
                {t("waiterPanel.cancelReadyOrder")}
              </button>
            </Tooltip>
            <Tooltip
              className="flex-1"
              content={t("waiterPanel.tooltip.markServed")}
              side="top"
            >
              <button
                onClick={() => onServe(order)}
                disabled={busy}
                className="w-full h-10 rounded-xl bg-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-600 active:scale-[.98] transition-all disabled:opacity-60 shadow-sm"
              >
                {busy ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <UtensilsCrossed className="w-4 h-4" />
                )}
                {t("waiterPanel.markServed")}
              </button>
            </Tooltip>
          </div>
        </div>
      )}
    </article>
  );
}

function RequestCard({
  request,
  busy,
  onAccept,
  onComplete,
  onReject,
  t,
}: {
  request: WaiterRequest;
  busy: boolean;
  onAccept: (id: string) => void;
  onComplete: (id: string) => void;
  onReject: (id: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const [expanded, setExpanded] = useState(request.status !== "rejected");
  const TypeIcon = requestTypeIcon[request.type] ?? Bell;
  const typeKey = `waiterPanel.requestTypes.${request.type}`;
  const typeLabel = t(typeKey);
  const resolvedType = typeLabel === typeKey ? request.type : typeLabel;
  const elapsed = elapsedMinutes(request.createdAt);

  return (
    <article
      className={cn(
        "bg-surface-elevated border rounded-2xl overflow-hidden",
        request.status === "rejected"
          ? "border-danger-500/25"
          : request.status === "accepted"
            ? "border-success-500/25"
            : "border-border",
      )}
    >
      <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            request.status === "rejected"
              ? "bg-danger-500/10"
              : request.status === "accepted"
                ? "bg-success-500/10"
                : "bg-primary-500/10",
          )}
        >
          {request.status === "rejected" ? (
            <XCircle className="w-5 h-5 text-danger-500" />
          ) : request.status === "accepted" ? (
            <UserCheck className="w-5 h-5 text-success-500" />
          ) : (
            <TypeIcon className={cn("w-5 h-5", requestTone[request.type])} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[11px] leading-none font-semibold",
              requestTone[request.type],
            )}
          >
            {resolvedType}
          </p>
          <h3 className="font-bold text-base leading-tight truncate">
            {t("waiterPanel.table")} {tableNumber(request)}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-foreground-muted/60 font-medium tabular-nums">
            {elapsed}m
          </span>
          <StatusBadge status={request.status} t={t} />
        </div>
        <Tooltip
          content={
            expanded
              ? t("waiterPanel.tooltip.collapse")
              : t("waiterPanel.tooltip.expand")
          }
          side="bottom"
        >
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground-muted/50 hover:text-foreground hover:bg-surface transition-colors"
          >
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          </button>
        </Tooltip>
      </div>

      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full px-3 py-2.5 flex items-center gap-2.5 text-left hover:bg-surface/50 transition-colors"
        >
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg shrink-0 border",
              requestBg[request.type],
              requestTone[request.type],
            )}
          >
            <TypeIcon className="w-3 h-3" />
            {resolvedType}
          </span>
          <span
            className={cn(
              "text-xs font-semibold tabular-nums shrink-0",
              elapsed >= 8
                ? "text-danger-500"
                : elapsed >= 4
                  ? "text-yellow-500"
                  : "text-foreground-muted/60",
            )}
          >
            {elapsed}m
          </span>
          {request.message && (
            <p className="text-xs text-foreground-muted/60 flex-1 truncate">
              {request.message}
            </p>
          )}
        </button>
      )}

      {expanded && (
        <div className="p-3 space-y-3">
          {/* Type banner */}
          <Tooltip
            className="w-full"
            content={t("waiterPanel.tooltip.requestType", { type: resolvedType })}
          >
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 border",
                requestBg[request.type],
              )}
            >
              <TypeIcon className={cn("w-5 h-5 shrink-0", requestTone[request.type])} />
              <p className={cn("font-bold text-sm flex-1", requestTone[request.type])}>
                {resolvedType}
              </p>
              <Tooltip content={t("waiterPanel.tooltip.requestAge", { min: elapsed })}>
                <span
                  className={cn(
                    "text-xs font-semibold tabular-nums",
                    elapsed >= 8
                      ? "text-danger-500"
                      : elapsed >= 4
                        ? "text-yellow-500"
                        : "text-foreground-muted",
                  )}
                >
                  {elapsed}m
                </span>
              </Tooltip>
              <span className="text-[10px] text-foreground-muted/50 tabular-nums">
                {formatTime(request.createdAt)}
              </span>
            </div>
          </Tooltip>

          {request.message && (
            <div
              className={cn(
                "rounded-xl border border-border border-l-2 bg-foreground-muted/5 px-3 py-2.5",
                requestAccentBorder[request.type],
              )}
            >
              <p className="text-sm font-medium text-foreground leading-snug">
                {request.message}
              </p>
            </div>
          )}

          {request.acceptedBy && (
            <div className="flex items-center gap-2 bg-success-500/5 border border-success-500/20 rounded-xl px-3 py-2.5">
              <UserCheck className="w-3.5 h-3.5 shrink-0 text-success-500" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-success-500">
                  {t("waiterPanel.acceptedBy", { name: request.acceptedBy.name })}
                </p>
                {request.acceptedAt && (
                  <p className="text-[10px] text-success-500/60 tabular-nums mt-0.5">
                    {formatTime(request.acceptedAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {request.rejectedBy && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 bg-danger-500/5 border border-danger-500/20 rounded-xl px-3 py-2.5">
                <Ban className="w-3.5 h-3.5 shrink-0 text-danger-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-danger-500">
                    {t("waiterPanel.rejectedBy", { name: request.rejectedBy.name })}
                  </p>
                  {request.rejectedAt && (
                    <p className="text-[10px] text-danger-500/60 tabular-nums mt-0.5">
                      {formatTime(request.rejectedAt)}
                    </p>
                  )}
                </div>
              </div>
              {request.rejectionNote &&
                request.rejectionNote !== "auto-cancelled" && (
                  <p className="text-xs text-foreground-muted bg-foreground-muted/5 border border-border rounded-xl px-3 py-2">
                    {request.rejectionNote}
                  </p>
                )}
            </div>
          )}

          {request.status !== "rejected" && request.status !== "done" && (
            <div className="flex gap-2">
              <Tooltip
                className="flex-1"
                content={t("waiterPanel.tooltip.reject")}
                side="top"
              >
                <button
                  onClick={() => onReject(request.id)}
                  disabled={busy}
                  className="w-full h-10 rounded-xl border border-danger-500/30 text-danger-500 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-danger-500/10 active:scale-[.98] transition-all disabled:opacity-60"
                >
                  {busy ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4" />
                  )}
                  {t("waiterPanel.reject")}
                </button>
              </Tooltip>
              {request.status === "pending" && (
                <Tooltip
                  className="flex-1"
                  content={t("waiterPanel.tooltip.accept")}
                  side="top"
                >
                  <button
                    onClick={() => onAccept(request.id)}
                    disabled={busy}
                    className="w-full h-10 rounded-xl bg-primary-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 active:scale-[.98] transition-all disabled:opacity-60 shadow-sm"
                  >
                    {busy ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    {t("waiterPanel.accept")}
                  </button>
                </Tooltip>
              )}
              {request.status === "accepted" && (
                <Tooltip
                  className="flex-1"
                  content={t("waiterPanel.tooltip.complete")}
                  side="top"
                >
                  <button
                    onClick={() => onComplete(request.id)}
                    disabled={busy}
                    className="w-full h-10 rounded-xl bg-success-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-success-600 active:scale-[.98] transition-all disabled:opacity-60 shadow-sm"
                  >
                    {busy ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {t("waiterPanel.complete")}
                  </button>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function WaiterPanel() {
  const { t, i18n } = useTranslation();
  const { socket, isConnected } = useSocketContext();
  const queryClient = useQueryClient();
  const updateStatus = useUpdateOrderStatus();
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const isDark = resolvedTheme === "dark";
  const {
    soundEnabled,
    setSoundEnabled,
    soundDuration,
    setSoundDuration,
    soundEnabledRef,
    soundDurationRef,
  } = useSoundSettings("waiter");
  const [panelFilters, setPanelFilters] =
    useState<PanelFilterState>(DEFAULT_PANEL_FILTERS);
  const announcedReadyIdsRef = useRef(new Set<string>());
  const announcedRequestIdsRef = useRef(new Set<string>());

  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    requestId: string | null;
  }>({ open: false, requestId: null });
  const [cancelOrderModal, setCancelOrderModal] = useState<Order | null>(null);

  const {
    activeTab,
    orders,
    requests,
    setActiveTab,
    setOrders,
    setRequests,
    addOrder,
    addRequest,
    updateRequest,
    removeOrder,
    removeRequest,
  } = useWaiterStore();

  const { data: requestsData } = useWaiterRequests();
  const {
    data: ordersData,
    isLoading,
    refetch,
    isFetching,
  } = useOrders(
    { status: "ready", limit: 100 },
    { refetchInterval: 10_000, staleTime: 5_000 },
  );

  useEffect(() => {
    if (requestsData?.data) {
      setRequests(
        requestsData.data.filter((request) => request.status !== "done"),
      );
    }
  }, [requestsData, setRequests]);

  useEffect(() => {
    if (ordersData?.data) setOrders(ordersData.data);
  }, [ordersData, setOrders]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("room:join", { room: "waiters", role: "waiter" });

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["waiter-requests"] });
    };

    const handleNewRequest = (
      data: WaiterRequest & { tableNumber?: string },
    ) => {
      addRequest(data);
      invalidate();
      if (!announcedRequestIdsRef.current.has(data.id)) {
        announcedRequestIdsRef.current.add(data.id);
        if (soundEnabledRef.current) {
          playWaiterRequestSound(soundDurationRef.current);
        }
        toast(
          t("waiterPanel.newRequestToast", {
            table:
              data.table?.number ?? data.tableNumber ?? data.tableId.slice(-4),
          }),
        );
      }
    };

    const handleReadyOrder = (order: Order) => {
      addOrder(order);
      invalidate();
      if (!announcedReadyIdsRef.current.has(order.id)) {
        announcedReadyIdsRef.current.add(order.id);
        if (soundEnabledRef.current) {
          playReadyOrderSound(soundDurationRef.current);
        }
        toast.success(
          t("waiterPanel.readyToast", {
            orderNumber: order.orderNumber,
            table: tableNumber(order),
          }),
        );
      }
    };

    const handleStatusChanged = (payload: {
      orderId?: string;
      status?: string;
      order?: Order;
    }) => {
      const order = payload.order;
      const orderId = payload.orderId ?? order?.id;
      const status = payload.status ?? order?.status;
      if (!orderId || !status) return;
      if (status === "ready" && order) handleReadyOrder(order);
      if (
        status === "served" ||
        status === "cancelled" ||
        status === "preparing"
      ) {
        removeOrder(orderId);
      }
    };

    // Use addRequest to merge full request data (including acceptedBy/rejectedBy)
    const handleRequestAccepted = (request: WaiterRequest) =>
      addRequest(request);
    const handleRequestCompleted = (request: WaiterRequest) =>
      removeRequest(request.id);
    const handleRequestRejected = (request: WaiterRequest) =>
      addRequest(request);

    socket.on("waiter:new:request", handleNewRequest);
    socket.on("waiter:new:order", handleReadyOrder);
    socket.on("order:status:changed", handleStatusChanged);
    socket.on("waiter:request:accepted", handleRequestAccepted);
    socket.on("waiter:request:completed", handleRequestCompleted);
    socket.on("waiter:request:rejected", handleRequestRejected);

    return () => {
      socket.off("waiter:new:request", handleNewRequest);
      socket.off("waiter:new:order", handleReadyOrder);
      socket.off("order:status:changed", handleStatusChanged);
      socket.off("waiter:request:accepted", handleRequestAccepted);
      socket.off("waiter:request:completed", handleRequestCompleted);
      socket.off("waiter:request:rejected", handleRequestRejected);
      socket.emit("room:leave", { room: "waiters" });
    };
  }, [
    socket,
    addRequest,
    addOrder,
    updateRequest,
    removeRequest,
    removeOrder,
    queryClient,
    t,
  ]);

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "pending"),
    [requests],
  );
  const acceptedRequests = useMemo(
    () => requests.filter((request) => request.status === "accepted"),
    [requests],
  );
  const rejectedRequests = useMemo(
    () => requests.filter((request) => request.status === "rejected"),
    [requests],
  );

  const activeRequests = useMemo(() => {
    if (activeTab === "accepted") return acceptedRequests;
    if (activeTab === "rejected") return rejectedRequests;
    return pendingRequests;
  }, [activeTab, acceptedRequests, rejectedRequests, pendingRequests]);

  const filteredOrders = useMemo(
    () => orders.filter((order) => orderMatchesPanelFilters(order, panelFilters)),
    [orders, panelFilters],
  );

  const filteredActiveRequests = useMemo(
    () =>
      activeRequests.filter((request) =>
        requestMatchesFilters(request, panelFilters),
      ),
    [activeRequests, panelFilters],
  );

  const requestTypeOptions = useMemo(
    () =>
      (["call", "water", "napkin", "bill", "clean", "other"] as const).map(
        (type) => ({
          value: type,
          label: t(`waiterPanel.requestTypes.${type}`),
        }),
      ),
    [t],
  );

  const activeFilterCount = countPanelFilters({
    ...panelFilters,
    type: activeTab === "orders" ? "all" : panelFilters.type,
  });

  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  const updateRequestStatus = async (
    id: string,
    status: WaiterRequest["status"],
    rejectionNote?: string,
  ) => {
    setBusyRequestId(id);
    try {
      const res = await patch<WaiterRequest>(`/waiter-requests/${id}/status`, {
        status,
        ...(rejectionNote ? { rejectionNote } : {}),
      });
      if (status === "done") removeRequest(id);
      else if (res?.data) addRequest(res.data);
      else updateRequest(id, status);
      queryClient.invalidateQueries({ queryKey: ["waiter-requests"] });
    } catch (err: any) {
      toast.error(err?.message);
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleReject = (id: string) =>
    setRejectModal({ open: true, requestId: id });

  const handleConfirmReject = async (note: string) => {
    if (!rejectModal.requestId) return;
    await updateRequestStatus(rejectModal.requestId, "rejected", note || undefined);
    setRejectModal({ open: false, requestId: null });
  };

  const handleServeOrder = (order: Order) => {
    updateStatus.mutate(
      { orderId: order.id, status: "served" },
      {
        onSuccess: () => {
          removeOrder(order.id);
          queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  const handleCancelOrder = (order: Order) => setCancelOrderModal(order);

  const handleConfirmCancelOrder = (cancelReason?: string) => {
    if (!cancelOrderModal) return;
    updateStatus.mutate(
      { orderId: cancelOrderModal.id, status: "cancelled", cancelReason },
      {
        onSuccess: () => {
          removeOrder(cancelOrderModal.id);
          setCancelOrderModal(null);
          queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  const tabs: Array<{
    id: WaiterTab;
    label: string;
    count: number;
    icon: React.ElementType;
  }> = [
    {
      id: "orders",
      label: t("waiterPanel.ordersToServe"),
      count: orders.length,
      icon: ClipboardList,
    },
    {
      id: "requests",
      label: t("waiterPanel.newRequests"),
      count: pendingRequests.length,
      icon: Bell,
    },
    {
      id: "accepted",
      label: t("waiterPanel.acceptedRequests"),
      count: acceptedRequests.length,
      icon: UserCheck,
    },
    {
      id: "rejected",
      label: t("waiterPanel.rejectedRequests"),
      count: rejectedRequests.length,
      icon: XCircle,
    },
  ];
  const busyOrderId = updateStatus.isPending
    ? (updateStatus.variables?.orderId ?? null)
    : null;

  return (
    <div className="min-h-screen bg-surface text-foreground flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-surface-elevated/95 backdrop-blur-md">
        <div className="px-4 lg:px-6 py-3 flex items-center gap-3 overflow-hidden">
          <PanelHeaderBrand
            icon={UserCheck}
            title={t("waiterPanel.title")}
            subtitle={t("waiterPanel.liveBoard")}
            iconWrapClassName="bg-blue-500/10"
            iconClassName="text-blue-500"
          />

          <PanelControlScroller>
            <PanelLanguageSelect
              value={i18n.language}
              onChange={(lang) => i18n.changeLanguage(lang)}
            />

            <PanelFilters
              filters={panelFilters}
              onChange={setPanelFilters}
              onReset={() => setPanelFilters(DEFAULT_PANEL_FILTERS)}
              typeOptions={activeTab === "orders" ? [] : requestTypeOptions}
              activeCount={activeFilterCount}
              t={t}
            />

            {soundEnabled && (
              <>
                <PanelSoundDurationSelect
                  value={soundDuration}
                  onChange={setSoundDuration}
                  tooltip={t("waiterPanel.tooltip.soundDuration", {
                    seconds: soundDuration,
                  })}
                />
                <PanelIconButton
                  tooltip={t("waiterPanel.tooltip.testRequestSound")}
                  onClick={() => playWaiterRequestSound(soundDuration)}
                >
                  <Bell className="w-4 h-4" />
                </PanelIconButton>
                <PanelIconButton
                  tooltip={t("waiterPanel.tooltip.testReadySound")}
                  onClick={() => playReadyOrderSound(soundDuration)}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </PanelIconButton>
              </>
            )}

            <PanelSoundToggle
              enabled={soundEnabled}
              onToggle={() => setSoundEnabled((s) => !s)}
              muteLabel={t("waiterPanel.tooltip.muteSound")}
              unmuteLabel={t("waiterPanel.tooltip.unmuteSound")}
            />

            <PanelThemeToggle
              isDark={isDark}
              onToggle={toggleTheme}
              lightLabel={t("common.lightMode")}
              darkLabel={t("common.darkMode")}
            />
            <PanelFullscreenToggle
              isFullscreen={isFullscreen}
              onToggle={toggleFullscreen}
              enterLabel={t("waiterPanel.tooltip.fullscreen")}
              exitLabel={t("waiterPanel.tooltip.exitFullscreen")}
            />
            <PanelRefreshButton
              onRefresh={() => refetch()}
              loading={isFetching || isLoading}
              label={t("waiterPanel.tooltip.refresh")}
            />
            <PanelConnectionBadge
              connected={isConnected}
              connectedLabel={t("waiterPanel.online")}
              disconnectedLabel={t("waiterPanel.offline")}
            />
          </PanelControlScroller>
        </div>

        <div className="px-4 lg:px-6 py-4 flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "shrink-0 cursor-pointer px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5",
                  activeTab === tab.id
                    ? "bg-primary-500 text-white border-primary-500"
                    : "border-border text-foreground-muted hover:text-foreground",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                <span
                  className={cn(
                    "min-w-5 h-5 px-1 rounded-full flex items-center justify-center",
                    activeTab === tab.id
                      ? "bg-white/20"
                      : "bg-foreground-muted/10",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4">
        {activeTab === "orders" ? (
          filteredOrders.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2 text-foreground-muted">
              <CheckCircle2 className="w-9 h-9 opacity-25" />
              <p className="text-sm font-medium">
                {orders.length === 0
                  ? t("waiterPanel.noOrders")
                  : t("filters.noResults")}
              </p>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 xl:columns-3 gap-3">
              {filteredOrders.map((order) => (
                <div key={order.id} className="break-inside-avoid mb-3">
                  <ReadyOrderCard
                    order={order}
                    busy={busyOrderId === order.id}
                    onServe={handleServeOrder}
                    onCancel={handleCancelOrder}
                    t={t}
                  />
                </div>
              ))}
            </div>
          )
        ) : filteredActiveRequests.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-foreground-muted">
            <Bell className="w-9 h-9 opacity-25" />
            <p className="text-sm font-medium">
              {activeRequests.length === 0
                ? activeTab === "rejected"
                  ? t("waiterPanel.noRejected")
                  : t("waiterPanel.noRequests")
                : t("filters.noResults")}
            </p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 xl:columns-3 gap-3">
            {filteredActiveRequests.map((request) => (
              <div key={request.id} className="break-inside-avoid mb-3">
                <RequestCard
                  request={request}
                  busy={busyRequestId === request.id}
                  onAccept={(id) => updateRequestStatus(id, "accepted")}
                  onComplete={(id) => updateRequestStatus(id, "done")}
                  onReject={handleReject}
                  t={t}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <ConfirmRejectModal
        open={rejectModal.open}
        onClose={() => setRejectModal({ open: false, requestId: null })}
        onConfirm={handleConfirmReject}
        loading={busyRequestId === rejectModal.requestId && busyRequestId !== null}
        t={t}
      />
      <ConfirmCancelOrderModal
        order={cancelOrderModal}
        onClose={() => setCancelOrderModal(null)}
        onConfirm={handleConfirmCancelOrder}
        loading={updateStatus.isPending && updateStatus.variables?.orderId === cancelOrderModal?.id}
        t={t}
      />
    </div>
  );
}
