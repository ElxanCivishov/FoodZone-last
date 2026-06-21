import React from "react";
import { Order, OrderStatus } from "@/types";
import { cn } from "@/utils/cn";
import { ColDef, ColumnId } from "./constants";
import { OrderCard } from "./OrderCard";
import { ProductSummaryView, EmptyState } from "./ProductSummaryView";

export function KanbanColumn({
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
  onAction: (
    order: Order,
    status: OrderStatus,
    options?: { estimatedTime?: number; cancelReason?: string },
  ) => void;
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
          <EmptyState columnId={col.id as ColumnId} t={t} />
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
