import { AlertCircle } from "lucide-react";
import { Order } from "@/types";
import { cn } from "@/utils/cn";
import { groupByProduct } from "./utils";
import { ColumnId } from "./constants";

export function ProductSummaryView({
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

export function EmptyState({
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
    <div className={cn("py-12 flex flex-col items-center gap-2 text-foreground-muted")}>
      <AlertCircle className="w-8 h-8 opacity-25" />
      <p className="text-sm font-medium">{msg}</p>
    </div>
  );
}
